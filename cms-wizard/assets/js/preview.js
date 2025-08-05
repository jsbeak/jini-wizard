// Preview Manager Class
class PreviewManager {
    constructor(app) {
        this.app = app;
        this.iframe = document.getElementById('preview-iframe');
        this.urlDisplay = document.getElementById('browser-url-text');
        this.currentZoom = 100;
        this.currentUrl = '';
        
        // ContentStorage 초기화
        this.initializeContentStorage();
    }
    
    /**
     * ContentStorage 초기화
     */
    initializeContentStorage() {
        if (!window.contentStorage) {
            console.log('🔄 PreviewManager: ContentStorage 초기화');
            window.contentStorage = new ContentStorage();
        }
        this.contentStorage = window.contentStorage;
    }
    
    async loadPage(url, showBlankForAI = true) {
        // Update URL display
        this.currentUrl = url;
        this.urlDisplay.textContent = `https://mysite.com${url}`;
        
        // Show blank page ready for AI typing
        if (showBlankForAI) {
            const blankContent = this.createBlankPageForTyping();
            this.iframe.srcdoc = blankContent;
            await this.sleep(200); // Allow time for setup
            
            // Apply zoom to blank page
            this.applyZoom();
            
            // The AI simulator will handle the content generation
            // Don't load template content here - let AI simulator do it
            return;
        }
        
        // Add page transition animation for completed pages
        await this.animatePageTransition();
        
        // ContentStorage를 사용하여 템플릿 페이지 생성
        const pageContent = this.createTemplateContentFromURL(url);
        
        // Load content into iframe
        this.iframe.srcdoc = pageContent;
        
        // Apply zoom
        this.applyZoom();
        
        // Add staggered animations after content loads
        this.iframe.onload = () => {
            this.addStaggeredAnimations();
        };
    }
    
    /**
     * CMS에서 완성된 페이지 HTML을 로드하여 AI 생성 준비
     */
    async loadCMSPageForAI(pageId) {
        console.log('🔄 CMS 페이지 로드 시작:', pageId);
        
        try {
            // CMS API에서 완성된 HTML 가져오기
            const pageData = await this.app.cms.loadPageHTML(pageId);
            
            if (!pageData || !pageData.fullHtml) {
                throw new Error('CMS 페이지 데이터를 가져올 수 없습니다');
            }
            
            console.log('✅ CMS HTML 데이터 로드 완료');
            
            // URL 표시 업데이트
            this.currentUrl = pageData.pageTitle || pageId;
            this.urlDisplay.textContent = `https://mysite.com${pageData.menuPath?.join('/') || '/' + pageId}`;
            
            // iframe에 완성된 HTML 로드
            this.iframe.contentDocument.open();
            this.iframe.contentDocument.write(pageData.fullHtml);
            this.iframe.contentDocument.close();
            
            // #cms-content 영역 준비
            await this.prepareContentAreaForAI();
            
            // 줌 적용
            this.applyZoom();
            
            console.log('✅ CMS 페이지 로드 완료');
            return pageData;
            
        } catch (error) {
            console.error('❌ CMS 페이지 로드 실패:', error);
            
            // 폴백: 기존 방식으로 빈 페이지 생성
            console.log('🔄 폴백 모드로 빈 페이지 생성');
            const blankContent = this.createBlankPageForTyping();
            this.iframe.srcdoc = blankContent;
            await this.sleep(200);
            this.applyZoom();
            
            return { error: error.message, fallback: true };
        }
    }
    
