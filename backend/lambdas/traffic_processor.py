"""
Lambda Function: net-traffic-processor
Trigger: Kinesis Data Stream (net-traffic-stream)
Purpose: Process VPC Flow Log records, detect anomalies, publish SNS alerts
"""
import json
import boto3
import base64
import os
from datetime import datetime

sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
DYNAMO_TABLE = os.environ.get('DYNAMO_TABLE', 'netwatch-traffic-logs')
ALERT_THRESHOLD_BYTES = int(os.environ.get('ALERT_THRESHOLD_BYTES', 10_000_000))  # 10MB
FAILED_AUTH_THRESHOLD = int(os.environ.get('FAILED_AUTH_THRESHOLD', 100))

def lambda_handler(event, context):
    table = dynamodb.Table(DYNAMO_TABLE)
    suspicious_ips = {}
    total_bytes = 0

    for record in event['Records']:
        # Kinesis records are base64 encoded
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        
        try:
            log_entry = json.loads(payload)
        except json.JSONDecodeError:
            # Parse raw VPC flow log format
            log_entry = parse_vpc_flow_log(payload)

        if not log_entry:
            continue

        # Store in DynamoDB
        store_log(table, log_entry)

        # Accumulate metrics
        total_bytes += log_entry.get('bytes', 0)
        src_ip = log_entry.get('srcaddr', '')

        # Detect port scan / brute force (repeated DENY on port 22)
        if log_entry.get('action') == 'REJECT' and log_entry.get('dstport') == 22:
            suspicious_ips[src_ip] = suspicious_ips.get(src_ip, 0) + 1

    # Publish CloudWatch metrics
    put_cloudwatch_metrics(total_bytes, len(event['Records']))

    # Fire alerts
    for ip, count in suspicious_ips.items():
        if count >= FAILED_AUTH_THRESHOLD:
            publish_alert(
                severity='CRITICAL',
                title=f'Brute Force SSH Detected from {ip}',
                message=f'{count} REJECT events on port 22 from {ip} in current batch.',
                source_ip=ip
            )

    # Traffic spike alert
    if total_bytes > ALERT_THRESHOLD_BYTES:
        publish_alert(
            severity='WARNING',
            title='High Traffic Volume Detected',
            message=f'Processed {total_bytes / 1_000_000:.2f} MB in a single Kinesis batch.',
            source_ip='N/A'
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(event['Records']),
            'total_bytes': total_bytes,
            'alerts_triggered': len(suspicious_ips)
        })
    }


def parse_vpc_flow_log(raw_line):
    """Parse raw VPC Flow Log line format."""
    fields = [
        'version', 'account_id', 'interface_id', 'srcaddr', 'dstaddr',
        'srcport', 'dstport', 'protocol', 'packets', 'bytes',
        'start', 'end', 'action', 'log_status'
    ]
    parts = raw_line.strip().split()
    if len(parts) < len(fields):
        return None
    entry = dict(zip(fields, parts))
    try:
        entry['bytes'] = int(entry.get('bytes', 0))
        entry['packets'] = int(entry.get('packets', 0))
        entry['srcport'] = int(entry.get('srcport', 0))
        entry['dstport'] = int(entry.get('dstport', 0))
    except ValueError:
        pass
    return entry


def store_log(table, log_entry):
    """Store log entry in DynamoDB with TTL."""
    item = {
        'log_id': f"{log_entry.get('srcaddr', 'unknown')}-{datetime.utcnow().isoformat()}",
        'timestamp': datetime.utcnow().isoformat(),
        'src_ip': log_entry.get('srcaddr', '-'),
        'dst_ip': log_entry.get('dstaddr', '-'),
        'src_port': str(log_entry.get('srcport', '-')),
        'dst_port': str(log_entry.get('dstport', '-')),
        'protocol': log_entry.get('protocol', '-'),
        'bytes': str(log_entry.get('bytes', 0)),
        'action': log_entry.get('action', '-'),
        'ttl': int(datetime.utcnow().timestamp()) + 86400 * 7  # 7 day TTL
    }
    try:
        table.put_item(Item=item)
    except Exception as e:
        print(f"DynamoDB error: {e}")


def put_cloudwatch_metrics(total_bytes, record_count):
    """Push custom metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace='NetWatch/Traffic',
            MetricData=[
                {
                    'MetricName': 'BytesProcessed',
                    'Value': total_bytes,
                    'Unit': 'Bytes',
                    'Dimensions': [{'Name': 'Function', 'Value': 'net-traffic-processor'}]
                },
                {
                    'MetricName': 'LogRecordsProcessed',
                    'Value': record_count,
                    'Unit': 'Count',
                    'Dimensions': [{'Name': 'Function', 'Value': 'net-traffic-processor'}]
                }
            ]
        )
    except Exception as e:
        print(f"CloudWatch metrics error: {e}")


def publish_alert(severity, title, message, source_ip):
    """Publish alert to SNS topic."""
    if not SNS_TOPIC_ARN:
        print(f"SNS_TOPIC_ARN not configured. Alert: {title}")
        return
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"[NetWatch {severity}] {title}",
            Message=json.dumps({
                'severity': severity,
                'title': title,
                'message': message,
                'source_ip': source_ip,
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'NetWatch Traffic Monitor'
            }, indent=2)
        )
    except Exception as e:
        print(f"SNS publish error: {e}")
