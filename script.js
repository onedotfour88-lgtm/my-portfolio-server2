// =====================================================
// 포트폴리오 데이터
// =====================================================

let profile = {

    name: "",
    age: "",
    gender: "",

    email: "",
    phone: "",
    address: "",

    career: "",
    strength: "",
    taste: "",
    determination: "",

    visibility: {

        email: false,
        phone: false,
        address: false

    }

};



// =====================================================
// 저장된 데이터 불러오기
// =====================================================

function loadSavedProfile() {

    const saved =
        localStorage.getItem("myPortfolio");


    if (saved) {

        try {

            const parsed =
                JSON.parse(saved);


            profile = {

                ...profile,
                ...parsed,

                visibility: {

                    ...profile.visibility,
                    ...(parsed.visibility || {})

                }

            };

        } catch (error) {

            console.error(
                "프로필 데이터를 불러오지 못했습니다.",
                error
            );

        }

    }

}



// =====================================================
// 편집 페이지 불러오기
// =====================================================

function loadEditPage() {

    const name =
        document.getElementById("name");


    if (!name) {

        return;

    }


    document.getElementById("name").value =
        profile.name || "";


    document.getElementById("age").value =
        profile.age || "";


    document.getElementById("gender").value =
        profile.gender || "";


    document.getElementById("email").value =
        profile.email || "";


    document.getElementById("phone").value =
        profile.phone || "";


    document.getElementById("address").value =
        profile.address || "";


    document.getElementById("career").value =
        profile.career || "";


    document.getElementById("strength").value =
        profile.strength || "";


    document.getElementById("taste").value =
        profile.taste || "";


    document.getElementById("determination").value =
        profile.determination || "";


    updateVisibilityButtons();

}



// =====================================================
// 공개 / 비공개 설정
// =====================================================

function setVisibility(field, isPublic) {

    profile.visibility[field] =
        isPublic;


    updateVisibilityButtons();

}



// =====================================================
// 공개 / 비공개 버튼 상태 업데이트
// =====================================================

function updateVisibilityButtons() {

    const fields = [

        "email",
        "phone",
        "address"

    ];


    fields.forEach(function(field) {

        const publicButton =
            document.getElementById(
                field + "-public"
            );


        const privateButton =
            document.getElementById(
                field + "-private"
            );


        if (
            !publicButton ||
            !privateButton
        ) {

            return;

        }


        publicButton.classList.remove("active");

        privateButton.classList.remove("active");


        if (profile.visibility[field]) {

            publicButton.classList.add("active");

        } else {

            privateButton.classList.add("active");

        }

    });

}



// =====================================================
// 현재 입력 내용을 profile 객체에 반영
// =====================================================

function readForm() {

    const name =
        document.getElementById("name");


    if (!name) {

        return;

    }


    profile.name =
        name.value;


    profile.age =
        document.getElementById("age").value;


    profile.gender =
        document.getElementById("gender").value;


    profile.email =
        document.getElementById("email").value;


    profile.phone =
        document.getElementById("phone").value;


    profile.address =
        document.getElementById("address").value;


    profile.career =
        document.getElementById("career").value;


    profile.strength =
        document.getElementById("strength").value;


    profile.taste =
        document.getElementById("taste").value;


    profile.determination =
        document.getElementById(
            "determination"
        ).value;

}



// =====================================================
// 프로필 저장
// =====================================================

function saveProfile() {

    readForm();


    localStorage.setItem(

        "myPortfolio",

        JSON.stringify(profile)

    );


    alert(
        "포트폴리오가 저장되었습니다."
    );

}



// =====================================================
// 포트폴리오 보기
// =====================================================

function goToPortfolio() {

    readForm();


    localStorage.setItem(

        "myPortfolio",

        JSON.stringify(profile)

    );


    window.location.href =
        "index.html";

}



// =====================================================
// HTML 보안 처리
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



// =====================================================
// 줄바꿈을 HTML <br>로 변경
// =====================================================

function formatText(value) {

    if (!value) {

        return "등록된 내용이 없습니다.";

    }


    return escapeHTML(value)
        .replace(/\n/g, "<br>");

}



// =====================================================
// 공개 개인정보 HTML 생성
// =====================================================

function createContactHTML() {

    let html = "";


    if (
        profile.visibility.email &&
        profile.email
    ) {

        html += `

            <div class="contact-item">

                <strong>EMAIL</strong>

                <span>
                    ${escapeHTML(profile.email)}
                </span>

            </div>

        `;

    }


    if (
        profile.visibility.phone &&
        profile.phone
    ) {

        html += `

            <div class="contact-item">

                <strong>PHONE</strong>

                <span>
                    ${escapeHTML(profile.phone)}
                </span>

            </div>

        `;

    }


    if (
        profile.visibility.address &&
        profile.address
    ) {

        html += `

            <div class="contact-item">

                <strong>ADDRESS</strong>

                <span>
                    ${escapeHTML(profile.address)}
                </span>

            </div>

        `;

    }


    if (!html) {

        html = `

            <p class="private-message">
                공개된 개인정보가 없습니다.
            </p>

        `;

    }


    return html;

}



// =====================================================
// 공개용 index.html 생성
// =====================================================

function generatePublicPage() {

    // 현재 입력 내용을 먼저 가져온다.

    readForm();


    // 저장

    localStorage.setItem(

        "myPortfolio",

        JSON.stringify(profile)

    );


    const name =
        escapeHTML(
            profile.name || "나의 포트폴리오"
        );


    const age =
        escapeHTML(
            profile.age || "-"
        );


    const gender =
        escapeHTML(
            profile.gender || "-"
        );


    const contactHTML =
        createContactHTML();


    const html = `<!DOCTYPE html>

<html lang="ko">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>${name} - 포트폴리오</title>

    <link
        rel="stylesheet"
        href="style.css"
    >

</head>


<body>


<div class="container">


    <!-- 프로필 -->

    <section class="card profile-header">

        <p class="profile-label">
            PORTFOLIO
        </p>

        <h1>
            ${name}
        </h1>

        <p class="profile-basic">
            ${age}세 · ${gender}
        </p>

    </section>



    <!-- 연락처 -->

    <section class="card">

        <h2>
            CONTACT
        </h2>

        ${contactHTML}

    </section>



    <!-- 경력 -->

    <section class="card">

        <h2>
            경력
        </h2>

        <div class="content">

            ${formatText(profile.career)}

        </div>

    </section>



    <!-- 강점 -->

    <section class="card">

        <h2>
            강점
        </h2>

        <div class="content">

            ${formatText(profile.strength)}

        </div>

    </section>



    <!-- 취향 -->

    <section class="card">

        <h2>
            취향
        </h2>

        <div class="content">

            ${formatText(profile.taste)}

        </div>

    </section>



    <!-- 각오 -->

    <section class="card">

        <h2>
            각오
        </h2>

        <div class="content">

            ${formatText(profile.determination)}

        </div>

    </section>


</div>


</body>

</html>`;


    // HTML 파일 생성

    const blob =
        new Blob(

            [html],

            {
                type:
                    "text/html;charset=utf-8"
            }

        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        "index.html";


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    alert(

        "공개 페이지가 생성되었습니다.\n\n" +

        "다운로드 폴더의 index.html을 " +

        "프로젝트 폴더에 덮어쓰면 됩니다."

    );

}



// =====================================================
// 페이지가 열렸을 때 실행
// =====================================================

document.addEventListener(

    "DOMContentLoaded",

    function() {

        loadSavedProfile();

        loadEditPage();

    }

);