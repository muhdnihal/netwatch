"""
Lambda Function: netwatch-api
Trigger: API Gateway (REST)
Purpose: Serve traffic metrics and log data to the React frontend
FREE TIER: Lambda 1M req/month + API Gateway 1M calls/month
"""
import json
import boto3
import os
from datetime import datetime, timedelta

cloudwatch  = boto3.client('cloudwatch')
dynamodb    = boto3.resource('dynamodb')
guardduty   = boto3.client('guardduty')
athena      = boto3.client('athena')
sqs_client  = boto3.client('sqs')

DYNAMO_TABLE     = os.environ.get('DYNAMO_TABLE',     'netwatch-traffic-logs')
ATHENA_DATABASE  = os.environ.get('ATHENA_DATABASE',  'netwatch_db')
ATHENA_OUTPUT    = os.environ.get('ATHENA_OUTPUT',    's3://netwatch-flow-logs-bucket/athena-results/')
SQS_QUEUE_URL    = os.environ.get('SQS_QUEUE_URL',    '')

CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type':                 'application/json',
}


def lambda_handler(event, context):
    method = event.get('httpMethod', 'GET')
    path   = event.get('path', '/')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        params = event.get('queryStringParameters') or {}

        if path == '/api/metrics':
            body = get_cloudwatch_metrics()
        elif path == '/api/logs':
            body = get_flow_logs(limit=int(params.get('limit', 50)))
        elif path == '/api/alerts':
            body = get_guardduty_findings()
        elif path == '/api/summary':
            body = get_traffic_summary()
        elif path == '/api/queue-stats':
            body = get_sqs_stats()
        else:
            return {
                'statusCode': 404,
                'headers':    CORS_HEADERS,
                'body':       json.dumps({'error': 'Not found'}),
            }

        return {'statusCode': 200, 'headers': CORS_HEADERS,
                'body': json.dumps(body, default=str)}

    except Exception as exc:
        return {
            'statusCode': 500,
            'headers':    CORS_HEADERS,
            'body':       json.dumps({'error': str(exc)}),
        }


# ── endpoint handlers ─────────────────────────────────────────────────────────

def get_cloudwatch_metrics() -> dict:
    """Fetch last 24 h custom metrics from CloudWatch."""
    end_time   = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)
    result     = {}

    for metric_name in ('BytesProcessed', 'LogRecordsProcessed'):
        try:
            response = cloudwatch.get_metric_statistics(
                Namespace='NetWatch/Traffic',
                MetricName=metric_name,
                Dimensions=[{'Name': 'Function',
                             'Value': 'net-traffic-processor'}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Sum', 'Average', 'Maximum'],
            )
            result[metric_name] = sorted(
                response.get('Datapoints', []),
                key=lambda x: x['Timestamp']
            )
        except Exception as exc:
            result[metric_name] = {'error': str(exc)}

    return result


def get_flow_logs(limit: int = 50) -> dict:
    """Fetch recent flow logs from DynamoDB."""
    table = dynamodb.Table(DYNAMO_TABLE)
    try:
        response = table.scan(Limit=limit)
        items    = response.get('Items', [])
        return {
            'logs':  sorted(items,
                            key=lambda x: x.get('timestamp', ''),
                            reverse=True),
            'count': len(items),
        }
    except Exception as exc:
        return {'logs': [], 'error': str(exc)}


def get_guardduty_findings() -> dict:
    """Fetch active GuardDuty findings (severity >= 4)."""
    try:
        detectors   = guardduty.list_detectors()
        detector_ids = detectors.get('DetectorIds', [])
        if not detector_ids:
            return {'findings': [], 'message': 'No GuardDuty detectors found'}

        detector_id = detector_ids[0]
        finding_ids = guardduty.list_findings(
            DetectorId=detector_id,
            FindingCriteria={
                'Criterion': {
                    'service.archived': {'Eq': ['false']},
                    'severity':         {'Gte': 4},
                }
            },
            MaxResults=20,
        ).get('FindingIds', [])

        if not finding_ids:
            return {'findings': []}

        findings = guardduty.get_findings(
            DetectorId=detector_id,
            FindingIds=finding_ids,
        ).get('Findings', [])

        return {
            'findings': [
                {
                    'id':          f['Id'],
                    'type':        f['Type'],
                    'severity':    f['Severity'],
                    'title':       f['Title'],
                    'description': f['Description'],
                    'created':     f['CreatedAt'],
                    'region':      f['Region'],
                }
                for f in findings
            ]
        }
    except Exception as exc:
        return {'findings': [], 'error': str(exc)}


def get_traffic_summary() -> dict:
    """Submit an Athena query for a 24 h traffic summary."""
    query = """
        SELECT
            action,
            COUNT(*)    AS count,
            SUM(bytes)  AS total_bytes,
            AVG(bytes)  AS avg_bytes
        FROM   netwatch_db.vpc_flow_logs
        WHERE  dt >= DATE_FORMAT(DATE_ADD('day', -1, NOW()), '%Y/%m/%d')
        GROUP  BY action
        ORDER  BY count DESC
    """
    try:
        response = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            ResultConfiguration={'OutputLocation': ATHENA_OUTPUT},
        )
        return {
            'query_execution_id': response['QueryExecutionId'],
            'message': 'Query submitted successfully.',
        }
    except Exception as exc:
        return {'error': str(exc)}


def get_sqs_stats() -> dict:
    """Return approximate SQS queue depth (free CloudWatch attribute)."""
    if not SQS_QUEUE_URL:
        return {'error': 'SQS_QUEUE_URL not configured'}
    try:
        attrs = sqs_client.get_queue_attributes(
            QueueUrl=SQS_QUEUE_URL,
            AttributeNames=[
                'ApproximateNumberOfMessages',
                'ApproximateNumberOfMessagesNotVisible',
            ],
        )['Attributes']
        return {
            'messages_available':  int(attrs.get('ApproximateNumberOfMessages',         0)),
            'messages_inflight':   int(attrs.get('ApproximateNumberOfMessagesNotVisible', 0)),
        }
    except Exception as exc:
        return {'error': str(exc)}
