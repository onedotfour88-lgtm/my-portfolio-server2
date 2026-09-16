// 패스키 로그인 처리
async function authenticatePasskey() {
    try {
        const beginRes = await fetch('/api/authenticate/begin', { method: 'POST' });
        const options = await beginRes.json();
        
        if (options.error) {
            alert(options.error);
            return;
        }

        // Base64URL 변환
        options.challenge = bufferDecode(options.challenge);
        if (options.allowCredentials) {
            options.allowCredentials.forEach(c => c.id = bufferDecode(c.id));
        }

        const cred = await navigator.credentials.get({ publicKey: options });
        const authData = {
            id: cred.id,
            rawId: bufferEncode(cred.rawId),
            type: cred.type,
            response: {
                authenticatorData: bufferEncode(cred.response.authenticatorData),
                clientDataJSON: bufferEncode(cred.response.clientDataJSON),
                signature: bufferEncode(cred.response.signature),
                userHandle: cred.response.userHandle ? bufferEncode(cred.response.userHandle) : null
            }
        };

        const completeRes = await fetch('/api/authenticate/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData)
        });

        const result = await completeRes.json();
        if (result.status === 'OK') {
            showPortfolio();
        } else {
            alert('인증 실패: ' + result.error);
        }
    } catch (err) {
        alert('패스키 로그인 오류: ' + err.message);
    }
}

// 패스키 등록 처리
async function registerPasskey() {
    try {
        const beginRes = await fetch('/api/register/begin', { method: 'POST' });
        const options = await beginRes.json();

        options.challenge = bufferDecode(options.challenge);
        options.user.id = bufferDecode(options.user.id);

        const cred = await navigator.credentials.create({ publicKey: options });
        const regData = {
            id: cred.id,
            rawId: bufferEncode(cred.rawId),
            type: cred.type,
            response: {
                attestationObject: bufferEncode(cred.response.attestationObject),
                clientDataJSON: bufferEncode(cred.response.clientDataJSON)
            }
        };

        const completeRes = await fetch('/api/register/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regData)
        });

        const result = await completeRes.json();
        if (result.status === 'OK') {
            alert('패스키 등록 완료! 로그인합니다.');
            showPortfolio();
        } else {
            alert('등록 실패: ' + result.error);
        }
    } catch (err) {
        alert('패스키 등록 오류: ' + err.message);
    }
}

// 포트폴리오 화면 전환 및 비공개 데이터 로드
async function showPortfolio() {
    document.getElementById('login-gate').classList.add('hidden');
    document.getElementById('portfolio-content').style.display = 'block';

    const res = await fetch('/api/private-data');
    if (res.ok) {
        const data = await res.json();
        const listHtml = data.items.map(item => `<div style="margin-bottom:8px;"><strong>${item.title}:</strong> ${item.content}</div>`).join('');
        document.getElementById('private-items-list').innerHTML = listHtml;
    }
}

// 로그아웃
async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    document.getElementById('portfolio-content').style.display = 'none';
    document.getElementById('login-gate').classList.remove('hidden');
}

// Utility functions
function bufferDecode(value) {
    return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

function bufferEncode(value) {
    return btoa(String.fromCharCode(...new Uint8Array(value)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}