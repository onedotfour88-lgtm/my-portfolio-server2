import os
import base64
from flask import Flask, render_template, request, jsonify, session, send_from_directory
from fido2.webauthn import PublicKeyCredentialCreationOptions, PublicKeyCredentialRequestOptions
from fido2.server import Fido2Server

# Vercel 및 정적 파일(CSS, JS) 정상 연결을 위한 Flask 설정[cite: 1, 5, 6]
app = Flask(__name__, static_folder=".", static_url_path="")
app.secret_key = os.getenv("SECRET_KEY", "portfolio_passkey_secret_key_2026")

# 메모리 기반 사용자 mock 데이터
users = {
    "user1": {
        "id": b"user1_bytes_id",
        "name": "이시헌",
        "display_name": "이시헌",
        "credentials": []
    }
}

PRIVATE_ITEMS = [
    {"title": "1. 준비 중인 프로젝트 메모", "content": "FastAPI + WebAuthn 기반 인증 시스템 구현 프로젝트 메모"},
    {"title": "2. 지원하려는 곳 목록", "content": "네이버, 카카오, 라인, 쿠팡, 우아한형제들 프론트엔드/백엔드"},
    {"title": "3. 스스로 쓰는 회고", "content": "캡스톤 프로젝트 진행 및 팀 커뮤니케이션 해결 경험 회고"}
]

def get_fido_server():
    # 접속한 Host 도메인을 자동으로 감지하여 RP_ID를 설정 (Vercel 도메인 대응)
    host = request.host.split(":")[0] if request else "localhost"
    return Fido2Server({"id": host, "name": "Portfolio Passkey App"})

# --- 메인 페이지 및 정적 파일 경로 라우팅 ---
@app.route("/")
def index():
    return app.send_static_file("index.html")[cite: 1, 3]

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)

# --- 비공개 영역 데이터 요청 ---
@app.route("/api/private-data", methods=["GET"])
def get_private_data():
    if not session.get("authenticated"):
        return jsonify({"error": "Unauthorized access"}), 401
    return jsonify({"items": PRIVATE_ITEMS})

# --- 패스키 등록 API ---
@app.route("/api/register/begin", methods=["POST"])
def register_begin():
    server = get_fido_server()
    user = users["user1"]
    
    options, state = server.register_begin(
        user={
            "id": user["id"],
            "name": user["name"],
            "displayName": user["display_name"]
        },
        credentials=user["credentials"],
        user_verification="discouraged"
    )
    
    session["state"] = state
    return jsonify(dict(options))

@app.route("/api/register/complete", methods=["POST"])
def register_complete():
    try:
        server = get_fido_server()
        state = session.get("state")
        if not state:
            return jsonify({"error": "Session expired"}), 400
            
        data = request.get_json()
        auth_data = server.register_complete(state, data)
        
        credential_id = auth_data.credential_data.credential_id
        users["user1"]["credentials"].append(auth_data.credential_data)
        
        session["authenticated"] = True
        return jsonify({"status": "OK", "credential_id": base64.b64encode(credential_id).decode('utf-8')})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- 패스키 인증 API ---
@app.route("/api/authenticate/begin", methods=["POST"])
def authenticate_begin():
    server = get_fido_server()
    user = users["user1"]
    
    if not user["credentials"]:
        return jsonify({"error": "등록된 패스키가 없습니다."}), 400
        
    options, state = server.authenticate_begin(user["credentials"])
    session["state"] = state
    return jsonify(dict(options))

@app.route("/api/authenticate/complete", methods=["POST"])
def authenticate_complete():
    try:
        server = get_fido_server()
        state = session.get("state")
        if not state:
            return jsonify({"error": "Session expired"}), 400
            
        data = request.get_json()
        server.authenticate_complete(state, users["user1"]["credentials"], data)
        
        session["authenticated"] = True
        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- 패스키 관리 및 삭제 API ---
@app.route("/api/passkeys", methods=["GET"])
def get_passkeys():
    user = users["user1"]
    result = []
    for idx, cred in enumerate(user["credentials"]):
        cred_id_str = base64.b64encode(cred.credential_id).decode('utf-8')
        result.append({
            "id": cred_id_str,
            "name": f"패스키 #{idx + 1}"
        })
    return jsonify({"passkeys": result})

@app.route("/api/passkeys/<key_id>", methods=["DELETE"])
def delete_passkey(key_id):
    user = users["user1"]
    new_creds = []
    for cred in user["credentials"]:
        cred_id_str = base64.b64encode(cred.credential_id).decode('utf-8')
        if cred_id_str != key_id:
            new_creds.append(cred)
            
    user["credentials"] = new_creds
    return jsonify({"success": True, "remaining": len(user["credentials"])})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)