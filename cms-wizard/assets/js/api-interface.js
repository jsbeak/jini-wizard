// API Interface for Real Backend Integration
class APIInterface {
    constructor() {
        this.baseURL = this.detectEnvironment();
        this.apiKey = null;
        this.sessionId = this.generateSessionId();
        this.retryCount = 3;
        this.timeout = 30000; // 30 seconds
        console.log(`🔗 API Interface 초기화: ${this.baseURL}`);
    }
    
    /**
     * 환경 감지 및 기본 URL 설정
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else if (hostname.includes('dev') || hostname.includes('staging')) {
            return 'https://dev-api.company.com/api';
        } else {
            return 'https://api.company.com/api';
        }
    }
    
    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * API 키 설정
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log('🔑 API 키 설정 완료');
    }
    
    /**
     * HTTP 요청 공통 메서드
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId,
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            timeout: this.timeout
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        console.log(`🌐 API 요청: ${finalOptions.method} ${url}`);
        
        try {
            const response = await this.fetchWithTimeout(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API 응답 성공: ${endpoint}`);
            return data;
            
        } catch (error) {
            console.error(`❌ API 요청 실패: ${endpoint}`, error);
            throw error;
        }
    }
    
    /**
     * 타임아웃이 있는 fetch
     */
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    /**
     * 사이트 정보 조회
     */
    async getSiteInfo(siteId) {
        return await this.makeRequest(`/sites/${siteId}`);
    }
    
    /**
     * 메뉴 구조 조회
     */
    async getMenuStructure(siteId) {
        return await this.makeRequest(`/sites/${siteId}/menu`);
    }
    
