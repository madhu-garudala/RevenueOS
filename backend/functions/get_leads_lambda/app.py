import json
import os
from datetime import datetime, timezone
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]


def decimal_default(obj):
    import decimal
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError


def lambda_handler(event, context):
    table = dynamodb.Table(TABLE_NAME)

    # Scan all items
    items = []
    scan_kwargs = {}
    while True:
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))
        if "LastEvaluatedKey" not in resp:
            break
        scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]

    # Sort by created_at descending
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Limit to 50
    leads = items[:50]

    # Aggregate metrics
    today_str = datetime.now(timezone.utc).date().isoformat()
    total_today = sum(
        1 for i in items if i.get("created_at", "").startswith(today_str)
    )
    high_risk_count = sum(1 for i in items if i.get("revenue_risk") == "high")
    actions_executed = sum(1 for i in items if i.get("status") == "COMPLETED")
    estimated_revenue = actions_executed * 999

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(
            {
                "leads": leads,
                "metrics": {
                    "total_today": total_today,
                    "high_risk_count": high_risk_count,
                    "actions_executed": actions_executed,
                    "estimated_revenue": estimated_revenue,
                },
            },
            default=decimal_default,
        ),
    }
