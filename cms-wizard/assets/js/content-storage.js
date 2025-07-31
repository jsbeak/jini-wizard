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
        this.initializeStorage();
    }
    
    initializeStorage() {
        console.log('🗄️ 콘텐츠 저장소 초기화');
        
        // 로컬스토리지에서 기존 데이터 복원
        const savedContent = localStorage.getItem('cms-wizard-content');
        if (savedContent) {
            try {
                const parsed = JSON.parse(savedContent);
                this.generatedContent = new Map(Object.entries(parsed.content || {}));
                this.siteInfo = { ...this.siteInfo, ...parsed.siteInfo };
                console.log('✅ 기존 콘텐츠 복원 완료:', this.generatedContent.size, '개 페이지');
            } catch (error) {
                console.warn('⚠️ 기존 콘텐츠 복원 실패:', error);
            }
        }
    }
    
    /**
     * AI 생성 콘텐츠 저장
     * @param {string} pageId - 페이지 ID (menuId/submenuId)
     * @param {object} content - 생성된 콘텐츠 객체
     */
    storeGeneratedContent(pageId, content) {
        console.log(`💾 콘텐츠 저장: ${pageId}`);
        
        const contentData = {
            pageId,
            timestamp: new Date().toISOString(),
            content: {
                title: content.title || '제목',
                subtitle: content.subtitle || '부제목',
                mainContent: content.mainContent || '메인 콘텐츠',
                features: content.features || [],
                images: content.images || [],
                metadata: content.metadata || {}
            },
            generationInfo: {
                model: 'gpt-4',
                processingTime: content.processingTime || 0,
                wordCount: this.calculateWordCount(content)
            }
        };
        
        this.generatedContent.set(pageId, contentData);
        this.saveToLocalStorage();
        
        console.log(`✅ 콘텐츠 저장 완료: ${pageId}`, contentData);
        return contentData;
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
     * 페이지별 실제 HTML 생성
     * @param {string} menuId - 메뉴 ID
     * @param {string} submenuId - 서브메뉴 ID
     * @param {object} submenu - 서브메뉴 객체
     * @returns {string} 생성된 HTML
     */
    generatePageHTML(menuId, submenuId, submenu) {
        const pageId = `${menuId}/${submenuId}`;
        const storedContent = this.getGeneratedContent(pageId);
        
        if (!storedContent) {
            console.warn(`⚠️ 저장된 콘텐츠 없음: ${pageId}, 템플릿 사용`);
            return this.generateTemplateHTML(menuId, submenuId, submenu);
        }
        
        return this.generateRealContentHTML(menuId, submenuId, submenu, storedContent);
    }
    
    /**
     * 실제 생성된 콘텐츠로 HTML 생성
     */
    generateRealContentHTML(menuId, submenuId, submenu, contentData) {
        const { content } = contentData;
        const pageTitle = content.title;
        const sectionTitle = this.getSectionTitle(menuId);
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${pageTitle} - ${this.siteInfo.siteName}</title>
                ${this.getPageStyles()}
            </head>
            <body>
                <!-- Generated Content Banner -->
                <div class="generated-banner">
                    <span class="icon">✨</span>
                    AI가 생성한 실제 콘텐츠 - ${contentData.timestamp.split('T')[0]} 생성
                </div>
                
                <!-- Header -->
                <header class="header">
                    <div class="header-inner">
                        <div class="logo">
                            <svg viewBox="0 0 32 32" fill="#6366f1">
                                <circle cx="16" cy="16" r="14" opacity="0.2"/>
                                <path d="M16 8 L21 13 L21 19 L16 24 L11 19 L11 13 Z"/>
                            </svg>
                            <span>${this.siteInfo.siteName}</span>
                        </div>
                        <nav>
                            <ul class="nav-menu">
                                <li><a href="#" class="${menuId === 'about' ? 'active' : ''}">대학소개</a></li>
                                <li><a href="#" class="${menuId === 'research' ? 'active' : ''}">연구</a></li>
                                <li><a href="#" class="${menuId === 'services' ? 'active' : ''}">학사</a></li>
                                <li><a href="#" class="${menuId === 'team' ? 'active' : ''}">구성원</a></li>
                                <li><a href="#" class="${menuId === 'portfolio' ? 'active' : ''}">성과</a></li>
                                <li><a href="#" class="${menuId === 'resources' ? 'active' : ''}">자료실</a></li>
                                <li><a href="#" class="${menuId === 'news' ? 'active' : ''}">소식</a></li>
                                <li><a href="#" class="${menuId === 'contact' ? 'active' : ''}">문의</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                
                <!-- Hero Section -->
                <section class="hero">
                    <div class="hero-content">
                        <h1>${content.title}</h1>
                        <p class="subtitle">${content.subtitle}</p>
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
                            <span>${content.title}</span>
                        </div>
                        
                        <div class="content-section">
                            <h2>개요</h2>
                            <div class="main-content-text">
                                ${this.formatMainContent(content.mainContent)}
                            </div>
                        </div>
                        
                        ${content.features && content.features.length > 0 ? `
                        <div class="features-grid">
                            ${content.features.map(feature => `
                                <div class="feature-card">
                                    <h3>
                                        <div class="feature-icon">${feature.icon || '🌟'}</div>
                                        ${feature.title}
                                    </h3>
                                    <p>${feature.description}</p>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        <div class="generation-info">
                            <h3>생성 정보</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">생성 시각:</span>
                                    <span class="value">${new Date(contentData.timestamp).toLocaleString('ko-KR')}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">처리 시간:</span>
                                    <span class="value">${contentData.generationInfo.processingTime}초</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">단어 수:</span>
                                    <span class="value">${contentData.generationInfo.wordCount}자</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">AI 모델:</span>
                                    <span class="value">${contentData.generationInfo.model}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                
                <!-- Footer -->
                <footer class="footer">
                    <div class="footer-content">
                        <p>© 2024 ${this.siteInfo.siteName}. All rights reserved. | AI로 생성된 실제 콘텐츠입니다.</p>
                    </div>
                </footer>
                
                <!-- Real Content Indicator -->
                <div class="real-content-indicator">
                    🎯 실제 생성 콘텐츠
                </div>
            </body>
            </html>
        `;
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
     * 템플릿 HTML 생성 (폴백용)
     */
    generateTemplateHTML(menuId, submenuId, submenu) {
        console.log(`📋 템플릿 HTML 생성: ${menuId}/${submenuId}`);
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${submenu.koreanTitle || submenu.title} - ${this.siteInfo.siteName}</title>
                ${this.getPageStyles()}
            </head>
            <body>
                <!-- Template Warning Banner -->
                <div class="template-banner">
                    <span class="icon">⚠️</span>
                    템플릿 콘텐츠 - 실제 AI 생성 콘텐츠가 없어 기본 템플릿을 표시합니다
                </div>
                
                <div class="template-content">
                    <h1>${submenu.koreanTitle || submenu.title}</h1>
                    <p>이 페이지는 아직 AI가 생성하지 않은 콘텐츠입니다.</p>
                    <p>실제 개발 시에는 여기에 생성된 콘텐츠가 표시됩니다.</p>
                </div>
            </body>
            </html>
        `;
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
     * 생성 콘텐츠 전용 스타일
     */
    getGeneratedContentStyles() {
        return `
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
            
            .main-content-text p {
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
                background: linear-gradient(135deg, #10b981, #059669);
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
                background: #10b981;
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
            
            /* Generation Info */
            .generation-info {
                background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
                border: 1px solid #c4b5fd;
                border-radius: 12px;
                padding: 2rem;
                margin: 3rem 0;
                opacity: 0;
                animation: slideInUp 0.6s ease 1.2s forwards;
            }
            
            .generation-info h3 {
                color: #5b21b6;
                font-size: 1.25rem;
                margin-bottom: 1rem;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-item .label {
                font-weight: 500;
                color: #6b46c1;
            }
            
            .info-item .value {
                font-weight: 600;
                color: #5b21b6;
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
            
            /* Real Content Indicator */
            .real-content-indicator {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: rgba(16, 185, 129, 0.9);
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
            
            /* Template Content */
            .template-content {
                max-width: 800px;
                margin: 4rem auto;
                padding: 4rem 2rem;
                text-align: center;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .template-content h1 {
                font-size: 2rem;
                color: #1f2937;
                margin-bottom: 1rem;
            }
            
            .template-content p {
                font-size: 1.125rem;
                color: #6b7280;
                margin-bottom: 1rem;
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