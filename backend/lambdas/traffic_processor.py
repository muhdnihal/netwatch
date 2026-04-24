"""
Lambda Function: net-traffic-processor
Trigger: SQS Queue (netwatch-traffic-queue)  <-- FREE TIER (replaces Kinesis)
Purpose: Process VPC Flow Log records, detect anomalies, publish SNS alerts
FREE TIER: Lambda 1M req/month + SQS 1M req/month
"""
import json
import boto3
import os
from datetime import datetime

sns_client     = boto3.client('sns')
cloudwatch     = boto3.client('cloudwatch')
dynamodb       = boto3.resource('dynamodb')
s3_client      = boto3.client('s3')

SNS_TOPIC_ARN          = os.environ.get('SNS_TOPIC_ARN', '')
DYNAMO_TABLE           = os.environ.get('DYNAMO_TABLE', 'netwatch-traffic-logs')
ALERT_THRESHOLD_BYTES  = int(os.environ.get('ALERT_THRESHOLD_BYTES', '10000000'))
FAILED_AUTH_THRESHOLD  = int(os.environ.get('FAILED_AUTH_THRESHOLD', '100'))


def lambda_handler(event, context):
    """
    Triggered by SQS. Each SQS message body is either:
      - A raw VPC flow log line, OR
      - A JSON-encoded log entry
    """
    table           = dynamodb.Table(DYNAMO_TABLE)
    suspicious_ips  = {}
    total_bytes     = 0
    processed       = 0

    for record in event.get('Records', []):
        body = record.get('body', '')

        # Try JSON first, fall back to raw VPC flow log format
        try:
            log_entry = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            log_entry = parse_vpc_flow_log(body)

        if not log_entry:
            continue

        processed   += 1
        bytes_count  = safe_int(log_entry.get('bytes', 0))
        total_bytes += bytes_count
        src_ip       = log_entry.get('srcaddr', log_entry.get('src_ip', ''))
        action       = log_entry.get('action', '').upper()
        dst_port     = safe_int(log_entry.get('dstport', log_entry.get('dst_port', 0)))

        # Store in DynamoDB
        store_log(table, log_entry)

        # Brute-force SSH detection: repeated REJECT on port 22
        if action in ('REJECT', 'DENY') and dst_port == 22:
            suspicious_ips[src_ip] = suspicious_ips.get(src_ip, 0) + 1

    # Push metrics to CloudWatch
    if processed:
        put_cloudwatch_metrics(total_bytes, processed)

    # Fire alerts
    for ip, count in suspicious_ips.items():
        if count >= FAILED_AUTH_THRESHOLD:
            publish_alert(
                severity='CRITICAL',
                title=f'Brute Force SSH Detected from {ip}',
                message=(
                    f'{count} REJECT events on port 22 from {ip} '
                    f'in this SQS batch.'
                ),
                source_ip=ip
            )

    if total_bytes > ALERT_THRESHOLD_BYTES:
        publish_alert(
            severity='WARNING',
            title='High Traffic Volume Detected',
            message=f'Processed {total_bytes / 1_000_000:.2f} MB in one SQS batch.',
            source_ip='N/A'
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed':        processed,
            'total_bytes':      total_bytes,
            'alerts_triggered': len([c for c in suspicious_ips.values()
                                     if c >= FAILED_AUTH_THRESHOLD])
        })
    }


# ── helpers ──────────────────────────────────────────────────────────────────

def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_vpc_flow_log(raw_line: str) -> dict | None:
    """Parse a raw space-separated VPC Flow Log line."""
    fields = [
        'version', 'account_id', 'interface_id', 'srcaddr', 'dstaddr',
        'srcport', 'dstport', 'protocol', 'packets', 'bytes',
        'start', 'end', 'action', 'log_status'
    ]
    parts = raw_line.strip().split()
    if len(parts) < len(fields):
        return None
    entry = dict(zip(fields, parts))
    for int_field in ('bytes', 'packets', 'srcport', 'dstport'):
        entry[int_field] = safe_int(entry.get(int_field, 0))
    return entry


def store_log(table, log_entry: dict):
    """Persist a single log entry in DynamoDB with a 7-day TTL."""
    now = datetime.utcnow()
    item = {
        'log_id':    f"{log_entry.get('srcaddr', log_entry.get('src_ip', 'unknown'))}"
                     f"-{now.isoformat()}",
        'timestamp': now.isoformat(),
        'src_ip':    str(log_entry.get('srcaddr',  log_entry.get('src_ip',  '-'))),
        'dst_ip':    str(log_entry.get('dstaddr',  log_entry.get('dst_ip',  '-'))),
        'src_port':  str(log_entry.get('srcport',  log_entry.get('src_port', '-'))),
        'dst_port':  str(log_entry.get('dstport',  log_entry.get('dst_port', '-'))),
        'protocol':  str(log_entry.get('protocol', '-')),
        'bytes':     str(log_entry.get('bytes', 0)),
        'action':    str(log_entry.get('action', '-')),
        'ttl':       int(now.timestamp()) + 86400 * 7,
    }
    try:
        table.put_item(Item=item)
    except Exception as exc:
        print(f"[DynamoDB] write error: {exc}")


def put_cloudwatch_metrics(total_bytes: int, record_count: int):
    """Publish custom metrics to CloudWatch (free tier: 10 metrics)."""
    try:
        cloudwatch.put_metric_data(
            Namespace='NetWatch/Traffic',
            MetricData=[
                {
                    'MetricName': 'BytesProcessed',
                    'Value':      total_bytes,
                    'Unit':       'Bytes',
                    'Dimensions': [{'Name': 'Function',
                                    'Value': 'net-traffic-processor'}]
                },
                {
                    'MetricName': 'LogRecordsProcessed',
                    'Value':      record_count,
                    'Unit':       'Count',
                    'Dimensions': [{'Name': 'Function',
                                    'Value': 'net-traffic-processor'}]
                },
            ]
        )
    except Exception as exc:
        print(f"[CloudWatch] metrics error: {exc}")


def publish_alert(severity: str, title: str, message: str, source_ip: str):
    """Publish an alert to the SNS topic."""
    if not SNS_TOPIC_ARN:
        print(f"[SNS] no topic ARN configured. Alert skipped: {title}")
        return
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"[NetWatch {severity}] {title}",
            Message=json.dumps({
                'severity':   severity,
                'title':      title,
                'message':    message,
                'source_ip':  source_ip,
                'timestamp':  datetime.utcnow().isoformat(),
                'service':    'NetWatch Traffic Monitor'
            }, indent=2)
        )
    except Exception as exc:
        print(f"[SNS] publish error: {exc}")
