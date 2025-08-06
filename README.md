# CMS AI 템플릿 사이트 구성 마법사

## 📋 프로젝트 개요

AI가 자동으로 웹사이트 콘텐츠를 생성하는 CMS 시스템입니다. 선택한 템플릿을 기반으로 24개 페이지의 콘텐츠를 AI가 실시간으로 생성하며, 생성된 콘텐츠는 서버에 JSON 파일로 저장됩니다.

### 주요 기능
- 🎨 **템플릿 기반 사이트 생성**: API를 통해 템플릿 로드 및 적용
- 🤖 **AI 콘텐츠 생성 시뮬레이션**: 실시간 타이핑 효과로 콘텐츠 생성
- 💾 **서버 저장**: JSP API를 통한 JSON 파일 저장/로드
- 🔄 **콘텐츠 재생성**: 완료된 페이지의 콘텐츠 재생성 기능
- 📱 **반응형 프리뷰**: 50%, 75%, 100% 줌 기능

## 🚀 실행 방법

### 1. Tomcat 서버 시작

```bash
# 프로젝트 루트에서
cd case2

# Tomcat 시작
./start.sh

# 또는 수동으로
cd tomcat9/bin
./startup.sh
```

### 2. 애플리케이션 접속

#### 기본 접속
```
http://localhost:8080/cms-wizard/
```

#### 템플릿 ID 지정 접속
```
http://localhost:8080/cms-wizard/index.html?templateId=university-ewha
```

#### 사이트 ID와 템플릿 ID 모두 지정
```
http://localhost:8080/cms-wizard/index.html?siteId=mysite&templateId=university-ewha
```

### 3. 서버 종료

```bash
# 프로젝트 루트에서
./stop.sh

# 또는 수동으로
cd tomcat9/bin
./shutdown.sh
```

## 🧪 테스트 방법

### 1. 템플릿 테스트

템플릿 선택 테스트 페이지 접속:
```
http://localhost:8080/cms-wizard/test-template.html
```

### 2. 개발자 모드 (빠른 테스트)

#### URL 파라미터로 개발 모드 활성화
```
http://localhost:8080/cms-wizard/?dev
```
- AI 생성 속도 10배 빨라짐 (0.1~0.3초)
- 디버깅 로그 간소화

#### 콘솔에서 개발 유틸리티 사용

브라우저 개발자 도구 콘솔(F12)에서:

```javascript
// 즉시 리뷰 모드로 전환 (모든 페이지 완료 상태)
devUtils.enableReviewMode()

// 특정 페이지만 완료 처리
devUtils.completePage('about', 'welcome')

// 재생성 버튼 강제 표시
devUtils.showRegenerateButton()

// 현재 상태 확인
devUtils.checkStatus()

// 콘텐츠 저장소 디버깅
window.contentStorage.debug()
```

### 3. 기능별 테스트

#### A. 콘텐츠 생성 테스트
1. 애플리케이션 실행
2. 3초 후 인트로 화면 자동 종료
3. AI가 순차적으로 24개 페이지 생성
4. 각 페이지당 1-3초 소요 (개발 모드: 0.1-0.3초)

#### B. 서버 저장 테스트
1. 콘텐츠 생성 완료 확인
2. 서버 파일 확인:
   ```bash
   ls -la cms-wizard/data/ewha/about/
   # welcome.json, mission.json, history.json 파일 확인
   ```
3. JSON 파일 내용 확인:
   ```bash
   cat cms-wizard/data/ewha/about/welcome.json | python -m json.tool
   ```

#### C. 재생성 버튼 테스트
1. 완료된 메뉴 클릭 (초록색 체크 표시)
2. 우측 상단 재생성 버튼 확인
3. 재생성 버튼 클릭
4. 콘텐츠 재생성 확인

#### D. 템플릿 API 테스트
```bash
# 템플릿 가져오기
curl "http://localhost:8080/cms-wizard/api/get-template.jsp?templateId=university-ewha"

# 페이지 데이터 로드
curl "http://localhost:8080/cms-wizard/api/load-page.jsp?siteId=ewha&menuId=about&submenuId=welcome"

# 세션 정보 로드
curl "http://localhost:8080/cms-wizard/api/load-session.jsp?siteId=ewha"
```

## 📁 프로젝트 구조

```
case2/
├── cms-wizard/                 # 웹 애플리케이션 루트
│   ├── index.html              # 메인 페이지
│   ├── test-template.html      # 템플릿 테스트 페이지
│   │
│   ├── api/                    # JSP API
│   │   ├── get-template.jsp    # 템플릿 로드
│   │   ├── save-page.jsp       # 페이지 저장
│   │   ├── load-page.jsp       # 페이지 로드
│   │   ├── save-session.jsp    # 세션 저장
│   │   ├── load-session.jsp    # 세션 로드
│   │   └── utils/
│   │       └── FileUtils.jsp   # 파일 유틸리티
│   │
│   ├── templates/              # 템플릿 파일
│   │   └── university-ewha.html # 이화여대 템플릿
│   │
│   ├── data/                   # 생성된 콘텐츠 저장
│   │   └── [siteId]/
│   │       ├── site-info.json
│   │       └── [menuId]/
│   │           └── [submenuId].json
│   │
│   └── assets/
│       ├── css/                # 스타일시트
│       ├── data/               # 메뉴 구조
│       │   └── menu-data.json
│       └── js/                 # JavaScript
│           ├── app.js          # 메인 앱
│           ├── menu.js         # 메뉴 관리
│           ├── preview.js      # 프리뷰 관리
│           ├── ai-simulator.js # AI 시뮬레이터
│           ├── content-storage.js     # 기본 저장소
│           └── jsp-content-storage.js # JSP 연동 저장소
│
├── tomcat9/                    # Tomcat 서버
├── start.sh                    # 서버 시작 스크립트
└── stop.sh                     # 서버 종료 스크립트
```

