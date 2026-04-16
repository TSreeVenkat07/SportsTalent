"""
AI Coach Verification — Stateless Claude API calls
Each call is completely independent — no DB access, no history, no cross-contamination.
"""

import json
import os

# In production, uncomment:
import anthropic
from config import Config

def ai_verify_coach(application: dict) -> dict:
    """
    Verify a coach application using Claude API.
    Completely stateless — no DB read, no history.
    Each call is independent and isolated.
    """
    prompt = f"""
... (rest of the prompt)
"""

    try:
        # 🪄 Master Config: Using centralized credentials
        api_key = Config.ANTHROPIC_API_KEY
        if not api_key:
            return _demo_verify(application)

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-sonnet-20240229", # Optimized master model
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text)

    except Exception as e:
        print(f"AI verification error: {e}")
        return _demo_verify(application)

        # Demo fallback
        return _demo_verify(application)

    except Exception as e:
        print(f"AI verification error: {e}")
        return _demo_verify(application)


def _demo_verify(application: dict) -> dict:
    """Demo verification for testing without API keys."""
    org = application.get('org', '').lower()
    years = int(application.get('years', 0))

    # Simple rule-based scoring for demo
    score = 50
    red_flags = []

    # Check org
    known_orgs = ['sai', 'nis', 'bcci', 'aiff', 'afi', 'hockey india',
                  'sports authority', 'khelo india', 'district sports']
    org_recognized = any(k in org for k in known_orgs)
    if org_recognized:
        score += 20
    else:
        red_flags.append('Organisation not in known list')

    # Check experience
    if years >= 5:
        score += 10
    if years >= 10:
        score += 5

    # Check statement length
    statement = application.get('statement', '')
    if len(statement) > 100:
        score += 5
    elif len(statement) < 30:
        red_flags.append('Statement too short')
        score -= 10

    # Cap score if red flags exist
    if red_flags and score > 75:
        score = 75

    # Determine decision
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