    /**
     * AI 콘텐츠 생성 요청
     */
    async generateContent(pageData) {
        const payload = {
            siteId: pageData.siteId,
            menuId: pageData.menuId,
            submenuId: pageData.submenuId,
            pageType: pageData.pageType || 'standard',
            language: 'ko',
            prompt: this.buildPrompt(pageData),
            options: {
                length: 'medium',
                tone: 'professional',
                includeImages: true,
                includeFeatures: true
            }
        };
        
        return await this.makeRequest('/ai/generate-content', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    
    /**
     * 프롬프트 생성
     */
    buildPrompt(pageData) {
        const { menuId, submenuId, menuTitle, submenuTitle } = pageData;
        
        return `${menuTitle} > ${submenuTitle} 페이지를 위한 전문적이고 매력적인 콘텐츠를 생성해주세요. 
        
        요구사항:
        - 한국어로 작성
        - 전문적이고 신뢰감 있는 톤
        - 주요 특징 3-4개 포함
        - 실용적이고 구체적인 내용
        - SEO 친화적인 구조
        
        페이지 유형: ${menuId}/${submenuId}
        대상 독자: 일반 사용자 및 전문가`;
    }
    
    /**
     * 생성된 콘텐츠 저장
     */
    async saveGeneratedContent(pageId, contentData) {
        const payload = {
            pageId,
            content: contentData,
            generatedAt: new Date().toISOString(),
            sessionId: this.sessionId
        };
        
        return await this.makeRequest('/content/save', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    
    /**
     * 저장된 콘텐츠 조회
     */
    async getGeneratedContent(pageId) {
        return await this.makeRequest(`/content/${pageId}`);
    }
    
    /**
     * 전체 사이트 콘텐츠 조회
     */
    async getSiteContent(siteId) {
        return await this.makeRequest(`/sites/${siteId}/content`);
    }
    
    /**
     * 콘텐츠 내보내기
     */
    async exportContent(siteId, format = 'json') {
        return await this.makeRequest(`/sites/${siteId}/export?format=${format}`, {
            method: 'POST'
        });
    }
    
    /**
     * 생성 진행 상황 조회
     */
    async getGenerationStatus(jobId) {
        return await this.makeRequest(`/jobs/${jobId}/status`);
    }
    
    /**
     * 배치 콘텐츠 생성
     */
    async generateBatchContent(siteId, pageList) {
        const payload = {
            siteId,
            pages: pageList,
            sessionId: this.sessionId,
            options: {
                parallel: true,
                maxConcurrency: 3
            }
        };
        
        return await this.makeRequest('/ai/generate-batch', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    
    /**
     * 사용량 통계 조회
     */
    async getUsageStats(siteId) {
        return await this.makeRequest(`/stats/usage/${siteId}`);
    }
    
    /**
     * 오류 보고
     */
    async reportError(error, context) {
        const payload = {
            error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            },
            context,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        try {
            await this.makeRequest('/errors/report', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (reportError) {
            console.error('오류 보고 실패:', reportError);
        }
    }
    
    /**
     * API 상태 확인
     */
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 재시도 로직이 있는 요청
     */
    async requestWithRetry(endpoint, options = {}, retries = this.retryCount) {
        try {
            return await this.makeRequest(endpoint, options);
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                console.log(`🔄 재시도 중... (${this.retryCount - retries + 1}/${this.retryCount})`);
                await this.sleep(1000 * (this.retryCount - retries + 1)); // 지수 백오프
                return await this.requestWithRetry(endpoint, options, retries - 1);
            }
            throw error;
        }
    }
    
    /**
     * 재시도 가능한 오류인지 확인
     */
    isRetryableError(error) {
        const retryableErrors = [
            'Request timeout',
            'Network error',
            'HTTP 500',
            'HTTP 502',
            'HTTP 503',
            'HTTP 504'
        ];
        
        return retryableErrors.some(retryable => 
            error.message.includes(retryable)
        );
    }
    
    /**
     * 대기 함수
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * API 인터페이스를 위한 ContentStorage 어댑터
     */
    createContentStorageAdapter() {
        const apiInterface = this;
        
        return {
            async storeGeneratedContent(pageId, content) {
                try {
                    // 로컬에 저장
                    const localResult = window.contentStorage.storeGeneratedContent(pageId, content);
                    
                    // API에도 저장 시도
                    try {
                        await apiInterface.saveGeneratedContent(pageId, content);
                        console.log('✅ API 저장 성공:', pageId);
                    } catch (apiError) {
                        console.warn('⚠️ API 저장 실패, 로컬만 저장:', apiError);
                    }
                    
                    return localResult;
                } catch (error) {
                    console.error('❌ 콘텐츠 저장 실패:', error);
                    throw error;
                }
            },
            
            async getGeneratedContent(pageId) {
                try {
                    // API에서 먼저 시도
                    const apiContent = await apiInterface.getGeneratedContent(pageId);
                    return apiContent;
                } catch (apiError) {
                    // API 실패 시 로컬에서 조회
                    console.warn('⚠️ API 조회 실패, 로컬에서 조회:', apiError);
                    return window.contentStorage.getGeneratedContent(pageId);
                }
            },
            
            async generatePageHTML(menuId, submenuId, submenu) {
                // 생성된 콘텐츠 조회
                const pageId = `${menuId}/${submenuId}`;
                const content = await this.getGeneratedContent(pageId);
                
                if (content) {
                    return window.contentStorage.generateRealContentHTML(menuId, submenuId, submenu, content);
                } else {
                    return window.contentStorage.generateTemplateHTML(menuId, submenuId, submenu);
                }
            }
        };
    }
    
    /**
     * 개발 모드에서 Mock API 활성화
     */
    enableMockMode() {
        console.log('🎭 Mock API 모드 활성화');
        
        const originalMakeRequest = this.makeRequest.bind(this);
        
        this.makeRequest = async (endpoint, options = {}) => {
            // Mock 응답 생성
            if (endpoint.includes('/ai/generate-content')) {
                await this.sleep(2000); // 시뮬레이션 지연
                return {
                    success: true,
                    content: {
                        title: 'Mock Generated Title',
                        subtitle: 'Mock Generated Subtitle',
                        mainContent: ['Mock generated content paragraph 1', 'Mock generated content paragraph 2'],
                        features: [
                            { title: 'Mock Feature 1', description: 'Mock description 1' },
                            { title: 'Mock Feature 2', description: 'Mock description 2' }
                        ]
                    },
                    processingTime: 2.5,
                    jobId: 'mock_job_' + Date.now()
                };
            }
            
            if (endpoint.includes('/content/save')) {
                await this.sleep(500);
                return {
                    success: true,
                    savedAt: new Date().toISOString(),
                    id: 'mock_content_' + Date.now()
                };
            }
            
            if (endpoint.includes('/health')) {
                return { status: 'ok', timestamp: new Date().toISOString() };
            }
            
            // 기본적으로 실제 API 호출
            return await originalMakeRequest(endpoint, options);
        };
    }
}

// 전역 API 인터페이스 초기화
window.apiInterface = new APIInterface();

// 개발 환경에서 Mock 모드 자동 활성화
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.apiInterface.enableMockMode();
}