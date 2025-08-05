// Content Storage Manager - 생성된 콘텐츠 저장 및 관리
class ContentStorage {
    constructor() {
        this.generatedContent = new Map(); // 페이지별 생성된 콘텐츠 저장
        this.siteInfo = {
            siteName: '이화여자대학교',
            domain: 'ewha.ac.kr',
            theme: 'academic',
            language: 'ko'
        };
        this.templates = new Map(); // 템플릿 캐시
        this.siteTemplate = null; // 기본 사이트 템플릿
        this.pageContents = new Map(); // 페이지별 cms-content 내용
        this.initializeStorage();
    }
    
    initializeStorage() {
        console.log('🗄️ 콘텐츠 저장소 초기화');
        
        // 기본 사이트 템플릿 생성
        this.siteTemplate = this.createSiteTemplate();
        
        // 로컬스토리지에서 기존 데이터 복원
        const savedContent = localStorage.getItem('cms-wizard-content');
        if (savedContent) {
            try {
                const parsed = JSON.parse(savedContent);
                this.generatedContent = new Map(Object.entries(parsed.content || {}));
                this.pageContents = new Map(Object.entries(parsed.pageContents || {}));
                this.siteInfo = { ...this.siteInfo, ...parsed.siteInfo };
                console.log('✅ 기존 콘텐츠 복원 완료:', this.generatedContent.size, '개 페이지');
            } catch (error) {
                console.warn('⚠️ 기존 콘텐츠 복원 실패:', error);
            }
        }
    }
    
