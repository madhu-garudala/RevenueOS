import json
import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
sfn = boto3.client("stepfunctions", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
STATE_MACHINE_ARN = os.environ["STATE_MACHINE_ARN"]

INTENT_PROMPT = """You are a revenue intelligence AI. Analyse this customer message and return ONLY a JSON object with no markdown, no explanation, just the JSON.

Customer message: "{message}"
Customer name (may be unknown): "{name}"
Company (may be unknown): "{company}"
Channel: "{channel}"

Return this exact JSON structure:
{{
  "intent": "one of: proposal_request | pricing_inquiry | support_request | ready_to_buy | general_inquiry | complaint",
  "urgency": "one of: high | medium | low",
  "sentiment": "one of: positive | neutral | frustrated | negative",
  "revenue_risk": "one of: high | medium | low",
  "intent_reasoning": "one sentence explaining your classification",
  "extracted_name": "the person's name extracted from the message, or the provided name if already known",
  "extracted_company": "the company name extracted from the message, or the provided company if already known"
}}

Rules:
- revenue_risk=high means there is real risk of losing this deal if we don't act immediately
- urgency=high means the customer needs a response within hours not days
- Be decisive. Never return null values.
- For extracted_name and extracted_company: if the message says "this is Arjun from Zepto", return "Arjun" and "Zepto". If you cannot determine them, return the provided values."""


def lambda_handler(event, context):
    lead_id = event.get("leadId") or event.get("lead_id")

    table = dynamodb.Table(TABLE_NAME)
    response = table.get_item(Key={"leadId": lead_id})
    lead = response["Item"]

    prompt = INTENT_PROMPT.format(
        message=lead["message"],
        name=lead["name"],
        company=lead["company"],
        channel=lead["channel"],
    )

    bedrock_response = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 512, "temperature": 0.1},
    )

    raw_text = bedrock_response["output"]["message"]["content"][0]["text"].strip()

    # Strip markdown code fences if present
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])

    analysis = json.loads(raw_text)

    extracted_name = analysis.get("extracted_name") or lead["name"]
    extracted_company = analysis.get("extracted_company") or lead["company"]

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression=(
            "SET #st = :st, intent = :i, urgency = :u, sentiment = :s, "
            "revenue_risk = :r, intent_reasoning = :ir, "
            "#nm = :nm, company = :co, updated_at = :ua"
        ),
        ExpressionAttributeNames={"#st": "status", "#nm": "name"},
        ExpressionAttributeValues={
            ":st": "ANALYZED",
            ":i": analysis["intent"],
            ":u": analysis["urgency"],
            ":s": analysis["sentiment"],
            ":r": analysis["revenue_risk"],
            ":ir": analysis["intent_reasoning"],
            ":nm": extracted_name,
            ":co": extracted_company,
            ":ua": now,
        },
    )

    # Start Step Functions execution
    sfn.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        input=json.dumps({"leadId": lead_id}),
    )

    return {"leadId": lead_id, "analysis": analysis}
