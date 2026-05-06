import json
import os
from datetime import datetime, timezone
import boto3
import stripe

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
secrets = boto3.client("secretsmanager", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
SECRET_STRIPE = os.environ["SECRET_STRIPE"]


def get_stripe_key():
    response = secrets.get_secret_value(SecretId=SECRET_STRIPE)
    secret = json.loads(response["SecretString"])
    return secret["STRIPE_SECRET_KEY"]


def lambda_handler(event, context):
    lead_id = event.get("leadId")

    stripe.api_key = get_stripe_key()

    table = dynamodb.Table(TABLE_NAME)
    resp = table.get_item(Key={"leadId": lead_id})
    lead = resp["Item"]

    # Create a Stripe Price for a one-time product
    product = stripe.Product.create(
        name=f"RevenueOS Enterprise — {lead.get('company', 'Client')}",
        description="Autonomous Revenue Operations Platform",
    )

    price = stripe.Price.create(
        product=product.id,
        unit_amount=99900,  # $999.00 in cents
        currency="usd",
    )

    payment_link = stripe.PaymentLink.create(
        line_items=[{"price": price.id, "quantity": 1}],
    )

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET stripe_link = :sl, updated_at = :ua",
        ExpressionAttributeValues={
            ":sl": payment_link.url,
            ":ua": now,
        },
    )

    return {"leadId": lead_id, "stripe_link": payment_link.url}