    /**
     * 이화여대 기본 사이트 템플릿 생성
     * cms-content 영역은 플레이스홀더로 남겨둠
     */
    createSiteTemplate() {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{{PAGE_TITLE}} - ${this.siteInfo.siteName}</title>
                ${this.getPageStyles()}
            </head>
            <body>
                <!-- Header -->
                <header class="header">
                    <div class="container">
                        <nav class="nav">
                            <div class="logo">
                                <img src="data:image/svg+xml,%3Csvg viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23166534' stroke='%23ffffff' stroke-width='2'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='white' font-size='12' font-weight='bold'%3E이화%3C/text%3E%3C/svg%3E" alt="이화여대" style="width: 40px; height: 40px; margin-right: 12px;">
                                이화여자대학교 사회복지학과
                            </div>
                            <ul class="nav-menu">
                                <li><a href="/about" class="{{MENU_about_ACTIVE}}">학과소개</a></li>
                                <li><a href="/research" class="{{MENU_research_ACTIVE}}">학사정보</a></li>
                                <li><a href="/services" class="{{MENU_services_ACTIVE}}">입학정보</a></li>
                                <li><a href="/team" class="{{MENU_team_ACTIVE}}">학생활동</a></li>
                                <li><a href="/portfolio" class="{{MENU_portfolio_ACTIVE}}">자료실</a></li>
                                <li><a href="/news" class="{{MENU_news_ACTIVE}}">커뮤니티</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                
                <!-- Hero Section -->
                <section class="hero">
                    <div class="container">
                        <h1 class="page-title">{{HERO_TITLE}}</h1>
                        <p class="page-subtitle">{{HERO_SUBTITLE}}</p>
                    </div>
                </section>
                
                <!-- Main Content Area -->
                <section class="content">
                    <div class="container">
                        <div class="breadcrumb">
                            <span>🏠 홈</span>
                            <span>›</span>
                            <span>{{BREADCRUMB_SECTION}}</span>
                            <span>›</span>
                            <span>{{BREADCRUMB_PAGE}}</span>
                        </div>
                        
                        <!-- CMS Content Area - 이 부분만 교체됨 -->
                        <div id="cms-content">
                            {{CMS_CONTENT}}
                        </div>
                    </div>
                </section>
            </body>
            </html>
        `;
    }
    
    /**
     * AI 생성 콘텐츠 저장 (cms-content 영역만)
     * @param {string} pageId - 페이지 ID (menuId/submenuId)
     * @param {object} content - 생성된 콘텐츠 객체
     */
    storeGeneratedContent(pageId, content) {
        console.log(`💾 콘텐츠 저장: ${pageId}`);
        
        // CMS Content HTML 생성 (AI가 직접 생성한 것이 있으면 우선 사용)
        const cmsContentHTML = content.cmsContentHTML || this.generateCMSContentHTML(content);
        
        // 기존 방식도 유지 (하위 호환성)
        const contentData = {
            pageId,
            timestamp: new Date().toISOString(),
            content: {
                title: content.title || '제목',
                subtitle: content.subtitle || '부제목',
                mainContent: content.mainContent || '메인 콘텐츠',
                features: content.features || [],
                images: content.images || [],
                metadata: content.metadata || {},
                htmlContent: cmsContentHTML // 전체 HTML이 아닌 cms-content만
            },
            generationInfo: {
                model: 'gpt-4',
                processingTime: content.processingTime || 0,
                wordCount: this.calculateWordCount(content)
            }
        };
        
        // 새로운 방식: cms-content 영역만 별도 저장
        this.pageContents.set(pageId, {
            content: cmsContentHTML,
            title: content.title || '제목',
            subtitle: content.subtitle || '부제목',
            generated: new Date().toISOString()
        });
        
        this.generatedContent.set(pageId, contentData);
        this.saveToLocalStorage();
        
        console.log(`✅ 콘텐츠 저장 완료: ${pageId}`, contentData);
        return contentData;
    }
    
    /**
     * CMS Content 영역 HTML 생성
     * @param {object} content - 콘텐츠 객체
     * @returns {string} cms-content 영역 HTML
     */
    generateCMSContentHTML(content) {
        return `
            <h2>개요</h2>
            ${this.formatMainContent(content.mainContent || content.content)}
            
            <div class="image-placeholder">
                <span>Image will be generated here</span>
            </div>
            
            ${content.features && content.features.length > 0 ? `
            <div class="grid">
                ${content.features.map(feature => `
                    <div class="card">
                        <h3>${feature.title}</h3>
                        <p>${feature.description || feature.desc}</p>
                    </div>
                `).join('')}
            </div>
            ` : `
            <div class="grid">
                <div class="card">
                    <h3>교육 프로그램</h3>
                    <p>체계적인 사회복지 교육과정을 통해 전문성을 기릅니다.</p>
                </div>
                <div class="card">
                    <h3>현장 실습</h3>
                    <p>다양한 사회복지 현장에서의 실무 경험을 제공합니다.</p>
                </div>
                <div class="card">
                    <h3>진로 지도</h3>
                    <p>졸업 후 진로에 대한 체계적인 상담과 지원을 제공합니다.</p>
                </div>
            </div>
            `}
        `;
    }
    
    /**
     * 저장된 콘텐츠 조회
     * @param {string} pageId - 페이지 ID
     * @returns {object|null} 저장된 콘텐츠 또는 null
     */
    getGeneratedContent(pageId) {
        const content = this.generatedContent.get(pageId);
        console.log(`🔍 콘텐츠 조회: ${pageId}`, content ? '발견' : '없음');
        return content || null;
    }
    
    /**
     * 모든 생성된 콘텐츠 조회
     * @returns {Map} 전체 콘텐츠 맵
     */
    getAllGeneratedContent() {
        return this.generatedContent;
    }
    
    /**
     * 페이지별 실제 HTML 생성 (템플릿 + CMS 콘텐츠 조합)
     * @param {string} menuId - 메뉴 ID
     * @param {string} submenuId - 서브메뉴 ID
     * @param {object} submenu - 서브메뉴 객체
     * @returns {string} 생성된 HTML
     */
    generatePageHTML(menuId, submenuId, submenu) {
        const pageId = `${menuId}/${submenuId}`;
        console.log(`🔄 페이지 HTML 생성: ${pageId}`);
        
        // 페이지별 CMS 콘텐츠 조회
        const pageContent = this.pageContents.get(pageId);
        const storedContent = this.getGeneratedContent(pageId);
        
        let cmsContent;
        let pageTitle = submenu.koreanTitle || submenu.title;
        let pageSubtitle = '학과 소개 페이지입니다';
        
        if (pageContent) {
            // 새로운 방식: cms-content 영역만 사용
            cmsContent = pageContent.content;
            pageTitle = pageContent.title;
            pageSubtitle = pageContent.subtitle || pageSubtitle;
            console.log(`✅ 새로운 방식 콘텐츠 사용: ${pageId}`);
        } else if (storedContent && storedContent.content && storedContent.content.htmlContent) {
            // 기존 방식 호환: htmlContent 사용
            cmsContent = storedContent.content.htmlContent;
            pageTitle = storedContent.content.title;
            pageSubtitle = storedContent.content.subtitle || pageSubtitle;
            console.log(`✅ 기존 방식 콘텐츠 사용: ${pageId}`);
        } else {
            // 기본 콘텐츠 생성
            cmsContent = this.generateDefaultCMSContent();
            console.warn(`⚠️ 저장된 콘텐츠 없음: ${pageId}, 기본 콘텐츠 사용`);
        }
        
        // 템플릿 + 콘텐츠 조합
        return this.combineTemplateAndContent(menuId, submenuId, {
            pageTitle,
            pageSubtitle,
            cmsContent
        });
    }
    
    /**
     * 템플릿과 콘텐츠를 조합하여 최종 HTML 생성
     * @param {string} menuId - 메뉴 ID
     * @param {string} submenuId - 서브메뉴 ID
     * @param {object} data - 페이지 데이터
     * @returns {string} 최종 HTML
     */
    combineTemplateAndContent(menuId, submenuId, data) {
        const sectionTitle = this.getSectionTitle(menuId);
        
        // siteTemplate이 null인 경우 재초기화
        if (!this.siteTemplate) {
            console.warn('⚠️ siteTemplate이 null입니다. 재초기화 중...');
            this.siteTemplate = this.createSiteTemplate();
        }
        
        if (!this.siteTemplate) {
            console.error('❌ siteTemplate 생성 실패');
            return this.createFallbackHTML(data);
        }
        
        return this.siteTemplate
            .replace('{{PAGE_TITLE}}', data.pageTitle || '페이지')
            .replace('{{HERO_TITLE}}', data.pageTitle || '페이지')
            .replace('{{HERO_SUBTITLE}}', data.pageSubtitle || '설명')
            .replace('{{BREADCRUMB_SECTION}}', sectionTitle)
            .replace('{{BREADCRUMB_PAGE}}', data.pageTitle || '페이지')
            .replace('{{CMS_CONTENT}}', data.cmsContent || '<p>콘텐츠가 없습니다.</p>')
            .replace(/\{\{MENU_(\w+)_ACTIVE\}\}/g, (match, menu) => {
                return menu === menuId ? 'active' : '';
            });
    }
    
    /**
     * 폴백 HTML 생성 (템플릿 실패 시)
     */
    createFallbackHTML(data) {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${data.pageTitle || '페이지'} - 이화여자대학교</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; }
                    h1 { color: #166534; }
                </style>
            </head>
            <body>
                <h1>이화여자대학교 사회복지학과</h1>
                <h2>${data.pageTitle || '페이지'}</h2>
                <div>${data.cmsContent || '<p>콘텐츠가 없습니다.</p>'}</div>
            </body>
            </html>
        `;
    }
    
