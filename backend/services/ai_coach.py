"""
AI Coach Verification — Stateless Claude API calls
Each call is completely independent — no DB access, no history, no cross-contamination.
"""

import json
import os

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

from config import Config


def ai_verify_coach(application: dict) -> dict:
    """
    Verify a coach application using Claude API.
    Completely stateless — no DB read, no history.
    Each call is independent and isolated.
    """
    prompt = f"""
You are a sports coach verification system for SportTalentHunt,
a platform discovering rural athletic talent in India.

Review this ONE application. You have NO context of past decisions.
Return ONLY valid JSON, no explanation, no markdown.

APPLICATION:
Name: {application.get('name', 'Unknown')}
Sport: {application.get('sport', 'Unknown')}
Experience: {application.get('years', 0)} years
Organisation: {application.get('org', 'Unknown')}
Certificate body: {application.get('cert_text', 'No certificate provided')}
Personal statement: {application.get('statement', 'No statement provided')}

Known legitimate Indian sports bodies:
SAI, NIS Patiala, BCCI, AIFF, AFI, Hockey India,
Wrestling Federation of India, state sports authorities,
Khelo India centres, district sports offices, NSFs.

Return this exact JSON:
{{
  "score": <integer 0-100>,
  "decision": "<approve|reject|review>",
  "cert_valid": <true|false|null>,
  "org_recognized": <true|false|null>,
  "statement_genuine": <true|false>,
  "experience_plausible": <true|false>,
  "red_flags": [<list of strings>],
  "reason": "<one sentence max>"
}}

Score rules:
- 80-100 → approve (auto-grant coach role)
- 30-79  → review  (send to human admin)
- 0-29   → reject  (deny immediately)
- If uncertain about ANYTHING → score ≤ 70
- Any red flag present → score cannot exceed 75
"""

    try:
        api_key = Config.ANTHROPIC_API_KEY
        if not api_key or not HAS_ANTHROPIC:
            return _demo_verify(application)

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text)

    except Exception as e:
        print(f"AI verification error: {e}")
        return _demo_verify(application)


def _demo_verify(application: dict) -> dict:
    """Demo verification for testing without API keys."""
    org = application.get('org', '').lower()
    years = int(application.get('years', 0))

    score = 50
    red_flags = []

    known_orgs = ['sai', 'nis', 'bcci', 'aiff', 'afi', 'hockey india',
                  'sports authority', 'khelo india', 'district sports']
    org_recognized = any(k in org for k in known_orgs)
    if org_recognized:
        score += 20
    else:
        red_flags.append('Organisation not in known list')

    if years >= 5:
        score += 10
    if years >= 10:
        score += 5

    statement = application.get('statement', '')
    if len(statement) > 100:
        score += 5
    elif len(statement) < 30:
        red_flags.append('Statement too short')
        score -= 10

    if red_flags and score > 75:
        score = 75

    if score >= 80:
        decision = 'approve'
    elif score >= 30:
        decision = 'review'
    else:
        decision = 'reject'

    return {
        'score': max(0, min(100, score)),
        'decision': decision,
        'cert_valid': None,
        'org_recognized': org_recognized,
        'statement_genuine': len(statement) > 50,
        'experience_plausible': years > 0 and years < 50,
        'red_flags': red_flags,
        'reason': f'Score {score}: {"Recognised org" if org_recognized else "Unrecognised org"}, {years} years experience.'
    }