## 🔧 주요 컴포넌트

### 1. CMSWizardApp (`app.js`)
- 전체 애플리케이션 제어
- 상태 관리 (인트로, 생성중, 완료, 리뷰)
- 진행률 추적

### 2. MenuManager (`menu.js`)
- 좌측 메뉴 렌더링
- 메뉴 상태 관리 (대기, 진행중, 완료)
- 완료된 페이지 클릭 처리

### 3. PreviewManager (`preview.js`)
- 우측 브라우저 프리뷰
- 줌 기능 (50%, 75%, 100%)
- 재생성 버튼 관리

### 4. AISimulator (`ai-simulator.js`)
- AI 콘텐츠 생성 시뮬레이션
- 타이핑 애니메이션
- 한국어 콘텐츠 데이터베이스

### 5. JSPContentStorage (`jsp-content-storage.js`)
- 서버 API 연동
- 템플릿 로드 및 적용
- JSON 파일 저장/로드
- 하이브리드 저장 (서버 + 로컬)

## 🎨 템플릿 시스템

### 템플릿 변수
- `{{PAGE_TITLE}}` - 페이지 제목
- `{{SITE_NAME}}` - 사이트 이름
- `{{PAGE_SUBTITLE}}` - 페이지 부제목
- `{{MENU_NAVIGATION}}` - 메뉴 네비게이션
- `{{BREADCRUMB_SECTION}}` - 브레드크럼 섹션
- `{{BREADCRUMB_PAGE}}` - 브레드크럼 페이지

### AI 생성 영역
```html
<div id="cms-content">
    <!-- AI가 이 부분만 생성 -->
</div>
```

## 🐛 디버깅

### 콘솔 로그 레벨
- `🚀` 초기화
- `✅` 성공
- `❌` 오류
- `⚠️` 경고
- `🔄` 진행중
- `💾` 저장
- `📁` 로드
- `🔍` 검색/확인

### 주요 디버깅 명령어

```javascript
// 저장소 상태 확인
window.contentStorage.debug()

// 현재 세션 상태
window.contentStorage.sessionState

// 서버 연결 상태
window.contentStorage.serverAvailable

// 템플릿 정보
window.contentStorage.templateId
window.contentStorage.templateHTML

// 생성된 콘텐츠 목록
window.contentStorage.generatedContent.keys()

// 특정 페이지 콘텐츠 확인
await window.contentStorage.getGeneratedContent('about/welcome')
```

## 📝 API 엔드포인트

### 템플릿 API
- `GET /api/get-template.jsp?templateId={id}`
  - 템플릿 HTML 및 메타데이터 반환

### 페이지 API
- `POST /api/save-page.jsp`
  - 파라미터: siteId, menuId, submenuId, pageData
  - 페이지 콘텐츠를 JSON으로 저장

- `GET /api/load-page.jsp?siteId={siteId}&menuId={menuId}&submenuId={submenuId}`
  - 저장된 페이지 콘텐츠 로드

### 세션 API
- `POST /api/save-session.jsp`
  - 현재 작업 세션 저장

- `GET /api/load-session.jsp?siteId={siteId}`
  - 이전 세션 복구

## 💡 팁과 트릭

### 빠른 테스트
1. `?dev` 파라미터로 개발 모드 활성화
2. `devUtils.enableReviewMode()`로 즉시 완료 상태
3. 특정 메뉴만 테스트: `devUtils.completePage('about', 'welcome')`

### 한글 인코딩 문제
- 모든 JSP 파일에 UTF-8 설정 확인
- request/response 모두 UTF-8 설정
- URLSearchParams 사용 (FormData 대신)

### 재생성 버튼이 안 보일 때
1. 콘솔에서 `window.previewManager.showRegenerateButton()` 실행
2. `currentPageForReview` 상태 확인
3. iframe 로드 완료 확인

## 📚 추가 개발 가이드

### 새 템플릿 추가
1. `/templates/` 폴더에 HTML 파일 생성
2. 템플릿 변수 사용 (`{{PAGE_TITLE}}` 등)
3. `#cms-content` 영역 포함 필수
4. `get-template.jsp`에 템플릿 정보 추가

### 메뉴 구조 변경
1. `/assets/data/menu-data.json` 수정
2. 각 메뉴는 3개의 서브메뉴 필요
3. `ai-simulator.js`의 콘텐츠 데이터베이스 업데이트

### AI 생성 콘텐츠 커스터마이징
1. `ai-simulator.js`의 `initContentDatabase()` 수정
2. 각 페이지별 title, subtitle, content, features 정의
3. 한국어 콘텐츠 유지

## 🔗 관련 링크

- [Tomcat 9 Documentation](https://tomcat.apache.org/tomcat-9.0-doc/)
- [JSP Documentation](https://docs.oracle.com/javaee/5/tutorial/doc/bnagx.html)
- [Gson Library](https://github.com/google/gson)

## 📄 라이선스

이 프로젝트는 교육 및 데모 목적으로 제작되었습니다.

---

작성일: 2025-08-06
버전: 1.0.0