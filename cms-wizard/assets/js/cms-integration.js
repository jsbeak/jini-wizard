// CMS Integration Module
class CMSIntegration {
    constructor(siteId) {
        this.siteId = siteId;
        this.apiBase = '/api/cms';
        this.isConnected = false;
        this.fallbackMode = false;
    }
    
    /**
     * CMS 연결 상태 확인 및 초기화
     */
    async initialize() {
        try {
            console.log('🔗 CMS 연결 초기화 중...', this.siteId);
            
            // CMS 서버 연결 상태 확인
            const healthCheck = await this.checkConnection();
            
            if (healthCheck.success) {
                this.isConnected = true;
                console.log('✅ CMS 연결 성공');
                return { success: true, mode: 'cms' };
            } else {
                throw new Error('CMS 서버 응답 없음');
            }
            
        } catch (error) {
            console.warn('⚠️ CMS 연결 실패, 폴백 모드로 전환:', error.message);
            this.fallbackMode = true;
            return { success: false, mode: 'fallback', error: error.message };
        }
    }
    
    /**
     * CMS 서버 연결 상태 확인
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data };
            } else {
                return { success: false, status: response.status };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * CMS에서 메뉴 구조 조회
     */
    async loadMenuStructure() {
        if (this.fallbackMode) {
            console.log('📋 폴백 모드: 기본 메뉴 구조 사용');
            return this.getDefaultMenuStructure();
        }
        
        try {
            console.log('📋 CMS 메뉴 구조 조회 중...', this.siteId);
            
            const response = await fetch(`${this.apiBase}/site/${this.siteId}/menu-structure`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const menuData = await response.json();
            console.log('✅ CMS 메뉴 구조 로드 완료:', menuData.menus?.length, '개 메뉴');
            
            // 메뉴 데이터 검증
            if (!menuData.menus || !Array.isArray(menuData.menus)) {
                throw new Error('잘못된 메뉴 데이터 형식');
            }
            
            return this.validateAndNormalizeMenuData(menuData);
            
        } catch (error) {
            console.error('❌ CMS 메뉴 로드 실패:', error);
            
            // 폴백으로 기본 메뉴 구조 반환
            console.log('🔄 기본 메뉴 구조로 폴백');
            return this.getDefaultMenuStructure();
        }
    }
    
    /**
     * 특정 페이지의 완성된 HTML 조회
     */
    async loadPageHTML(pageId) {
        if (this.fallbackMode) {
            console.log('📄 폴백 모드: 빈 페이지 구조 반환');
            return this.getDefaultPageStructure(pageId);
        }
        
        try {
            console.log('📄 CMS 페이지 HTML 조회 중...', pageId);
            
            const response = await fetch(`${this.apiBase}/page/${pageId}/full-html`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const pageData = await response.json();
            console.log('✅ CMS 페이지 HTML 로드 완료:', pageId);
            
            // 페이지 데이터 검증
            if (!pageData.fullHtml) {
                throw new Error('페이지 HTML이 없습니다');
            }
            
            // #cms-content 영역 존재 확인
            if (!pageData.fullHtml.includes('id="cms-content"') && 
                !pageData.fullHtml.includes('id=\'cms-content\'')) {
                console.warn('⚠️ #cms-content 영역이 없습니다. 기본 구조를 추가합니다.');
                pageData.fullHtml = this.injectCMSContentArea(pageData.fullHtml);
            }
            
            return {
                pageId: pageData.pageId || pageId,
                fullHtml: pageData.fullHtml,
                contentSelector: pageData.contentSelector || '#cms-content',
                pageTitle: pageData.pageTitle || '',
                menuPath: pageData.menuPath || []
            };
            
        } catch (error) {
            console.error('❌ CMS 페이지 로드 실패:', error);
            
            // 폴백으로 기본 페이지 구조 반환
            console.log('🔄 기본 페이지 구조로 폴백');
            return this.getDefaultPageStructure(pageId);
        }
    }
    
    /**
     * AI 생성 콘텐츠를 CMS에 저장
     */
    async saveGeneratedContent(pageId, htmlContent) {
        if (this.fallbackMode) {
            console.log('💾 폴백 모드: 콘텐츠 저장 시뮬레이션');
            await this.simulateDelay(1000); // 저장 시뮬레이션
            return { 
                success: true, 
                savedAt: new Date().toISOString(),
                mode: 'simulation' 
            };
        }
        
        try {
            console.log('💾 CMS에 콘텐츠 저장 중...', pageId);
            
            const requestData = {
                selector: '#cms-content',
                content: htmlContent,
                contentType: 'html',
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(`${this.apiBase}/page/${pageId}/update-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ CMS 콘텐츠 저장 완료:', result.savedAt || 'unknown time');
            
            return {
                success: true,
                savedAt: result.savedAt || new Date().toISOString(),
                mode: 'cms',
                ...result
            };
            
        } catch (error) {
            console.error('❌ CMS 콘텐츠 저장 실패:', error);
            
            // 저장 실패 시에도 성공으로 처리 (UX 고려)
            return {
                success: false,
                error: error.message,
                savedAt: new Date().toISOString(),
                mode: 'error'
            };
        }
    }
    
    /**
     * 메뉴 데이터 검증 및 정규화
     */
    validateAndNormalizeMenuData(menuData) {
        const normalized = {
            menus: [],
            statusMessages: menuData.statusMessages || {}
        };
        
        menuData.menus.forEach(menu => {
            if (menu.id && menu.title) {
                const normalizedMenu = {
                    id: menu.id,
                    title: menu.title,
                    koreanTitle: menu.koreanTitle || menu.title,
                    icon: menu.icon || "○",
                    status: "waiting",
                    submenus: []
                };
                
                if (menu.submenus && Array.isArray(menu.submenus)) {
                    menu.submenus.forEach(submenu => {
                        if (submenu.id && submenu.title) {
                            normalizedMenu.submenus.push({
                                id: submenu.id,
                                title: submenu.title,
                                koreanTitle: submenu.koreanTitle || submenu.title,
                                status: "waiting",
                                url: submenu.url || `/${menu.id}/${submenu.id}`
                            });
                        }
                    });
                }
                
                normalized.menus.push(normalizedMenu);
            }
        });
        
        return normalized;
    }
    
    /**
     * 기본 메뉴 구조 반환 (폴백용)
     */
    getDefaultMenuStructure() {
        return {
            menus: [
                {
                    id: "about",
                    title: "About",
                    koreanTitle: "회사소개",
                    icon: "○",
                    status: "waiting",
                    submenus: [
                        {
                            id: "welcome",
                            title: "Welcome Message",
                            koreanTitle: "환영메시지",
                            status: "waiting",
                            url: "/about/welcome"
                        },
                        {
                            id: "company",
                            title: "Company Overview", 
                            koreanTitle: "회사개요",
                            status: "waiting",
                            url: "/about/company"
                        },
                        {
                            id: "mission",
                            title: "Mission & Vision",
                            koreanTitle: "미션 & 비전",
                            status: "waiting",
                            url: "/about/mission"
                        }
                    ]
                },
                {
                    id: "services",
                    title: "Services",
                    koreanTitle: "서비스",
                    icon: "○",
                    status: "waiting",
                    submenus: [
                        {
                            id: "consulting",
                            title: "Consulting",
                            koreanTitle: "컨설팅",
                            status: "waiting",
                            url: "/services/consulting"
                        },
                        {
                            id: "development",
                            title: "Development",
                            koreanTitle: "개발",
                            status: "waiting",
                            url: "/services/development"
                        }
                    ]
                }
            ],
            statusMessages: {
                "about": [
                    "회사 소개 문구를 작성하고 있습니다...",
                    "브랜드 스토리를 구성하고 있습니다...",
                    "핵심 가치를 정리하고 있습니다..."
                ],
                "services": [
                    "서비스 카탈로그를 생성하고 있습니다...",
                    "핵심 역량을 정의하고 있습니다...",
                    "고객 혜택을 작성하고 있습니다..."
                ]
            }
        };
    }
    
    /**
     * 기본 페이지 구조 반환 (폴백용) - 이화여대 템플릿
     */
    getDefaultPageStructure(pageId) {
        return {
            pageId: pageId,
            fullHtml: this.getEwhaCMSTemplate(),
            contentSelector: '#cms-content',
            pageTitle: '인사말 - 사회복지학과',
            menuPath: ['학과소개', '인사말']
        };
    }
    
    /**
     * 이화여대 실제 CMS 템플릿 HTML 반환
     */
    getEwhaCMSTemplate() {
        return `<!doctype html>
<html lang="ko" class="no-js">
<head>
<title>인사말 | 템플릿01</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=yes">
<style>
/* 기본 스타일 */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; line-height: 1.6; color: #333; }
.wrap { min-height: 100vh; display: flex; flex-direction: column; }

/* 헤더 스타일 */
header { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.top-header-box { background: #f8f9fa; padding: 8px 0; }
.top-util-box ul { list-style: none; display: flex; justify-content: flex-end; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.top-util-box li { margin-left: 20px; }
.top-util-box a { color: #666; text-decoration: none; font-size: 13px; }

.bottom-header-box { max-width: 1200px; margin: 0 auto; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 1.5rem; font-weight: bold; }
.logo a { color: #00462A; text-decoration: none; display: flex; align-items: center; gap: 10px; }
.logo span { color: #00462A; }

.gnb-ul { list-style: none; display: flex; gap: 40px; }
.gnb-ul > li > a { color: #333; text-decoration: none; font-weight: 500; padding: 10px 0; display: block; position: relative; }
.gnb-ul > li > a.active { color: #00462A; font-weight: bold; }
.gnb-ul > li > a.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: #00462A; }

/* 서브 비주얼 */
.sub-visual-box { background: linear-gradient(135deg, #00462A 0%, #004d2e 100%); color: white; padding: 60px 0; text-align: center; }
.sub-visual-box h2 { font-size: 2.5rem; margin-bottom: 20px; }
.path-depth-wrap { display: flex; justify-content: center; align-items: center; gap: 15px; }
.path-depth-wrap ul { list-style: none; display: flex; gap: 15px; align-items: center; }
.path-depth-wrap ul li::before { content: '>'; margin-right: 15px; opacity: 0.5; }
.path-depth-wrap ul li:first-child::before { display: none; }
.path-depth-wrap a { color: rgba(255,255,255,0.8); text-decoration: none; }
.path-home { margin-right: 10px; }

/* 메인 컨텐츠 */
.sub-container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; }
.page-title h3 { font-size: 2rem; color: #00462A; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #00462A; }

/* CMS 콘텐츠 영역 강조 */
#cms-content { 
    background: linear-gradient(135deg, #fef9e7, #fef3c7); 
    border: 3px dashed #f59e0b; 
    border-radius: 15px; 
    padding: 40px; 
    margin: 30px 0; 
    position: relative;
    min-height: 400px;
}

#cms-content::before {
    content: "🎯 AI가 생성할 콘텐츠 영역";
    position: absolute;
    top: -15px;
    left: 20px;
    background: #f59e0b;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
}

.cms-placeholder {
    text-align: center;
    color: #92400e;
    font-size: 1.2rem;
    font-weight: 500;
    padding: 50px 20px;
}

/* 이화여대 스타일 인사말 콘텐츠 */
.greetings-box { padding: 20px 0; }
.greetings-slo-p { font-size: 1.8rem; line-height: 1.5; margin-bottom: 30px; }
.greetings-slo-p span { color: #00462A; font-weight: bold; }
.greetings-p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px; text-align: justify; }

/* 푸터 */
footer { background: #2d3748; color: white; padding: 40px 0; margin-top: auto; }
.bottom-footer-box { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.footer-info-box { text-align: center; }
.footer-util-box ul { list-style: none; display: flex; gap: 20px; margin-bottom: 15px; justify-content: center; }
.footer-util-box a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; }
.footer-util-box a:hover { color: white; text-decoration: underline; }
.address-txt { margin-bottom: 10px; }
.address-txt span { margin: 0 10px; }
.copyright { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 20px; }

/* 반응형 */
@media (max-width: 768px) {
    .gnb-ul { display: none; }
    .bottom-header-box { flex-direction: column; text-align: center; }
    .sub-visual-box h2 { font-size: 2rem; }
    .bottom-footer-box { text-align: center; }
    .footer-util-box ul { flex-wrap: wrap; justify-content: center; }
}
</style>
</head>
<body class="temp01-site pc color-type01">
<div class="wrap">
    <header>
        <div class="top-header-wrap">
            <div class="top-header-box">
                <div class="top-util-box">
                    <ul>
                        <li><a href="https://www.ewha.ac.kr/ewha/index.do" target="_blank">이화여자대학교</a></li>
                        <li><a href="#" title="바로가기">SITEMAP</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="bottom-header-wrap">
            <div class="bottom-header-box">
                <h1 class="logo">
                    <a href="#" title="바로가기">
                        <img src="https://cmsfox.ewha.ac.kr/_res/ewha/_share/img/common/img-temp-logo.png" alt="이화여자대학교" style="height: 40px;">
                        <span>사회복지학과</span>
                    </a>
                </h1>
                <div class="gnb-wrap">
                    <div class="gnb">
                        <ul class="gnb-ul">
                            <li><a href="#" class="active">학과소개</a></li>
                            <li><a href="#">학사정보</a></li>
                            <li><a href="#">입학정보</a></li>
                            <li><a href="#">학생활동</a></li>
                            <li><a href="#">자료실</a></li>
                            <li><a href="#">커뮤니티</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </header>
    
    <div class="sub-visual-wrap">
        <div class="sub-visual-box">
            <h2>학과소개</h2>
            <div class="path-depth-wrap">
                <a class="path-home" href="#" title="홈 바로가기"><span>🏠 홈</span></a>
                <ul>
                    <li><a href="#" class="active">학과소개</a></li>
                    <li><a href="#" class="active">인사말</a></li>
                </ul>
            </div>
        </div>
    </div>
    
    <div class="sub-container">
        <div class="content-wrap">
            <div class="title">
                <div class="page-title">
                    <h3>인사말</h3>
                </div>
            </div>
            
            <div class="content cms-print" id="cms-content">
                <div class="cms-placeholder">
                    🎓 이 영역에 AI가 생성한 인사말 콘텐츠가 삽입됩니다<br><br>
                    • 학과장 인사말<br>
                    • 학과 소개 및 비전<br>
                    • 교육 목표 및 특성<br>
                    • 졸업생 진로 안내<br><br>
                    <small style="color: #f59e0b;">실제 CMS에서는 이 영역이 AI 생성 콘텐츠로 자동 교체됩니다</small>
                </div>
            </div>
        </div>
    </div>
    
    <footer>
        <div class="bottom-footer-wrap">
            <div class="bottom-footer-box">
                <div class="logo-box" style="text-align: center; margin-bottom: 20px;">
                    <img src="https://cmsfox.ewha.ac.kr/_res/ewha/_share/img/common/img-footer-logo.png" alt="이화여자대학교">
                </div>
                <div class="footer-info-box">
                    <div class="footer-util-box">
                        <ul>
                            <li><a href="#">개인정보처리방침</a></li>
                            <li><a href="#">네티즌윤리규약</a></li>
                            <li><a href="#">이메일주소무단수집거부</a></li>
                            <li><a href="#">이화포탈정보시스템</a></li>
                        </ul>
                    </div>
                    <div class="address-box">
                        <p class="address-txt">
                            <span>우) 03760 서울특별시 서대문구 이화여대길 52 이화여자대학교</span>
                            <span>TEL. 02-3277-2114</span>
                        </p>
                        <p class="copyright">COPYRIGHT © 2024 BY EWHA WOMANS UNIVERSITY. ALL RIGHTS RESERVED.</p>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</div>
</body>
</html>`;
    }
    
    /**
     * HTML에 #cms-content 영역 주입
     */
    injectCMSContentArea(html) {
        // body 태그 내부에 cms-content div 추가
        const bodyEndIndex = html.lastIndexOf('</body>');
        if (bodyEndIndex !== -1) {
            const beforeBody = html.substring(0, bodyEndIndex);
            const afterBody = html.substring(bodyEndIndex);
            
            return beforeBody + `
                <div id="cms-content" style="min-height: 200px; padding: 20px;">
                    <!-- AI 생성 콘텐츠 영역 -->
                </div>
            ` + afterBody;
        }
        
        return html;
    }
    
    /**
     * 지연 시뮬레이션 유틸리티
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 연결 상태 확인
     */
    isConnectionActive() {
        return this.isConnected && !this.fallbackMode;
    }
    
    /**
     * 폴백 모드 상태 확인
     */
    isFallbackMode() {
        return this.fallbackMode;
    }
}