    /**
     * 기본 CMS 콘텐츠 생성
     * @returns {string} 기본 콘텐츠 HTML
     */
    generateDefaultCMSContent() {
        return `
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
                    <p>체계적인 사회복지 교육과정을 통해 전문성을 기릅니다.</p>
                </div>
                <div class="card">
                    <h3>현장 실습</h3>
                    <p>다양한 사회복지 현장에서의 실무 경험을 제공합니다.</p>
                </div>
                <div class="card">
                    <h3>진로 지도</h3>
                    <p>졸업 후 진로에 대한 체계적인 상담과 지원을 제공합니다.</p>
                </div>
            </div>
        `;
    }
    
    /**
     * 로컬스토리지에 저장
     */
    saveToLocalStorage() {
        try {
            const data = {
                siteInfo: this.siteInfo,
                content: Object.fromEntries(this.generatedContent),
                pageContents: Object.fromEntries(this.pageContents), // 새로운 방식 추가
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('cms-wizard-content', JSON.stringify(data));
            console.log('💾 로컬스토리지 저장 완료');
        } catch (error) {
            console.error('❌ 로컬스토리지 저장 실패:', error);
        }
    }

    
    /**
     * 메인 콘텐츠 포매팅
     */
    formatMainContent(content) {
        if (typeof content === 'string') {
            return `<p>${content}</p>`;
        }
        
        if (Array.isArray(content)) {
            return content.map(paragraph => `<p>${paragraph}</p>`).join('');
        }
        
        return `<p>${content || '콘텐츠가 생성되지 않았습니다.'}</p>`;
    }
    
    
    /**
     * 페이지 스타일 생성
     */
    getPageStyles() {
        return `
            <style>
                ${this.getCommonStyles()}
                ${this.getGeneratedContentStyles()}
            </style>
        `;
    }
    
    /**
     * 공통 스타일
     */
    getCommonStyles() {
        return `
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
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 2rem;
            }
            
            /* Generated Content Banner */
            .generated-banner {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            
            .template-banner {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
            
            .generated-banner .icon,
            .template-banner .icon {
                margin-right: 8px;
            }
        `;
    }
    
    /**
     * 생성 콘텐츠 전용 스타일 (이화여대 테마)
     */
    getGeneratedContentStyles() {
        return `
            /* Header */
            .header {
                background: #fff;
                padding: 20px 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: sticky;
                top: 32px;
                z-index: 100;
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
            
            /* Hero Section */
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
            
            /* Content */
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
            
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-top: 40px;
            }
            
            .card {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .card:hover {
                transform: translateY(-5px);
            }
            
            .card h3 {
                margin-bottom: 15px;
                color: #333;
            }
            
            /* Animations */
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
        `;
    }
    
    /**
     * 섹션 제목 조회
     */
    getSectionTitle(menuId) {
        const sectionTitles = {
            'about': '대학소개',
            'research': '연구', 
            'services': '학사',
            'team': '구성원',
            'portfolio': '성과',
            'resources': '자료실',
            'news': '소식',
            'contact': '문의'
        };
        return sectionTitles[menuId] || '페이지';
    }
    
    /**
     * 단어 수 계산
     */
    calculateWordCount(content) {
        let totalChars = 0;
        
        if (typeof content.mainContent === 'string') {
            totalChars += content.mainContent.length;
        } else if (Array.isArray(content.mainContent)) {
            totalChars += content.mainContent.join('').length;
        }
        
        if (Array.isArray(content.features)) {
            content.features.forEach(feature => {
                totalChars += (feature.title || '').length + (feature.description || '').length;
            });
        }
        
        return totalChars;
    }
    
    /**
     * 로컬스토리지에 저장
     */
    saveToLocalStorage() {
        try {
            const data = {
                siteInfo: this.siteInfo,
                content: Object.fromEntries(this.generatedContent),
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('cms-wizard-content', JSON.stringify(data));
            console.log('💾 로컬스토리지 저장 완료');
        } catch (error) {
            console.error('❌ 로컬스토리지 저장 실패:', error);
        }
    }
    
    /**
     * 모든 콘텐츠 삭제
     */
    clearAllContent() {
        this.generatedContent.clear();
        localStorage.removeItem('cms-wizard-content');
        console.log('🗑️ 모든 콘텐츠 삭제 완료');
    }
    
    /**
     * API 연동을 위한 데이터 구조 생성
     */
    prepareForAPI() {
        return {
            siteInfo: this.siteInfo,
            pages: Array.from(this.generatedContent.entries()).map(([pageId, content]) => ({
                pageId,
                ...content
            })),
            totalPages: this.generatedContent.size,
            lastUpdated: new Date().toISOString()
        };
    }
}