    /**
     * #cms-content 영역을 AI 생성 준비 상태로 설정
     */
    async prepareContentAreaForAI() {
        try {
            const doc = this.iframe.contentDocument;
            const contentArea = doc.querySelector('#cms-content');
            
            if (contentArea) {
                console.log('🎯 #cms-content 영역 발견, AI 생성 준비 중...');
                
                // 스피너 애니메이션을 위한 스타일 추가
                const style = doc.createElement('style');
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 1; }
                    }
                    @keyframes slideUp {
                        0% { transform: translateY(10px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                `;
                doc.head.appendChild(style);
                
                // 기존 내용을 AI 생성 대기 상태로 변경
                contentArea.innerHTML = `
                    <div class="ai-preparing" style="
                        text-align: center; 
                        padding: 60px 20px; 
                        color: #666;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        border-radius: 12px;
                        margin: 20px 0;
                        border: 2px dashed #cbd5e1;
                        animation: slideUp 0.6s ease-out;
                    ">
                        <div style="
                            width: 48px; 
                            height: 48px; 
                            border: 4px solid #e0e7ff; 
                            border-top: 4px solid #6366F1; 
                            border-radius: 50%; 
                            animation: spin 1s linear infinite; 
                            margin: 0 auto 24px;
                        "></div>
                        <h3 style="
                            margin: 0 0 12px; 
                            font-size: 20px; 
                            color: #334155;
                            font-weight: 600;
                        ">AI가 콘텐츠를 분석하고 있습니다</h3>
                        <p style="
                            margin: 0; 
                            font-size: 16px; 
                            color: #64748b;
                            line-height: 1.5;
                        ">잠시만 기다려주세요. 곧 새로운 콘텐츠가 생성됩니다.</p>
                        <div style="
                            margin-top: 20px;
                            font-size: 14px;
                            color: #94a3b8;
                        ">
                            <span style="display: inline-block; animation: pulse 1.5s ease-in-out infinite;">🤖 AI 분석</span> • 
                            <span style="display: inline-block; animation: pulse 1.5s ease-in-out infinite 0.5s;">🎨 콘텐츠 생성</span> • 
                            <span style="display: inline-block; animation: pulse 1.5s ease-in-out infinite 1s;">✨ 최적화</span>
                        </div>
                    </div>
                `;
                
                console.log('✅ #cms-content 영역 AI 준비 완료');
            } else {
                console.warn('⚠️ #cms-content 영역을 찾을 수 없습니다');
                
                // cms-content 영역이 없는 경우 body에 추가
                const body = doc.body;
                if (body) {
                    // 스피너 애니메이션을 위한 스타일 확인 및 추가
                    if (!doc.querySelector('style[data-ai-animations]')) {
                        const style = doc.createElement('style');
                        style.setAttribute('data-ai-animations', 'true');
                        style.textContent = `
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `;
                        doc.head.appendChild(style);
                    }
                    
                    const contentDiv = doc.createElement('div');
                    contentDiv.id = 'cms-content';
                    contentDiv.style.cssText = 'min-height: 300px; padding: 20px; margin: 20px auto; max-width: 1200px;';
                    contentDiv.innerHTML = `
                        <div class="ai-preparing" style="text-align: center; padding: 40px; color: #666;">
                            <div style="width: 40px; height: 40px; border: 3px solid #e0e7ff; border-top: 3px solid #6366F1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <h3>AI 콘텐츠 생성 준비</h3>
                            <p>곧 새로운 콘텐츠가 생성됩니다...</p>
                        </div>
                    `;
                    body.appendChild(contentDiv);
                    console.log('✅ #cms-content 영역 동적 생성 완료');
                }
            }
            
        } catch (error) {
            console.error('❌ 콘텐츠 영역 준비 실패:', error);
        }
    }
    
    /**
     * URL로부터 템플릿 콘텐츠 생성 (ContentStorage 사용)
     */
    createTemplateContentFromURL(url) {
        // URL에서 페이지 정보 추출
        const parts = url.split('/').filter(p => p);
        const menuId = parts[0] || 'about';
        const submenuId = parts[1] || 'welcome';
        
        // 기본 서브메뉴 객체 생성
        const submenu = {
            title: this.getPageTitle(menuId, submenuId),
            koreanTitle: this.getKoreanPageTitle(menuId, submenuId),
            url: url
        };
        
        // ContentStorage를 사용하여 페이지 HTML 생성
        return this.contentStorage.generatePageHTML(menuId, submenuId, submenu);
    }
    
    /**
     * 기존 createTemplateContent 메서드 (호환성 유지)
     */
    createTemplateContent_Legacy(url) {
        // Extract page info from URL
        const parts = url.split('/').filter(p => p);
        const section = parts[0] || 'home';
        const page = parts[1] || 'index';
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${this.getPageTitle(section, page)}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: #f5f5f5;
                    }
                    
                    .header {
                        background: #fff;
                        padding: 20px 0;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 20px;
                    }
                    
                    .nav {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .logo {
                        font-size: 18px;
                        font-weight: bold;
                        color: #166534;
                        display: flex;
                        align-items: center;
                    }
                    
                    .nav-menu {
                        display: flex;
                        list-style: none;
                        gap: 30px;
                    }
                    
                    .nav-menu a {
                        text-decoration: none;
                        color: #666;
                        transition: color 0.3s;
                    }
                    
                    .nav-menu a:hover {
                        color: #166534;
                    }
                    
                    .hero {
                        background: linear-gradient(135deg, #166534 0%, #15803d 100%);
                        color: white;
                        padding: 80px 0;
                        text-align: center;
                    }
                    
                    .hero h1 {
                        font-size: 48px;
                        margin-bottom: 20px;
                        opacity: 0;
                        animation: fadeInUp 0.8s ease forwards;
                    }
                    
                    .hero p {
                        font-size: 20px;
                        opacity: 0;
                        animation: fadeInUp 0.8s ease 0.2s forwards;
                    }
                    
                    .content {
                        padding: 60px 0;
                        background: white;
                    }
                    
                    .breadcrumb {
                        display: flex;
                        gap: 8px;
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 30px;
                        align-items: center;
                    }
                    
                    .breadcrumb span:last-child {
                        color: #166534;
                        font-weight: 500;
                    }
                    
                    .content h2 {
                        font-size: 36px;
                        margin-bottom: 30px;
                        color: #333;
                    }
                    
                    .content p {
                        font-size: 18px;
                        color: #666;
                        margin-bottom: 20px;
                        line-height: 1.8;
                    }
                    
                    .placeholder-text {
                        background: #f0f0f0;
                        padding: 4px 8px;
                        border-radius: 4px;
                        display: inline-block;
                        margin: 2px;
                        transition: all 0.3s ease;
                    }
                    
                    .ai-generating {
                        animation: pulse 1s ease infinite;
                    }
                    
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes pulse {
                        0%, 100% {
                            opacity: 0.5;
                        }
                        50% {
                            opacity: 1;
                        }
                    }
                    
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 30px;
                        margin-top: 40px;
                    }
                    
                    .card {
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 8px;
                        transition: transform 0.3s ease;
                    }
                    
                    .card:hover {
                        transform: translateY(-5px);
                    }
                    
                    .card h3 {
                        color: #333;
                        margin-bottom: 15px;
                    }
                    
                    .card p {
                        color: #666;
                        font-size: 16px;
                    }
                    
                    .image-placeholder {
                        width: 100%;
                        height: 300px;
                        background: linear-gradient(45deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0);
                        background-size: 20px 20px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #999;
                        font-size: 18px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <header class="header">
                    <div class="container">
                        <nav class="nav">
                            <div class="logo">
                                <img src="data:image/svg+xml,%3Csvg viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23166534' stroke='%23ffffff' stroke-width='2'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='white' font-size='12' font-weight='bold'%3E이화%3C/text%3E%3C/svg%3E" alt="이화여대" style="width: 40px; height: 40px; margin-right: 12px;">
                                이화여자대학교 사회복지학과
                            </div>
                            <ul class="nav-menu">
                                <li><a href="/about">학과소개</a></li>
                                <li><a href="/research">학사정보</a></li>
                                <li><a href="/services">입학정보</a></li>
                                <li><a href="/team">학생활동</a></li>
                                <li><a href="/portfolio">자료실</a></li>
                                <li><a href="/news">커뮤니티</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                
                <section class="hero">
                    <div class="container">
                        <h1 class="page-title">${this.getPageTitle(section, page)}</h1>
                        <p class="page-subtitle">
                            학과 소개 페이지입니다
                        </p>
                    </div>
                </section>
                
                <section class="content">
                    <div class="container">
                        <div class="breadcrumb">
                            <span>🏠 홈</span>
                            <span>›</span>
                            <span>학과소개</span>
                            <span>›</span>
                            <span>인사말</span>
                        </div>
                        <h2>개요</h2>
                        <p>
                            이화여자대학교 사회복지학과는 사회복지 전문 인력 양성을 위한 교육 프로그램을 제공합니다.
                            체계적인 이론 교육과 실무 경험을 통해 사회복지 현장에서 활동할 수 있는 역량을 기릅니다.
                        </p>
                        
                        <div class="image-placeholder">
                            <span>Image will be generated here</span>
                        </div>
                        
                        <div class="grid">
                            <div class="card">
                                <h3>교육 프로그램</h3>
                                <p>
                                    체계적인 사회복지 교육과정을 통해 전문성을 기릅니다.
                                </p>
                            </div>
                            <div class="card">
                                <h3>현장 실습</h3>
                                <p>
                                    다양한 사회복지 현장에서의 실무 경험을 제공합니다.
                                </p>
                            </div>
                            <div class="card">
                                <h3>진로 지도</h3>
                                <p>
                                    졸업 후 진로에 대한 체계적인 상담과 지원을 제공합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </body>
            </html>
        `;
    }
    
    /**
     * 영어 페이지 제목 조회 (기존 호환성)
     */
    getPageTitle(section, page) {
        const titles = {
            'about': {
                'welcome': 'Welcome Message',
                'company': 'Department Overview',
                'mission': 'Educational Goals'
            },
            'research': {
                'areas': 'Curriculum',
                'projects': 'Academic Programs',
                'publications': 'Research Publications'
            },
            'services': {
                'consulting': 'Admission Guide',
                'development': 'Application Process',
                'support': 'Student Support'
            },
            'team': {
                'leadership': 'Student Council',
                'researchers': 'Student Activities',
                'careers': 'Career Guidance'
            },
            'portfolio': {
                'case-studies': 'Documents',
                'clients': 'Forms',
                'testimonials': 'Resources'
            },
            'news': {
                'latest': 'Latest News',
                'events': 'Events',
                'press': 'Announcements'
            }
        };
        
        return titles[section]?.[page] || 'Page Title';
    }
    
    /**
     * 한국어 페이지 제목 조회
     */
    getKoreanPageTitle(menuId, submenuId) {
        const titles = {
            'about': {
                'welcome': '인사말',
                'company': '학과개요',
                'mission': '교육목표'
            },
            'research': {
                'areas': '교육과정',
                'projects': '학사과정',
                'publications': '연구성과'
            },
            'services': {
                'consulting': '입학안내',
                'development': '지원절차',
                'support': '학생지원'
            },
            'team': {
                'leadership': '학생회',
                'researchers': '학생활동',
                'careers': '진로지도'
            },
            'portfolio': {
                'case-studies': '자료실',
                'clients': '양식',
                'testimonials': '참고자료'
            },
            'news': {
                'latest': '최신소식',
                'events': '행사안내',
                'press': '공지사항'
            }
        };
        
        return titles[menuId]?.[submenuId] || '페이지';
    }
    
    async animatePageTransition() {
        return new Promise(resolve => {
            // Add transition class to iframe container
            const browserContent = document.querySelector('.browser-content');
            browserContent.classList.add('page-transition-out');
            
            setTimeout(() => {
                browserContent.classList.remove('page-transition-out');
                browserContent.classList.add('page-transition-in');
                
                setTimeout(() => {
                    browserContent.classList.remove('page-transition-in');
                    resolve();
                }, 800);
            }, 300);
        });
    }
    
    setZoom(zoomLevel) {
        this.currentZoom = parseInt(zoomLevel);
        this.applyZoom();
    }
    
    applyZoom() {
        if (this.iframe && this.iframe.contentDocument) {
            const scale = this.currentZoom / 100;
            const body = this.iframe.contentDocument.body;
            
            if (body) {
                body.style.transform = `scale(${scale})`;
                body.style.transformOrigin = 'top left';
                body.style.width = `${100 / scale}%`;
                body.style.height = `${100 / scale}%`;
            }
        }
    }
    
    refreshPage() {
        if (this.currentUrl) {
            this.loadPage(this.currentUrl);
        }
    }
    
    createSkeletonContent() {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Loading...</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #f5f5f5;
                    }
                    
                    .skeleton-screen {
                        background-color: #fff;
                        min-height: 100vh;
                        padding: 20px;
                    }
                    
                    .skeleton-header {
                        height: 60px;
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeletonLoading 1.0s infinite;
                        margin-bottom: 20px;
                    }
                    
                    .skeleton-hero {
                        height: 300px;
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeletonLoading 1.0s infinite;
                        margin-bottom: 40px;
                        border-radius: 8px;
                    }
                    
                    .skeleton-content {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .skeleton-title {
                        height: 40px;
                        width: 60%;
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeletonLoading 1.0s infinite;
                        margin-bottom: 20px;
                        border-radius: 4px;
                    }
                    
                    .skeleton-text {
                        height: 20px;
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeletonLoading 1.0s infinite;
                        margin-bottom: 10px;
                        border-radius: 4px;
                    }
                    
                    .skeleton-text:nth-child(1) { width: 90%; }
                    .skeleton-text:nth-child(2) { width: 80%; }
                    .skeleton-text:nth-child(3) { width: 85%; }
                    
                    .skeleton-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 30px;
                        margin-top: 40px;
                    }
                    
                    .skeleton-card {
                        height: 200px;
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeletonLoading 1.0s infinite;
                        border-radius: 8px;
                    }
                    
                    @keyframes skeletonLoading {
                        0% {
                            background-position: -200px 0;
                        }
                        100% {
                            background-position: calc(200px + 100%) 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="skeleton-screen">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-hero"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-grid">
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    addStaggeredAnimations() {
        if (this.iframe && this.iframe.contentDocument) {
            const doc = this.iframe.contentDocument;
            
            // Add stagger class to containers
            const containers = doc.querySelectorAll('.content .container > *, .grid');
            containers.forEach((container, index) => {
                container.style.opacity = '0';
                container.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    container.style.transition = 'all 0.5s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // Add scroll animations
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observe cards and other scrollable elements
            const scrollElements = doc.querySelectorAll('.card');
            scrollElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'all 0.6s ease';
                observer.observe(el);
            });
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Create blank page ready for AI real-time typing with full layout
    createBlankPageForTyping() {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI 콘텐츠 생성 중</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9fafb;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    /* GNB - Global Navigation Bar */
                    .gnb {
                        background: #ffffff;
                        border-bottom: 1px solid #e5e7eb;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    
                    .gnb-inner {
                        max-width: 1440px;
                        margin: 0 auto;
                        padding: 0 2rem;
                        height: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }
                    
                    .gnb-logo {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: #1f2937;
                    }
                    
                    .gnb-logo svg {
                        width: 32px;
                        height: 32px;
                    }
                    
                    .gnb-menu {
                        display: flex;
                        gap: 2rem;
                        list-style: none;
                    }
                    
                    .gnb-menu a {
                        color: #4b5563;
                        text-decoration: none;
                        font-weight: 500;
                        transition: color 0.2s;
                    }
                    
                    .gnb-menu a:hover {
                        color: #6366f1;
                    }
                    
                    .gnb-menu a.active {
                        color: #6366f1;
                        font-weight: 600;
                    }
                    
                    .gnb-actions {
                        display: flex;
                        gap: 1rem;
                        align-items: center;
                    }
                    
                    .gnb-search {
                        padding: 0.5rem 1rem;
                        background: #f3f4f6;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        width: 200px;
                    }
                    
                    .gnb-profile {
                        width: 36px;
                        height: 36px;
                        background: #6366f1;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    
                    /* Main Layout */
                    .main-layout {
                        flex: 1;
                        display: flex;
                        max-width: 1440px;
                        width: 100%;
                        margin: 0 auto;
                    }
                    
                    /* LNB - Local Navigation Bar */
                    .lnb {
                        width: 240px;
                        background: #ffffff;
                        border-right: 1px solid #e5e7eb;
                        padding: 2rem 0;
                        flex-shrink: 0;
                    }
                    
                    .lnb-title {
                        padding: 0 1.5rem;
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 1rem;
                    }
                    
                    .lnb-menu {
                        list-style: none;
                    }
                    
                    .lnb-menu li {
                        margin-bottom: 0.25rem;
                    }
                    
                    .lnb-menu a {
                        display: block;
                        padding: 0.75rem 1.5rem;
                        color: #4b5563;
                        text-decoration: none;
                        transition: all 0.2s;
                        position: relative;
                    }
                    
                    .lnb-menu a:hover {
                        background: #f3f4f6;
                        color: #1f2937;
                    }
                    
                    .lnb-menu a.active {
                        background: #ede9fe;
                        color: #6366f1;
                        font-weight: 600;
                    }
                    
                    .lnb-menu a.active::before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        width: 3px;
                        background: #6366f1;
                    }
                    
                    /* Content Area */
                    .content-area {
                        flex: 1;
                        background: #ffffff;
                        min-height: calc(100vh - 64px - 180px);
                    }
                    
                    /* Page Header */
                    .page-header {
                        padding: 2rem 3rem;
                        border-bottom: 1px solid #e5e7eb;
                        background: #ffffff;
                    }
                    
                    .breadcrumb {
                        display: flex;
                        gap: 0.5rem;
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-bottom: 1rem;
                    }
                    
                    .breadcrumb span {
                        color: #d1d5db;
                    }
                    
                    .breadcrumb a {
                        color: #6b7280;
                        text-decoration: none;
                    }
                    
                    .breadcrumb a:hover {
                        color: #6366f1;
                    }
                    
                    .page-title-area {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .page-title {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #1f2937;
                    }
                    
                    .page-actions {
                        display: flex;
                        gap: 0.75rem;
                    }
                    
                    .btn {
                        padding: 0.5rem 1.25rem;
                        border-radius: 8px;
                        font-weight: 500;
                        border: 1px solid transparent;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .btn-primary {
                        background: #6366f1;
                        color: white;
                    }
                    
                    .btn-primary:hover {
                        background: #5558e3;
                    }
                    
                    .btn-secondary {
                        background: white;
                        color: #4b5563;
                        border-color: #e5e7eb;
                    }
                    
                    .btn-secondary:hover {
                        background: #f9fafb;
                    }
                    
                    /* Main Content - AI Generated Area */
                    .main-content {
                        padding: 3rem;
                    }
                    
                    .container {
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    
                    /* AI Typing Cursor */
                    .typing-cursor {
                        display: inline-block;
                        width: 2px;
                        height: 1.2em;
                        background-color: #6366F1;
                        animation: blink 1s infinite;
                        margin-left: 2px;
                    }
                    
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }
                    
                    h1 {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 1rem;
                        line-height: 1.2;
                    }
                    
                    .subtitle {
                        font-size: 1.25rem;
                        color: #6b7280;
                        margin-bottom: 2rem;
                        font-weight: 500;
                    }
                    
                    .content {
                        margin-bottom: 3rem;
                    }
                    
                    .content p {
                        font-size: 1.1rem;
                        margin-bottom: 1.5rem;
                        color: #374151;
                        line-height: 1.8;
                    }
                    
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2rem;
                        margin-top: 3rem;
                    }
                    
                    .card {
                        background: #f8fafc;
                        padding: 2rem;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        transition: all 0.3s ease;
                    }
                    
                    .card:hover {
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        transform: translateY(-2px);
                    }
                    
                    .card h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.75rem;
                    }
                    
                    .card p {
                        color: #6b7280;
                        font-size: 1rem;
                        line-height: 1.6;
                    }
                    
                    .image-placeholder {
                        width: 100%;
                        height: 300px;
                        background: #f1f5f9;
                        border-radius: 12px;
                        margin: 2rem 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748b;
                        font-size: 0.9rem;
                    }
                    
                    /* Footer */
                    .footer {
                        background: #1f2937;
                        color: #d1d5db;
                        padding: 3rem 0 2rem;
                        margin-top: auto;
                    }
                    
                    .footer-inner {
                        max-width: 1440px;
                        margin: 0 auto;
                        padding: 0 2rem;
                    }
                    
                    .footer-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr 1fr;
                        gap: 3rem;
                        margin-bottom: 2rem;
                    }
                    
                    .footer-section h4 {
                        color: #f9fafb;
                        font-size: 1rem;
                        font-weight: 600;
                        margin-bottom: 1rem;
                    }
                    
                    .footer-section p {
                        font-size: 0.875rem;
                        line-height: 1.6;
                        margin-bottom: 1rem;
                    }
                    
                    .footer-links {
                        list-style: none;
                    }
                    
                    .footer-links li {
                        margin-bottom: 0.5rem;
                    }
                    
                    .footer-links a {
                        color: #9ca3af;
                        text-decoration: none;
                        font-size: 0.875rem;
                    }
                    
                    .footer-links a:hover {
                        color: #f9fafb;
                    }
                    
                    .footer-bottom {
                        padding-top: 2rem;
                        border-top: 1px solid #374151;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.875rem;
                    }
                    
                    .social-links {
                        display: flex;
                        gap: 1rem;
                    }
                    
                    .social-links a {
                        width: 32px;
                        height: 32px;
                        background: #374151;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #9ca3af;
                        transition: all 0.2s;
                    }
                    
                    .social-links a:hover {
                        background: #4b5563;
                        color: #f9fafb;
                    }
                </style>
            </head>
            <body>
                <!-- GNB -->
                <header class="gnb">
                    <div class="gnb-inner">
                        <div class="gnb-logo">
                            <svg viewBox="0 0 32 32" fill="#6366f1">
                                <circle cx="16" cy="16" r="14" opacity="0.2"/>
                                <path d="M16 8 L21 13 L21 19 L16 24 L11 19 L11 13 Z" fill="#6366f1"/>
                            </svg>
                            <span>MyCompany</span>
                        </div>
                        <nav>
                            <ul class="gnb-menu">
                                <li><a href="#" class="active">회사소개</a></li>
                                <li><a href="#">연구개발</a></li>
                                <li><a href="#">서비스</a></li>
                                <li><a href="#">팀 소개</a></li>
                                <li><a href="#">포트폴리오</a></li>
                                <li><a href="#">자료실</a></li>
                                <li><a href="#">뉴스</a></li>
                                <li><a href="#">문의하기</a></li>
                            </ul>
                        </nav>
                        <div class="gnb-actions">
                            <input type="search" class="gnb-search" placeholder="검색...">
                            <div class="gnb-profile">J</div>
                        </div>
                    </div>
                </header>
                
                <!-- Main Layout -->
                <div class="main-layout">
                    <!-- LNB -->
                    <aside class="lnb">
                        <h3 class="lnb-title">회사소개</h3>
                        <ul class="lnb-menu">
                            <li><a href="#" class="active">환영 메시지</a></li>
                            <li><a href="#">회사 개요</a></li>
                            <li><a href="#">미션 & 비전</a></li>
                            <li><a href="#">연혁</a></li>
                            <li><a href="#">조직도</a></li>
                            <li><a href="#">인증 & 수상</a></li>
                        </ul>
                    </aside>
                    
                    <!-- Content Area -->
                    <main class="content-area">
                        <!-- Page Header -->
                        <div class="page-header">
                            <div class="breadcrumb">
                                <a href="#">홈</a>
                                <span>›</span>
                                <a href="#">회사소개</a>
                                <span>›</span>
                                <span id="breadcrumb-current">환영 메시지</span>
                            </div>
                            <div class="page-title-area">
                                <h2 class="page-title" id="page-title-text">환영 메시지</h2>
                                <div class="page-actions">
                                    <button class="btn btn-secondary">공유하기</button>
                                    <button class="btn btn-secondary">인쇄하기</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Main Content - AI Generated -->
                        <div class="main-content">
                            <div class="container">
                                <h1 id="ai-title"></h1>
                                <div class="subtitle" id="ai-subtitle"></div>
                                <div class="content" id="ai-content"></div>
                                <div class="image-placeholder" id="ai-image"></div>
                                <div class="grid" id="ai-features"></div>
                            </div>
                        </div>
                    </main>
                </div>
                
                <!-- Footer -->
                <footer class="footer">
                    <div class="footer-inner">
                        <div class="footer-grid">
                            <div class="footer-section">
                                <h4>MyCompany</h4>
                                <p>혁신적인 기술로 더 나은 미래를 만들어갑니다. 15년 이상의 경험과 전문성으로 고객의 성공을 돕습니다.</p>
                                <p>© 2024 MyCompany. All rights reserved.</p>
                            </div>
                            <div class="footer-section">
                                <h4>회사</h4>
                                <ul class="footer-links">
                                    <li><a href="#">회사소개</a></li>
                                    <li><a href="#">인재채용</a></li>
                                    <li><a href="#">파트너</a></li>
                                    <li><a href="#">IR 정보</a></li>
                                </ul>
                            </div>
                            <div class="footer-section">
                                <h4>지원</h4>
                                <ul class="footer-links">
                                    <li><a href="#">고객센터</a></li>
                                    <li><a href="#">기술지원</a></li>
                                    <li><a href="#">개발자센터</a></li>
                                    <li><a href="#">문서</a></li>
                                </ul>
                            </div>
                            <div class="footer-section">
                                <h4>법적고지</h4>
                                <ul class="footer-links">
                                    <li><a href="#">이용약관</a></li>
                                    <li><a href="#">개인정보처리방침</a></li>
                                    <li><a href="#">쿠키정책</a></li>
                                    <li><a href="#">사이트맵</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer-bottom">
                            <p>서울특별시 강남구 테헤란로 123, 15층 | 대표전화: 1588-0000 | 사업자등록번호: 123-45-67890</p>
                            <div class="social-links">
                                <a href="#">f</a>
                                <a href="#">t</a>
                                <a href="#">in</a>
                                <a href="#">y</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
            </html>
        `;
    }
    
    /**
     * Load completed page content for review mode
     * @param {string} menuId - Menu ID
     * @param {string} submenuId - Submenu ID  
     * @param {object} submenu - Submenu object with generated content
     */
    async loadCompletedPageForReview(menuId, submenuId, submenu) {
        console.log(`🔍 검토 모드: ${submenu.koreanTitle || submenu.title} 페이지 로드 중...`);
        
        try {
            // Update URL display first
            this.currentUrl = submenu.url || `/${menuId}/${submenuId}`;
            this.urlDisplay.textContent = `https://mysite.com${this.currentUrl}`;
            
            // Use ContentStorage to get actual generated content
            let reviewContent;
            
            // ContentStorage가 없으면 생성
            if (!window.contentStorage) {
                console.log('🔄 ContentStorage 초기화');
                window.contentStorage = new ContentStorage();
            }
            
            const pageId = `${menuId}/${submenuId}`;
            const storedContent = window.contentStorage.getGeneratedContent(pageId);
            
            console.log(`🔍 저장된 콘텐츠 확인 [${pageId}]:`, storedContent ? '✅ 있음' : '❌ 없음');
            
            if (storedContent) {
                console.log('📄 저장된 콘텐츠 상세:', {
                    title: storedContent.content?.title,
                    hasHtml: !!storedContent.content?.htmlContent,
                    timestamp: storedContent.timestamp
                });
            }
            
            reviewContent = window.contentStorage.generatePageHTML(menuId, submenuId, submenu);
            console.log('📝 생성된 HTML 길이:', reviewContent ? reviewContent.length : 0);
            
            // 즉시 콘텐츠 로드 (애니메이션 없이)
            this.iframe.srcdoc = reviewContent;
            
            // Apply zoom
            this.applyZoom();
            
            // Add smooth load animations after content loads
            this.iframe.onload = () => {
                // 페이지 로드 후 부드러운 fade-in 효과만 적용
                this.addQuickFadeInAnimation();
                console.log(`✅ 검토 페이지 로드 완료: ${submenu.koreanTitle || submenu.title}`);
            };
            
        } catch (error) {
            console.error('❌ 검토 페이지 로드 실패:', error);
            
            // Fallback to template content
            const fallbackContent = this.createTemplateContentFromURL(this.currentUrl);
            this.iframe.srcdoc = fallbackContent;
            this.applyZoom();
        }
    }
    
    /**
     * Create review page content with generated data
     */
    createReviewPageContent(menuId, submenuId, submenu) {
        const pageTitle = submenu.koreanTitle || submenu.title;
        const sectionTitle = this.getSectionTitle(menuId);
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${pageTitle} - MyCompany</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9fafb;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    /* Review Mode Banner */
                    .review-banner {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        color: white;
                        padding: 8px 0;
                        text-align: center;
                        font-size: 0.875rem;
                        font-weight: 500;
                        position: sticky;
                        top: 0;
                        z-index: 200;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .review-banner .icon {
                        margin-right: 8px;
                    }
                    
                    /* Header */
                    .header {
                        background: #ffffff;
                        border-bottom: 1px solid #e5e7eb;
                        position: sticky;
                        top: 32px;
                        z-index: 100;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    
                    .header-inner {
                        max-width: 1440px;
                        margin: 0 auto;
                        padding: 0 2rem;
                        height: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }
                    
                    .logo {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: #1f2937;
                    }
                    
                    .logo svg {
                        width: 32px;
                        height: 32px;
                    }
                    
                    .nav-menu {
                        display: flex;
                        gap: 2rem;
                        list-style: none;
                    }
                    
                    .nav-menu a {
                        color: #4b5563;
                        text-decoration: none;
                        font-weight: 500;
                        transition: color 0.2s;
                        position: relative;
                    }
                    
                    .nav-menu a:hover {
                        color: #6366f1;
                    }
                    
                    .nav-menu a.active {
                        color: #6366f1;
                        font-weight: 600;
                    }
                    
                    .nav-menu a.active::after {
                        content: '';
                        position: absolute;
                        bottom: -16px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 24px;
                        height: 2px;
                        background: #6366f1;
                    }
                    
                    /* Hero Section */
                    .hero {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 4rem 0;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .hero::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.1"/></svg>') repeat;
                        background-size: 50px 50px;
                    }
                    
                    .hero-content {
                        position: relative;
                        z-index: 1;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 0 2rem;
                    }
                    
                    .hero h1 {
                        font-size: 3rem;
                        margin-bottom: 1.5rem;
                        font-weight: 700;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        opacity: 0;
                        animation: slideInUp 0.8s ease 0.2s forwards;
                    }
                    
                    .hero .subtitle {
                        font-size: 1.25rem;
                        opacity: 0.9;
                        font-weight: 400;
                        opacity: 0;
                        animation: slideInUp 0.8s ease 0.4s forwards;
                    }
                    
                    /* Main Content */
                    .main-content {
                        flex: 1;
                        background: white;
                        padding: 4rem 0;
                    }
                    
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 2rem;
                    }
                    
                    .breadcrumb {
                        display: flex;
                        gap: 0.5rem;
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-bottom: 2rem;
                        opacity: 0;
                        animation: slideInUp 0.6s ease 0.6s forwards;
                    }
                    
                    .breadcrumb span {
                        color: #d1d5db;
                    }
                    
                    .breadcrumb a {
                        color: #6b7280;
                        text-decoration: none;
                    }
                    
                    .breadcrumb a:hover {
                        color: #6366f1;
                    }
                    
                    .content-section {
                        margin-bottom: 3rem;
                        opacity: 0;
                        animation: slideInUp 0.6s ease 0.8s forwards;
                    }
                    
                    .content-section h2 {
                        font-size: 2rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 1.5rem;
                    }
                    
                    .content-section p {
                        font-size: 1.125rem;
                        color: #4b5563;
                        line-height: 1.8;
                        margin-bottom: 1.5rem;
                    }
                    
                    .features-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                        gap: 2rem;
                        margin-top: 3rem;
                        opacity: 0;
                        animation: slideInUp 0.6s ease 1s forwards;
                    }
                    
                    .feature-card {
                        background: #f8fafc;
                        padding: 2rem;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .feature-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    }
                    
                    .feature-card:hover {
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                        transform: translateY(-5px);
                    }
                    
                    .feature-card h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .feature-icon {
                        width: 24px;
                        height: 24px;
                        background: #6366f1;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                    }
                    
                    .feature-card p {
                        color: #6b7280;
                        line-height: 1.6;
                        font-size: 1rem;
                    }
                    
                    .highlight-box {
                        background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
                        border: 1px solid #c4b5fd;
                        border-radius: 12px;
                        padding: 2rem;
                        margin: 3rem 0;
                        position: relative;
                        opacity: 0;
                        animation: slideInUp 0.6s ease 1.2s forwards;
                    }
                    
                    .highlight-box::before {
                        content: '💡';
                        position: absolute;
                        top: -12px;
                        left: 2rem;
                        background: white;
                        padding: 0 8px;
                        font-size: 1.2rem;
                    }
                    
                    .highlight-box h3 {
                        color: #5b21b6;
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                    }
                    
                    .highlight-box p {
                        color: #6b46c1;
                        font-size: 1rem;
                        margin: 0;
                    }
                    
                    /* Footer */
                    .footer {
                        background: #1f2937;
                        color: #d1d5db;
                        padding: 3rem 0 2rem;
                        margin-top: auto;
                    }
                    
                    .footer-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 2rem;
                        text-align: center;
                    }
                    
                    .footer p {
                        font-size: 0.875rem;
                        opacity: 0.8;
                    }
                    
                    /* Animations */
                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    /* Generated content indicator */
                    .generated-indicator {
                        position: fixed;
                        top: 50%;
                        right: 20px;
                        transform: translateY(-50%);
                        background: rgba(99, 102, 241, 0.9);
                        color: white;
                        padding: 12px 16px;
                        border-radius: 50px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        z-index: 1000;
                        backdrop-filter: blur(8px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        opacity: 0;
                        animation: slideInRight 0.5s ease 1.5s forwards;
                    }
                    
                    @keyframes slideInRight {
                        from {
                            opacity: 0;
                            transform: translateY(-50%) translateX(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(-50%) translateX(0);
                        }
                    }
                </style>
            </head>
            <body>
                <!-- Review Mode Banner -->
                <div class="review-banner">
                    <span class="icon">👁️</span>
                    검토 모드: AI가 생성한 콘텐츠를 확인하고 있습니다
                </div>
                
                <!-- Header -->
                <header class="header">
                    <div class="header-inner">
                        <div class="logo">
                            <svg viewBox="0 0 32 32" fill="#6366f1">
                                <circle cx="16" cy="16" r="14" opacity="0.2"/>
                                <path d="M16 8 L21 13 L21 19 L16 24 L11 19 L11 13 Z"/>
                            </svg>
                            <span>MyCompany</span>
                        </div>
                        <nav>
                            <ul class="nav-menu">
                                <li><a href="#" class="${menuId === 'about' ? 'active' : ''}">회사소개</a></li>
                                <li><a href="#" class="${menuId === 'research' ? 'active' : ''}">연구개발</a></li>
                                <li><a href="#" class="${menuId === 'services' ? 'active' : ''}">서비스</a></li>
                                <li><a href="#" class="${menuId === 'team' ? 'active' : ''}">팀 소개</a></li>
                                <li><a href="#" class="${menuId === 'portfolio' ? 'active' : ''}">포트폴리오</a></li>
                                <li><a href="#" class="${menuId === 'resources' ? 'active' : ''}">자료실</a></li>
                                <li><a href="#" class="${menuId === 'news' ? 'active' : ''}">뉴스</a></li>
                                <li><a href="#" class="${menuId === 'contact' ? 'active' : ''}">문의하기</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                
                <!-- Hero Section -->
                <section class="hero">
                    <div class="hero-content">
                        <h1>${pageTitle}</h1>
                        <p class="subtitle">${this.getPageSubtitle(menuId, submenuId)}</p>
                    </div>
                </section>
                
                <!-- Main Content -->
                <main class="main-content">
                    <div class="container">
                        <div class="breadcrumb">
                            <a href="#">홈</a>
                            <span>›</span>
                            <a href="#">${sectionTitle}</a>
                            <span>›</span>
                            <span>${pageTitle}</span>
                        </div>
                        
                        <div class="content-section">
                            <h2>개요</h2>
                            <p>${this.getGeneratedContent(menuId, submenuId)}</p>
                            <p>이 페이지는 AI가 생성한 완성된 콘텐츠입니다. 실제 서비스에서는 더욱 풍부하고 정확한 내용으로 구성됩니다.</p>
                        </div>
                        
                        <div class="features-grid">
                            ${this.generateFeatureCards(menuId, submenuId)}
                        </div>
                        
                        <div class="highlight-box">
                            <h3>주요 특징</h3>
                            <p>AI 기술을 활용하여 생성된 이 콘텐츠는 사용자의 요구사항과 비즈니스 목표에 맞춰 최적화되었습니다. 지속적인 학습과 개선을 통해 더 나은 결과를 제공합니다.</p>
                        </div>
                    </div>
                </main>
                
                <!-- Footer -->
                <footer class="footer">
                    <div class="footer-content">
                        <p>© 2024 MyCompany. All rights reserved. | AI로 생성된 콘텐츠입니다.</p>
                    </div>
                </footer>
                
                <!-- Generated Content Indicator -->
                <div class="generated-indicator">
                    ✨ AI 생성 완료
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Get section title in Korean
     */
    getSectionTitle(menuId) {
        const sectionTitles = {
            'about': '회사소개',
            'research': '연구개발', 
            'services': '서비스',
            'team': '팀 소개',
            'portfolio': '포트폴리오',
            'resources': '자료실',
            'news': '뉴스',
            'contact': '문의하기'
        };
        return sectionTitles[menuId] || '페이지';
    }
    
    /**
     * Get page subtitle
     */
    getPageSubtitle(menuId, submenuId) {
        const subtitles = {
            'about': {
                'welcome': '당신을 환영합니다. 함께 미래를 만들어가요.',
                'company': '혁신과 전문성으로 고객과 함께 성장합니다.',
                'mission': '더 나은 세상을 위한 우리의 약속입니다.'
            },
            'research': {
                'areas': '최첨단 기술 연구로 미래를 선도합니다.',
                'projects': '현재 진행 중인 혁신적인 프로젝트들을 소개합니다.',
                'publications': '우리의 연구 성과와 학술적 기여를 확인하세요.'
            },
            'services': {
                'consulting': '전문적인 컨설팅으로 비즈니스 성공을 지원합니다.',
                'development': '맞춤형 개발 서비스로 아이디어를 현실로 만듭니다.',
                'support': '언제나 곁에서 도움을 드리겠습니다.'
            }
        };
        
        return subtitles[menuId]?.[submenuId] || 'AI가 생성한 전문적인 콘텐츠를 확인해보세요.';
    }
    
    /**
     * Generate sample content based on menu/submenu
     */
    getGeneratedContent(menuId, submenuId) {
        const contents = {
            'about': {
                'welcome': '저희 회사에 오신 것을 진심으로 환영합니다. 15년간의 경험과 전문성을 바탕으로 고객의 성공을 위해 최선을 다하고 있습니다. 혁신적인 기술과 창의적인 솔루션으로 비즈니스 가치를 창출하며, 지속 가능한 성장을 추구합니다.',
                'company': '우리는 기술 혁신을 통해 사회에 기여하는 것을 사명으로 합니다. 전문적인 팀과 체계적인 프로세스를 통해 고품질의 서비스를 제공하며, 고객의 신뢰를 바탕으로 지속적인 발전을 이어가고 있습니다.',
                'mission': '더 나은 미래를 위한 기술 혁신과 사회적 가치 창출이 우리의 미션입니다. 고객 중심의 사고와 지속적인 학습을 통해 업계를 선도하는 기업으로 성장하고 있습니다.'
            },
            'research': {
                'areas': '인공지능, 빅데이터, 클라우드 컴퓨팅 등 최첨단 기술 분야에서 활발한 연구개발을 진행하고 있습니다. 산학협력과 글로벌 파트너십을 통해 혁신적인 기술 개발에 앞장서고 있습니다.',
                'projects': '현재 진행 중인 주요 프로젝트는 AI 기반 스마트 솔루션 개발, 차세대 데이터 플랫폼 구축, 그리고 디지털 트랜스포메이션 지원 서비스입니다. 각 프로젝트는 실용적이고 혁신적인 접근 방식으로 추진되고 있습니다.',
                'publications': '국내외 주요 학술지와 컨퍼런스에서 50여 편의 논문을 발표했으며, 다수의 특허를 보유하고 있습니다. 연구 성과는 실제 비즈니스에 적용되어 고객 가치 창출에 기여하고 있습니다.'
            },
            'services': {
                'consulting': '비즈니스 전략 수립부터 시스템 구축까지 전 과정을 체계적으로 지원합니다. 고객의 특성과 요구사항을 정확히 파악하여 최적의 솔루션을 제안하고, 성공적인 프로젝트 완료를 보장합니다.',
                'development': '웹, 모바일, 엔터프라이즈 시스템 개발에서 풍부한 경험을 보유하고 있습니다. 최신 기술 스택과 애자일 방법론을 활용하여 고품질의 소프트웨어를 개발하고, 지속적인 유지보수 서비스를 제공합니다.',
                'support': '24/7 기술 지원 서비스를 통해 언제든지 고객의 문제를 해결해드립니다. 신속한 대응과 전문적인 해결책으로 고객의 비즈니스 연속성을 보장하며, 예방적 관리 서비스도 함께 제공합니다.'
            }
        };
        
        return contents[menuId]?.[submenuId] || 'AI가 생성한 전문적인 콘텐츠입니다. 이 내용은 실제 비즈니스 요구사항에 맞춰 더욱 구체적이고 실용적인 정보로 발전시킬 수 있습니다.';
    }
    
    /**
     * Generate feature cards for each page
     */
    generateFeatureCards(menuId, submenuId) {
        const features = {
            'about': {
                'welcome': [
                    { icon: '🏢', title: '회사 연혁', desc: '15년간의 성장과 발전 과정을 소개합니다.' },
                    { icon: '👥', title: '전문 팀', desc: '각 분야별 전문가들이 함께합니다.' },
                    { icon: '🌟', title: '핵심 가치', desc: '혁신, 신뢰, 협력의 가치를 추구합니다.' }
                ],
                'company': [
                    { icon: '📈', title: '사업 영역', desc: '다양한 분야에서 전문성을 발휘합니다.' },
                    { icon: '🎯', title: '비즈니스 목표', desc: '고객 만족과 지속 성장을 추구합니다.' },
                    { icon: '🔍', title: '경쟁 우위', desc: '차별화된 기술력과 서비스를 제공합니다.' }
                ],
                'mission': [
                    { icon: '🚀', title: '비전', desc: '업계를 선도하는 혁신 기업이 되겠습니다.' },
                    { icon: '💎', title: '핵심 가치', desc: '정직, 혁신, 고객 중심의 가치를 실천합니다.' },
                    { icon: '🤝', title: '사회적 책임', desc: '지속 가능한 발전에 기여하겠습니다.' }
                ]
            },
            'research': {
                'areas': [
                    { icon: '🤖', title: 'AI & ML', desc: '인공지능과 머신러닝 기술 연구' },
                    { icon: '📊', title: 'Big Data', desc: '대용량 데이터 처리 및 분석' },
                    { icon: '☁️', title: 'Cloud', desc: '클라우드 네이티브 솔루션 개발' }
                ],
                'projects': [
                    { icon: '🔬', title: '스마트 팩토리', desc: 'IoT 기반 지능형 제조 시스템' },
                    { icon: '📱', title: '모바일 플랫폼', desc: '차세대 모바일 서비스 플랫폼' },
                    { icon: '🌐', title: '웹 3.0', desc: '분산형 웹 기술 개발' }
                ],
                'publications': [
                    { icon: '📄', title: '학술 논문', desc: '50+ 편의 국제 학술지 게재' },
                    { icon: '🏆', title: '수상 경력', desc: '다수의 기술 혁신상 수상' },
                    { icon: '🔐', title: '특허', desc: '20+ 건의 핵심 기술 특허' }
                ]
            },
            'services': {
                'consulting': [
                    { icon: '💼', title: '전략 컨설팅', desc: '비즈니스 전략 수립 및 실행' },
                    { icon: '🔧', title: '기술 컨설팅', desc: '최적의 기술 솔루션 제안' },
                    { icon: '📊', title: '프로세스 개선', desc: '업무 효율성 향상 지원' }
                ],
                'development': [
                    { icon: '🌐', title: '웹 개발', desc: '반응형 웹 애플리케이션 개발' },
                    { icon: '📱', title: '모바일 앱', desc: '네이티브 및 하이브리드 앱 개발' },
                    { icon: '⚙️', title: '시스템 통합', desc: '레거시 시스템 현대화' }
                ],
                'support': [
                    { icon: '🛠️', title: '기술 지원', desc: '24/7 전문 기술 지원 서비스' },
                    { icon: '📞', title: '고객 센터', desc: '신속하고 정확한 고객 응대' },
                    { icon: '🔄', title: '유지보수', desc: '시스템 안정성 및 성능 관리' }
                ]
            }
        };
        
        const defaultFeatures = [
            { icon: '✨', title: 'AI 생성 콘텐츠', desc: '첨단 AI 기술로 생성된 전문 콘텐츠' },
            { icon: '🎯', title: '맞춤형 솔루션', desc: '고객 요구에 최적화된 서비스' },
            { icon: '🚀', title: '혁신적 접근', desc: '창의적이고 실용적인 문제 해결' }
        ];
        
        const currentFeatures = features[menuId]?.[submenuId] || defaultFeatures;
        
        return currentFeatures.map(feature => `
            <div class="feature-card">
                <h3>
                    <div class="feature-icon">${feature.icon}</div>
                    ${feature.title}
                </h3>
                <p>${feature.desc}</p>
            </div>
        `).join('');
    }
    
    /**
     * Add review mode specific animations
     */
    addReviewModeAnimations() {
        if (this.iframe && this.iframe.contentDocument) {
            const doc = this.iframe.contentDocument;
            
            // Add subtle entrance animations for review mode
            const animatedElements = doc.querySelectorAll('.content-section, .features-grid, .highlight-box');
            animatedElements.forEach((element, index) => {
                element.style.animationDelay = `${0.8 + (index * 0.2)}s`;
            });
            
            // Add interactive elements for better review experience
            const featureCards = doc.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-8px)';
                    card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                });
            });
            
            console.log('✨ 검토 모드 애니메이션 적용 완료');
        }
    }
    
    /**
     * 빠른 fade-in 애니메이션 (완료된 페이지용)
     */
    addQuickFadeInAnimation() {
        if (this.iframe && this.iframe.contentDocument) {
            const doc = this.iframe.contentDocument;
            const browserContent = document.querySelector('.browser-content');
            
            // iframe 전체에 빠른 fade-in 적용
            if (browserContent) {
                browserContent.style.opacity = '0';
                browserContent.style.transition = 'opacity 0.3s ease';
                
                // 즉시 보이게 하기
                requestAnimationFrame(() => {
                    browserContent.style.opacity = '1';
                });
            }
            
            console.log('✨ 빠른 페이드인 애니메이션 적용 완료');
        }
    }
}