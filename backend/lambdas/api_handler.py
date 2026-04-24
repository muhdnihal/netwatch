"""
Lambda Function: netwatch-api
Trigger: API Gateway (REST)
Purpose: Serve traffic metrics and log data to the React frontend
"""
import json
import boto3
import os
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')
guardduty = boto3.client('guardduty')
athena = boto3.client('athena')

DYNAMO_TABLE = os.environ.get('DYNAMO_TABLE', 'netwatch-traffic-logs')
ATHENA_DATABASE = os.environ.get('ATHENA_DATABASE', 'netwatch_db')
ATHENA_OUTPUT = os.environ.get('ATHENA_OUTPUT', 's3://netwatch-flow-logs-bucket/athena-results/')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json'
}


def lambda_handler(event, context):
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        if path == '/api/metrics':
            body = get_cloudwatch_metrics()
        elif path == '/api/logs':
            params = event.get('queryStringParameters') or {}
            body = get_flow_logs(limit=int(params.get('limit', 50)))
        elif path == '/api/alerts':
            body = get_guardduty_findings()
        elif path == '/api/summary':
            body = get_traffic_summary()
        else:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(body)}

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }


def get_cloudwatch_metrics():
    """Fetch last 24h metrics from CloudWatch."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)
    
    metrics = ['BytesProcessed', 'LogRecordsProcessed']
    result = {}

    for metric_name in metrics:
        try:
            response = cloudwatch.get_metric_statistics(
                Namespace='NetWatch/Traffic',
                MetricName=metric_name,
                Dimensions=[{'Name': 'Function', 'Value': 'net-traffic-processor'}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Sum', 'Average', 'Maximum']
            )
            result[metric_name] = sorted(
                response.get('Datapoints', []),
                key=lambda x: x['Timestamp']
            )
        except Exception as e:
            result[metric_name] = {'error': str(e)}

    return result


def get_flow_logs(limit=50):
    """Fetch recent flow logs from DynamoDB."""
    table = dynamodb.Table(DYNAMO_TABLE)
    try:
        response = table.scan(Limit=limit)
        items = response.get('Items', [])
        return {
            'logs': sorted(items, key=lambda x: x.get('timestamp', ''), reverse=True),
            'count': len(items)
        }
    except Exception as e:
        return {'logs': [], 'error': str(e)}


def get_guardduty_findings():
    """Fetch active GuardDuty findings."""
    try:
        detectors = guardduty.list_detectors()
        detector_ids = detectors.get('DetectorIds', [])
        
        if not detector_ids:
            return {'findings': [], 'message': 'No GuardDuty detectors found'}

        detector_id = detector_ids[0]
        finding_ids = guardduty.list_findings(
            DetectorId=detector_id,
            FindingCriteria={
                'Criterion': {
                    'service.archived': {'Eq': ['false']},
                    'severity': {'Gte': 4}
                }
            },
            MaxResults=20
        ).get('FindingIds', [])

        if not finding_ids:
            return {'findings': []}

        findings = guardduty.get_findings(
            DetectorId=detector_id,
            FindingIds=finding_ids
        ).get('Findings', [])

        return {
            'findings': [
                {
                    'id': f['Id'],
                    'type': f['Type'],
                    'severity': f['Severity'],
                    'title': f['Title'],
                    'description': f['Description'],
                    'created': f['CreatedAt'],
                    'region': f['Region']
                }
                for f in findings
            ]
        }
    except Exception as e:
        return {'findings': [], 'error': str(e)}


def get_traffic_summary():
    """Run Athena query for traffic summary."""
    query = """
        SELECT 
            action,
            COUNT(*) as count,
            SUM(bytes) as total_bytes,
            AVG(bytes) as avg_bytes
        FROM vpc_flow_logs
        WHERE dt >= DATE_FORMAT(DATE_ADD('day', -1, NOW()), '%Y/%m/%d')
        GROUP BY action
        ORDER BY count DESC
    """
    try:
        response = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            ResultConfiguration={'OutputLocation': ATHENA_OUTPUT}
        )
        return {
            'query_execution_id': response['QueryExecutionId'],
            'message': 'Query submitted. Poll /api/athena/{id} for results.'
        }
    except Exception as e:
        return {'error': str(e)}
