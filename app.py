import os
from flask import Flask, render_template, request, jsonify, session
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import UserVerificationRequirement

app = Flask(__name__, template_folder='.', static_folder='.')
app.secret_key = os.environ.get('SECRET_KEY', 'super-secret-key-for-passkey')

# Passkey RP 설정 (Vercel 기본 도메인 자동 감지 및 fallback)
RP_ID = os.environ.get('VERCEL_URL', 'localhost')
RP_NAME = "Lee Siheon Portfolio"

users_db = {
    "user123": {
        "id": b"user123_unique_id",
        "name": "onedotfour88@gmail.com",
        "display_name": "이시헌",
        "credentials": []
    }
}

PRIVATE_PORTFOLIO_DATA = [
    {"title": "주요 수행 프로젝트", "content": "구글 맵 API 기반 실시간 위치 추적 택시 서비스 개발 (캡스톤 우수상)"},
    {"title": "핵심 기술 스택", "content": "Python, Flask, JavaScript, WebAuthn (Passkey), Git, Vercel"},
    {"title": "대외비 데이터", "content": "비공개 포트폴리오 상세 명세서 및 개인 기여도 리포트 문서 포함"}
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register/begin', methods=['POST'])
def register_begin():
    user = users_db["user123"]
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user["id"],
        user_name=user["name"],
        user_display_name=user["display_name"],
    )
    session['register_challenge'] = options.challenge
    return jsonify(options)

@app.route('/api/register/complete', methods=['POST'])
def register_complete():
    try:
        challenge = session.get('register_challenge')
        if not challenge:
            return jsonify({"status": "FAILED", "error": "세션 차단 또는 챌린지 만료"}), 400

        credential_data = request.get_json()
        verification = verify_registration_response(
            credential=credential_data,
            expected_challenge=challenge,
            expected_origin=request.host_url.rstrip('/'),
            expected_rp_id=RP_ID,
        )

        users_db["user123"]["credentials"].append({
            "id": verification.credential_id,
            "public_key": verification.credential_public_key,
            "sign_count": verification.sign_count,
        })
        session['authenticated'] = True
        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"status": "FAILED", "error": str(e)}), 400

@app.route('/api/authenticate/begin', methods=['POST'])
def auth_begin():
    user = users_db["user123"]
    if not user["credentials"]:
        return jsonify({"error": "등록된 패스키가 없습니다. 먼저 새 패스키를 등록해주세요."}), 400

    options = generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    session['auth_challenge'] = options.challenge
    return jsonify(options)

@app.route('/api/authenticate/complete', methods=['POST'])
def auth_complete():
    try:
        challenge = session.get('auth_challenge')
        credential_data = request.get_json()
        user = users_db["user123"]

        matched_cred = None
        for cred in user["credentials"]:
            if cred["id"] == credential_data.get("id"):
                matched_cred = cred
                break

        if not matched_cred:
            return jsonify({"status": "FAILED", "error": "일치하는 패스키를 찾을 수 없습니다."}), 400

        verification = verify_authentication_response(
            credential=credential_data,
            expected_challenge=challenge,
            expected_origin=request.host_url.rstrip('/'),
            expected_rp_id=RP_ID,
            credential_public_key=matched_cred["public_key"],
            credential_current_sign_count=matched_cred["sign_count"],
        )

        matched_cred["sign_count"] = verification.new_sign_count
        session['authenticated'] = True
        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"status": "FAILED", "error": str(e)}), 400

@app.route('/api/private-data', methods=['GET'])
def get_private_data():
    if not session.get('authenticated'):
        return jsonify({"error": "인증되지 않은 사용자입니다."}), 401
    return jsonify({"items": PRIVATE_PORTFOLIO_DATA})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "OK"})

if __name__ == '__main__':
    app.run(debug=True)