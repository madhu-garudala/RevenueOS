import base64
import json
import os
import time
import uuid
from datetime import datetime, timezone
import urllib.request
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
s3 = boto3.client("s3", region_name="us-east-1")
transcribe = boto3.client("transcribe", region_name="us-east-1")
sfn = boto3.client("stepfunctions", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
S3_PROPOSALS_BUCKET = os.environ["S3_PROPOSALS_BUCKET"]
STATE_MACHINE_ARN = os.environ["STATE_MACHINE_ARN"]

TRANSCRIPT_PROMPT = """You are a sales intelligence AI analysing a call transcript. Return ONLY a JSON object.

Transcript: "{transcript}"

Return this exact JSON:
{{
  "sentiment": "one of: positive | neutral | negative",
  "key_topics": ["list of main topics discussed"],
  "action_items": ["explicit commitments made — e.g. send contract by Thursday"],
  "implicit_commitments": ["implied next steps — e.g. will follow up next week"],
  "deal_stage": "one of: early | mid | late | closed_won | closed_lost",
  "deal_risk": "one of: high | medium | low",
  "summary": "2 sentence summary of the call"
}}

Be precise about action items. If someone says "I'll send that over" that is an action item.
Never return null values. If a field has no data return an empty array or appropriate default."""


def lambda_handler(event, context):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])
    else:
        body = event

    audio_b64 = body.get("audio")
    if not audio_b64:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "No audio provided"}),
        }

    audio_bytes = base64.b64decode(audio_b64)
    audio_key = f"transcripts/{uuid.uuid4()}.wav"

    s3.put_object(
        Bucket=S3_PROPOSALS_BUCKET,
        Key=audio_key,
        Body=audio_bytes,
        ContentType="audio/wav",
    )

    job_name = f"rev-os-{uuid.uuid4().hex[:12]}"
    media_uri = f"s3://{S3_PROPOSALS_BUCKET}/{audio_key}"

    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        MediaFormat="wav",
        Media={"MediaFileUri": media_uri},
        LanguageCode="en-US",
    )

    # Poll until complete (max 60s)
    for _ in range(30):
        time.sleep(2)
        job = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = job["TranscriptionJob"]["TranscriptionJobStatus"]
        if status == "COMPLETED":
            break
        if status == "FAILED":
            raise Exception(f"Transcription failed: {job['TranscriptionJob'].get('FailureReason')}")

    transcript_uri = job["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
    with urllib.request.urlopen(transcript_uri) as resp:
        transcript_data = json.loads(resp.read())
    transcript_text = transcript_data["results"]["transcripts"][0]["transcript"]

    # Analyse with Bedrock
    prompt = TRANSCRIPT_PROMPT.format(transcript=transcript_text)
    bedrock_resp = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 1024, "temperature": 0.1},
    )
    raw = bedrock_resp["output"]["message"]["content"][0]["text"].strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
    analysis = json.loads(raw)

    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "leadId": lead_id,
        "name": body.get("name", "Voice Caller"),
        "company": body.get("company", "Unknown"),
        "email": body.get("email", ""),
        "message": transcript_text[:500],
        "channel": "voice",
        "status": "ANALYZED",
        "intent": "general_inquiry",
        "urgency": "medium",
        "sentiment": analysis.get("sentiment", "neutral"),
        "revenue_risk": analysis.get("deal_risk", "medium"),
        "intent_reasoning": analysis.get("summary", ""),
        "reply_sent": False,
        "reply_content": None,
        "stripe_link": None,
        "proposal_url": None,
        "slack_notified": False,
        "followup_scheduled": False,
        "followup_sent": False,
        "transcript": transcript_text,
        "call_action_items": analysis.get("action_items", []),
        "call_sentiment": analysis.get("sentiment", "neutral"),
        "call_deal_risk": analysis.get("deal_risk", "medium"),
        "call_key_topics": analysis.get("key_topics", []),
        "call_deal_stage": analysis.get("deal_stage", "early"),
        "call_summary": analysis.get("summary", ""),
        "escalated": False,
        "error_log": [],
        "created_at": now,
        "updated_at": now,
    }

    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item=item)

    # Kick off the Step Functions workflow
    sfn.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        input=json.dumps({"leadId": lead_id}),
    )

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(
            {
                "leadId": lead_id,
                "transcript": transcript_text,
                "analysis": analysis,
            }
        ),
    }
