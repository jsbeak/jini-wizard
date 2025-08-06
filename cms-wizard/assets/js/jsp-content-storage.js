// JSP Content Storage - 하이브리드 콘텐츠 저장소
// 기존 ContentStorage를 확장하여 JSP API와 연동

class JSPContentStorage extends ContentStorage {
    constructor() {
        super();
        this.apiBase = 'api';
        this.siteId = 'ewha'; // 현재 테스트 사이트 ID
        this.templateId = null; // 템플릿 ID
        this.templateHTML = null; // 로드된 템플릿 HTML
        this.enableHybridMode = true; // 로컬 + 서버 동시 저장
        this.enableOfflineMode = true; // 서버 장애 시 로컬 저장소 활용
        this.syncQueue = []; // 동기화 대기 큐
        this.serverAvailable = null; // 서버 상태 캐시
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1초
        this.autoSaveInterval = null; // 자동 저장 인터벌
        this.sessionState = null; // 현재 세션 상태
        
        console.log('🚀 JSP Content Storage 초기화 - 사이트 ID:', this.siteId);
        this.initializeJSPStorage();
    }
    
    /**
     * JSP 저장소 초기화
     */
    async initializeJSPStorage() {
        console.log('🔄 JSP 서버 연결 상태 확인');
        
        // 서버 상태 확인
        this.serverAvailable = await this.checkServerHealth();
        
        if (this.serverAvailable) {
            console.log('✅ JSP 서버 연결 성공');
            
            // URL 파라미터에서 templateId 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            const templateId = urlParams.get('templateId') || 'university-ewha';
            
            // 템플릿 로드
            await this.loadTemplate(templateId);
            
            // 세션 복구 시도
            await this.restoreSession();
            // 로컬 저장소와 서버 동기화
            await this.syncLocalToServer();
            // 자동 저장 시작
            this.startAutoSave();
        } else {
            console.warn('⚠️ JSP 서버 연결 실패, 오프라인 모드로 작동');
        }
    }
    
    /**
     * 템플릿 로드
     * @param {string} templateId - 템플릿 ID
     */
    async loadTemplate(templateId) {
        try {
            console.log(`📄 템플릿 로드 중: ${templateId}`);
            
            const response = await fetch(`${this.apiBase}/get-template.jsp?templateId=${templateId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.templateId = result.data.templateId;
                this.templateHTML = result.data.templateHTML;
                console.log(`✅ 템플릿 로드 성공: ${result.data.templateName}`);
                
                // site-info에 템플릿 정보 저장
                this.siteInfo.templateId = this.templateId;
                this.siteInfo.templateName = result.data.templateName;
                
                return result.data;
            } else {
                throw new Error(result.message || '템플릿 로드 실패');
            }
        } catch (error) {
            console.error('❌ 템플릿 로드 실패:', error);
            
            // 폴백: 기본 템플릿 사용
            console.log('⚠️ 기본 템플릿으로 폴백');
            this.templateHTML = this.createSiteTemplate(); // 부모 클래스의 기본 템플릿
            this.templateId = 'default';
        }
    }
    
    /**
     * 서버 상태 확인
     */
    async checkServerHealth() {
        try {
            const response = await fetch(`${this.apiBase}/list-sites.jsp`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('서버 상태 확인 실패:', error);
            return false;
        }
    }
    
    /**
     * AI 생성 콘텐츠 저장 (하이브리드 방식)
     * @param {string} pageId - 페이지 ID (menuId/submenuId)
     * @param {object} content - 생성된 콘텐츠 객체
     */
    async storeGeneratedContent(pageId, content) {
        console.log(`💾 하이브리드 콘텐츠 저장: ${pageId}`);
        
        // 1. 기존 로컬 저장 (즉시 사용 가능)
        const localResult = super.storeGeneratedContent(pageId, content);
        
        // 2. JSP 서버에 비동기 저장
        if (this.enableHybridMode) {
            try {
                await this.syncToJSPServer(pageId, content, localResult);
                console.log(`✅ 서버 저장 성공: ${pageId}`);
            } catch (error) {
                console.warn(`⚠️ 서버 저장 실패: ${pageId}`, error);
                
                if (this.enableOfflineMode) {
                    // 동기화 큐에 추가
                    this.addToSyncQueue(pageId, content, localResult);
                    console.log(`📦 동기화 큐에 추가: ${pageId}`);
                }
            }
        }
        
        return localResult;
    }
    
    /**
     * JSP 서버에 콘텐츠 동기화
     */
    async syncToJSPServer(pageId, content, contentData, retryCount = 0) {
        const [menuId, submenuId] = pageId.split('/');
        
        // HTML 생성
        const htmlContent = this.generateRealContentHTML(menuId, submenuId, 
            { koreanTitle: content.title || '제목' }, contentData);
        
        // FormData 생성
        const formData = new FormData();
        formData.append('siteId', this.siteInfo.siteId || 'ewha-university');
        formData.append('menuId', menuId);
        formData.append('submenuId', submenuId);
        formData.append('htmlContent', htmlContent);
        formData.append('metadata', JSON.stringify(contentData));
        formData.append('siteName', this.siteInfo.siteName || '이화여자대학교');
        formData.append('domain', this.siteInfo.domain || 'ewha.ac.kr');
        
        try {
            const response = await fetch(`${this.apiBase}/save-content.jsp`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '서버 저장 실패');
            }
            
            return result;
            
        } catch (error) {
            if (retryCount < this.retryAttempts) {
                console.log(`🔄 재시도 중... (${retryCount + 1}/${this.retryAttempts})`);
                await this.sleep(this.retryDelay * (retryCount + 1));
                return await this.syncToJSPServer(pageId, content, contentData, retryCount + 1);
            }
            throw error;
        }
    }
    
    /**
     * 저장된 콘텐츠 조회 (하이브리드 방식)
     * @param {string} pageId - 페이지 ID
     * @returns {object|null} 저장된 콘텐츠 또는 null
     */
    async getGeneratedContent(pageId) {
        console.log(`🔍 하이브리드 콘텐츠 조회: ${pageId}`);
        
        // 1. 서버에서 먼저 조회 시도
        if (this.serverAvailable && this.enableHybridMode) {
            try {
                const serverContent = await this.loadFromJSPServer(pageId);
                if (serverContent) {
                    // 로컬 저장소도 업데이트
                    this.generatedContent.set(pageId, serverContent);
                    this.saveToLocalStorage();
                    console.log(`📥 서버에서 콘텐츠 조회 성공: ${pageId}`);
                    return serverContent;
                }
            } catch (error) {
                console.warn(`⚠️ 서버 조회 실패: ${pageId}`, error);
            }
        }
        
        // 2. 로컬 저장소에서 조회
        const localContent = super.getGeneratedContent(pageId);
        if (localContent) {
            console.log(`💾 로컬에서 콘텐츠 조회: ${pageId}`);
            return localContent;
        }
        
        console.log(`❌ 콘텐츠 없음: ${pageId}`);
        return null;
    }
    
    /**
     * JSP 서버에서 콘텐츠 로드
     */
    async loadFromJSPServer(pageId) {
        const [menuId, submenuId] = pageId.split('/');
        
        const params = new URLSearchParams({
            siteId: this.siteId || 'ewha',
            menuId: menuId,
            submenuId: submenuId
        });
        
        try {
            const response = await fetch(`${this.apiBase}/load-page.jsp?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 응답 콘텐츠 타입 확인
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('⚠️ 서버가 HTML을 반환했습니다. JSP 설정을 확인해주세요.');
                return null; // JSP 서버가 제대로 설정되지 않은 경우
            }
            
            const result = await response.json();
            
            if (!result.success || !result.data) {
                return null;
            }
            
            // pageData 객체 전체를 반환 (cmsContentHTML 포함)
            return result.data.pageData;
            
        } catch (error) {
            console.error('서버 콘텐츠 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 모든 사이트 목록 조회
     */
    async getAllSites(includeStats = false) {
        try {
            const params = new URLSearchParams({
                includeStats: includeStats.toString(),
                includeSiteInfo: 'true',
                sortBy: 'modified',
                order: 'desc'
            });
            
            const response = await fetch(`${this.apiBase}/list-sites.jsp?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '사이트 목록 조회 실패');
            }
            
            return result.data;
            
        } catch (error) {
            console.error('사이트 목록 조회 실패:', error);
            // 로컬 저장소에서 기본 정보 반환
            return {
                sites: [{ 
                    siteId: this.siteInfo.siteId || 'ewha-university',
                    siteName: this.siteInfo.siteName || '이화여자대학교'
                }],
                totalSites: 1
            };
        }
    }
    
    /**
     * 특정 사이트의 모든 콘텐츠 조회
     */
    async getSiteContent(siteId) {
        try {
            const params = new URLSearchParams({
                siteId: siteId,
                includeHtml: 'false' // 메타데이터만 조회
            });
            
            const response = await fetch(`${this.apiBase}/load-content.jsp?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '사이트 콘텐츠 조회 실패');
            }
            
            return result.data;
            
        } catch (error) {
            console.error('사이트 콘텐츠 조회 실패:', error);
            // 로컬 저장소 데이터 반환
            return {
                siteInfo: this.siteInfo,
                menus: Array.from(this.generatedContent.keys()).map(pageId => {
                    const [menuId] = pageId.split('/');
                    return { menuId };
                })
            };
        }
    }
    
    /**
     * 동기화 큐에 항목 추가
     */
    addToSyncQueue(pageId, content, contentData) {
        const syncItem = {
            pageId,
            content,
            contentData,
            timestamp: new Date().toISOString(),
            attempts: 0
        };
        
        this.syncQueue.push(syncItem);
        this.saveToLocalStorage(); // 큐도 로컬에 저장
    }
    
    /**
     * 로컬 저장소와 서버 동기화
     */
    async syncLocalToServer() {
        console.log('🔄 로컬-서버 동기화 시작');
        
        // 동기화 큐 처리
        for (let i = this.syncQueue.length - 1; i >= 0; i--) {
            const item = this.syncQueue[i];
            
            try {
                await this.syncToJSPServer(item.pageId, item.content, item.contentData);
                console.log(`✅ 동기화 성공: ${item.pageId}`);
                this.syncQueue.splice(i, 1); // 큐에서 제거
            } catch (error) {
                item.attempts++;
                console.warn(`⚠️ 동기화 실패: ${item.pageId} (시도: ${item.attempts})`);
                
                // 최대 시도 횟수 초과 시 큐에서 제거
                if (item.attempts >= this.retryAttempts) {
                    console.error(`❌ 동기화 포기: ${item.pageId}`);
                    this.syncQueue.splice(i, 1);
                }
            }
        }
        
        this.saveToLocalStorage(); // 큐 상태 저장
        console.log('🔄 로컬-서버 동기화 완료');
    }
    
    /**
     * 로컬스토리지에 저장 (큐 포함)
     */
    saveToLocalStorage() {
        try {
            const data = {
                siteInfo: this.siteInfo,
                content: Object.fromEntries(this.generatedContent),
                syncQueue: this.syncQueue,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('cms-wizard-content', JSON.stringify(data));
            console.log('💾 로컬스토리지 저장 완료 (JSP 모드)');
        } catch (error) {
            console.error('❌ 로컬스토리지 저장 실패:', error);
        }
    }
    
    /**
     * 로컬스토리지에서 복원 (큐 포함)
     */
    initializeStorage() {
        console.log('🗄️ JSP 콘텐츠 저장소 초기화');
        
        const savedContent = localStorage.getItem('cms-wizard-content');
        if (savedContent) {
            try {
                const parsed = JSON.parse(savedContent);
                this.generatedContent = new Map(Object.entries(parsed.content || {}));
                this.siteInfo = { ...this.siteInfo, ...parsed.siteInfo };
                this.syncQueue = parsed.syncQueue || [];
                
                console.log('✅ 기존 콘텐츠 복원 완료:', this.generatedContent.size, '개 페이지');
                console.log('📦 동기화 큐:', this.syncQueue.length, '개 항목');
            } catch (error) {
                console.warn('⚠️ 기존 콘텐츠 복원 실패:', error);
            }
        }
    }
    
    /**
     * 서버 연결 재시도
     */
    async retryServerConnection() {
        console.log('🔄 서버 연결 재시도');
        this.serverAvailable = await this.checkServerHealth();
        
        if (this.serverAvailable) {
            console.log('✅ 서버 연결 복구됨');
            await this.syncLocalToServer();
        }
        
        return this.serverAvailable;
    }
    
    /**
     * 상태 정보 조회
     */
    getStatus() {
        return {
            serverAvailable: this.serverAvailable,
            hybridMode: this.enableHybridMode,
            offlineMode: this.enableOfflineMode,
            syncQueueSize: this.syncQueue.length,
            localContentSize: this.generatedContent.size,
            lastSync: new Date().toISOString()
        };
    }
    
    /**
     * 대기 함수
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 모든 콘텐츠 내보내기 (향후 구현)
     */
    async exportAllContent(format = 'json') {
        console.log(`📁 전체 콘텐츠 내보내기: ${format}`);
        // 향후 export-site.jsp와 연동
        return this.prepareForAPI();
    }
    
    /**
     * 세션 복구
     */
    async restoreSession() {
        try {
            console.log('🔄 세션 복구 시도...');
            
            const response = await fetch(`${this.apiBase}/load-session.jsp?siteId=${this.siteId}`);
            
            if (response.ok) {
                const sessionData = await response.json();
                if (sessionData.success && sessionData.data) {
                    this.sessionState = sessionData.data;
                    console.log('✅ 세션 복구 성공:', this.sessionState);
                    
                    // UI에 복구된 세션 정보 알림
                    if (window.app && this.sessionState.currentPage) {
                        window.app.showToast(`이전 작업이 복구되었습니다: ${this.sessionState.currentPage}`, 'info');
                    }
                    
                    return this.sessionState;
                }
            }
        } catch (error) {
            console.warn('⚠️ 세션 복구 실패:', error);
        }
        
        // 새 세션 시작
        this.sessionState = {
            startTime: new Date().toISOString(),
            currentPage: null,
            completedPages: [],
            totalPages: 0,
            lastActivity: new Date().toISOString()
        };
        
        console.log('🆕 새 세션 시작');
        return this.sessionState;
    }
    
    /**
     * 세션 상태 저장
     */
    async saveSession(currentPageId = null) {
        if (!this.serverAvailable) return;
        
        try {
            if (this.sessionState) {
                this.sessionState.currentPage = currentPageId;
                this.sessionState.lastActivity = new Date().toISOString();
                this.sessionState.completedPages = Array.from(this.generatedContent.keys());
                this.sessionState.totalPages = this.sessionState.completedPages.length;
            }
            
            const formData = new FormData();
            formData.append('siteId', this.siteId);
            formData.append('sessionData', JSON.stringify(this.sessionState));
            
            const response = await fetch(`${this.apiBase}/save-session.jsp`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('💾 세션 저장 완료');
            }
        } catch (error) {
            console.error('❌ 세션 저장 실패:', error);
        }
    }
    
    /**
     * 자동 저장 시작
     */
    startAutoSave() {
        // 기존 인터벌 정리
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // 3초마다 세션 상태 자동 저장
        this.autoSaveInterval = setInterval(() => {
            this.saveSession();
        }, 3000);
        
        console.log('🔄 자동 저장 시작 (3초 간격)');
    }
    
    /**
     * 자동 저장 중지
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏹️ 자동 저장 중지');
        }
    }
    
    /**
     * storeGeneratedContent 오버라이드 - 서버에 JSON 파일로 저장
     */
    async storeGeneratedContent(pageId, content) {
        console.log(`💾 서버 JSON 저장: ${pageId}`);
        
        if (!this.serverAvailable) {
            console.warn('⚠️ 서버 연결 불가, 로컬 저장만 실행');
            return super.storeGeneratedContent(pageId, content);
        }
        
        try {
            // pageId 파싱 개선
            const parts = pageId.split('/');
            if (parts.length < 2) {
                throw new Error(`잘못된 pageId 형식: ${pageId} (예: 'about/welcome')`);
            }
            
            const menuId = parts[0];
            const submenuId = parts[1];
            
            // 필수 파라미터 검증
            if (!menuId || menuId.trim() === '') {
                throw new Error(`menuId가 비어있습니다: ${pageId}`);
            }
            if (!submenuId || submenuId.trim() === '') {
                throw new Error(`submenuId가 비어있습니다: ${pageId}`);
            }
            
            console.log(`📝 페이지 저장 시도: ${pageId} (menuId: ${menuId}, submenuId: ${submenuId})`);
            
            // JSON 데이터 구조
            const pageData = {
                pageId,
                menuId,
                submenuId,
                siteId: this.siteId,
                title: content.title,
                subtitle: content.subtitle,
                mainContent: content.mainContent,
                features: content.features,
                cmsContentHTML: content.cmsContentHTML,
                metadata: {
                    ...content.metadata,
                    savedAt: new Date().toISOString(),
                    version: 1
                },
                generationInfo: content.generationInfo || {}
            };
            
            // URLSearchParams 사용 (FormData 대신)
            const params = new URLSearchParams();
            params.append('siteId', this.siteId);
            params.append('menuId', menuId);
            params.append('submenuId', submenuId);
            params.append('pageData', JSON.stringify(pageData));
            
            // 디버깅: 전송 데이터 확인
            console.log('📤 서버 전송 데이터 (URLSearchParams):', {
                siteId: this.siteId,
                menuId: menuId,
                submenuId: submenuId,
                pageDataSize: JSON.stringify(pageData).length,
                sampleTitle: pageData.title,
                encodedParams: params.toString().substring(0, 200) + '...'
            });
            
            const response = await fetch(`${this.apiBase}/save-page.jsp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: params.toString()
            });
            
            const text = await response.text();
            
            if (response.ok) {
                try {
                    const result = JSON.parse(text);
                    if (result.success) {
                        console.log(`💾 페이지 JSON 저장 완료: ${pageId} -> /data/${this.siteId}/${menuId}/${submenuId}.json`);
                        
                        // 로컬에도 저장 (하이브리드 모드)
                        super.storeGeneratedContent(pageId, content);
                        
                        // 세션 상태 업데이트
                        await this.saveSession(pageId);
                        
                        return result;
                    } else {
                        throw new Error(`서버 오류: ${result.message || result.error || '알 수 없는 오류'}`);
                    }
                } catch (parseError) {
                    console.error('❌ JSON 파싱 실패:', parseError);
                    console.error('서버 응답 텍스트:', text.substring(0, 500));
                    throw new Error(`JSON 파싱 실패: ${text.substring(0, 100)}...`);
                }
            } else {
                // 500 오류 시 JSP 오류 메시지 출력
                console.error('❌ JSP 500 오류 응답:', text.substring(0, 1000));
                throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ 페이지 JSON 저장 실패:', error);
            
            // 폴백: 로컬 저장
            return super.storeGeneratedContent(pageId, content);
        }
    }
    
    /**
     * getGeneratedContent 오버라이드 - 서버 JSON 파일에서 로드
     */
    async getGeneratedContent(pageId) {
        console.log(`📁 서버 JSON 로드 시도: ${pageId}`);
        console.log(`🔗 서버 연결 상태: ${this.serverAvailable}`);
        
        if (!this.serverAvailable) {
            console.log('⚠️ 서버 연결 불가 - 로컬 저장소 사용');
            return super.getGeneratedContent(pageId);
        }
        
        try {
            const [menuId, submenuId] = pageId.split('/');
            
            const params = new URLSearchParams({
                siteId: this.siteId,
                menuId,
                submenuId
            });
            
            const apiUrl = `${this.apiBase}/load-page.jsp?${params}`;
            console.log(`🔗 API 호출: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            console.log(`📡 API 응답 상태: ${response.status}`);
            
            if (response.ok) {
                const text = await response.text();
                console.log(`📡 API 응답 내용 (처음 200자): ${text.substring(0, 200)}...`);
                
                const result = JSON.parse(text);
                console.log(`📊 API 응답 구조:`, {
                    success: result.success,
                    hasData: !!result.data,
                    dataKeys: result.data ? Object.keys(result.data) : null
                });
                
                if (result.success && result.data && result.data.pageData) {
                    console.log(`✅ 서버에서 페이지 데이터 로드 성공: ${pageId}`);
                    console.log(`📊 로드된 데이터:`, {
                        title: result.data.pageData.title,
                        hasContent: !!result.data.pageData.mainContent,
                        hasFeatures: !!result.data.pageData.features,
                        hasHtml: !!result.data.pageData.cmsContentHTML
                    });
                    
                    // ContentStorage 형식으로 변환
                    const content = {
                        content: {
                            title: result.data.pageData.title,
                            subtitle: result.data.pageData.subtitle,
                            mainContent: result.data.pageData.mainContent,
                            features: result.data.pageData.features,
                            htmlContent: result.data.pageData.cmsContentHTML
                        },
                        timestamp: result.data.pageData.metadata?.savedAt || new Date().toISOString(),
                        generationInfo: result.data.pageData.generationInfo || {}
                    };
                    
                    // 로컬 캐시도 업데이트
                    this.generatedContent.set(pageId, content);
                    
                    console.log(`💾 로컬 캐시 업데이트 완료: ${pageId}`);
                    return content;
                } else {
                    console.log(`❌ API 응답에 유효한 데이터 없음:`, {
                        success: result.success,
                        message: result.message,
                        hasData: !!result.data,
                        hasPageData: !!(result.data && result.data.pageData)
                    });
                }
            } else {
                console.log(`❌ API 호출 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ 서버 JSON 로드 중 오류:', error);
        }
        
        // 폴백: 로컬에서 로드
        console.log('🔄 로컬 저장소 폴백 사용');
        return super.getGeneratedContent(pageId);
    }
    
    /**
     * 콘텐츠 재생성
     */
    async regenerateContent(pageId) {
        console.log(`🔄 콘텐츠 재생성 시작: ${pageId}`);
        
        try {
            // 기존 콘텐츠 백업
            const existingContent = await this.getGeneratedContent(pageId);
            
            // AI 재생성 트리거 (메인 앱과 연동)
            if (window.app && window.app.aiSimulator) {
                const [menuId, submenuId] = pageId.split('/');
                const menu = { id: menuId };
                const submenu = { id: submenuId };
                
                await window.app.aiSimulator.generateContent({ menu, submenu });
                
                console.log(`✅ 콘텐츠 재생성 완료: ${pageId}`);
                return true;
            }
            
        } catch (error) {
            console.error('❌ 콘텐츠 재생성 실패:', error);
            return false;
        }
    }
    
    /**
     * 페이지 HTML 생성 (템플릿 사용)
     * @override
     */
    async generatePageHTML(menuId, submenuId, submenu) {
        const pageId = `${menuId}/${submenuId}`;
        console.log(`🔄 템플릿 기반 페이지 HTML 생성: ${pageId}`);
        
        // 템플릿이 없으면 부모 클래스의 기본 방식 사용
        if (!this.templateHTML) {
            console.warn('⚠️ 템플릿이 로드되지 않음, 기본 방식 사용');
            return super.generatePageHTML(menuId, submenuId, submenu);
        }
        
        // 페이지별 CMS 콘텐츠 조회
        const pageContent = this.pageContents.get(pageId);
        const storedContent = await this.getGeneratedContent(pageId);
        
        let cmsContent;
        let pageTitle = submenu.koreanTitle || submenu.title;
        let pageSubtitle = '학과 소개 페이지입니다';
        
        if (pageContent) {
            cmsContent = pageContent.content;
            pageTitle = pageContent.title;
            pageSubtitle = pageContent.subtitle || pageSubtitle;
        } else if (storedContent) {
            // JSON 파일에서 로드한 데이터 사용
            if (storedContent.cmsContentHTML) {
                // 서버에서 가져온 생성된 HTML 콘텐츠
                cmsContent = storedContent.cmsContentHTML;
                pageTitle = storedContent.title || pageTitle;
                pageSubtitle = storedContent.subtitle || pageSubtitle;
                console.log('✅ 서버에서 저장된 콘텐츠 사용:', pageId);
            } else if (storedContent.content && storedContent.content.htmlContent) {
                // 구버전 호환성 (이전 구조)
                cmsContent = storedContent.content.htmlContent;
                pageTitle = storedContent.content.title || pageTitle;
                pageSubtitle = storedContent.content.subtitle || pageSubtitle;
                console.log('✅ 이전 형식의 저장된 콘텐츠 사용:', pageId);
            } else {
                cmsContent = this.generateDefaultCMSContent();
                console.log('⚠️ 콘텐츠 없음, 기본값 사용:', pageId);
            }
        } else {
            cmsContent = this.generateDefaultCMSContent();
            console.log('⚠️ 저장된 콘텐츠 없음:', pageId);
        }
        
        // 템플릿 복사 (원본 보존)
        let html = this.templateHTML;
        
        // 템플릿 변수 치환
        html = html.replace(/\{\{PAGE_TITLE\}\}/g, pageTitle);
        html = html.replace(/\{\{SITE_NAME\}\}/g, this.siteInfo.siteName);
        html = html.replace(/\{\{PAGE_SUBTITLE\}\}/g, pageSubtitle);
        html = html.replace(/\{\{BREADCRUMB_SECTION\}\}/g, this.getSectionTitle(menuId));
        html = html.replace(/\{\{BREADCRUMB_PAGE\}\}/g, pageTitle);
        
        // 메뉴 네비게이션 생성
        const menuNav = this.generateMenuNavigation(menuId);
        html = html.replace(/\{\{MENU_NAVIGATION\}\}/g, menuNav);
        
        // CMS 콘텐츠 영역 교체 (중첩된 div 포함 처리)
        // cms-content div와 그 안의 모든 내용을 교체
        const cmsContentRegex = /<div[^>]*id="cms-content"[^>]*>[\s\S]*?<\/div>[\s]*<\/div>/;
        const replacement = `<div class="content cms-print" id="cms-content">${cmsContent}</div>`;
        
        // 먼저 정규식으로 교체 시도
        if (cmsContentRegex.test(html)) {
            html = html.replace(cmsContentRegex, replacement);
            console.log('✅ 정규식으로 CMS 콘텐츠 교체 성공');
        } else {
            // 정규식 매칭 실패 시 더 간단한 방법 사용
            const startTag = '<div class="content cms-print" id="cms-content">';
            const endTag = '</div>';
            const startIndex = html.indexOf(startTag);
            
            if (startIndex !== -1) {
                // 중첩된 div를 고려하여 올바른 종료 태그 찾기
                let depth = 1;
                let endIndex = startIndex + startTag.length;
                
                while (depth > 0 && endIndex < html.length) {
                    const nextDiv = html.indexOf('<div', endIndex);
                    const nextEnd = html.indexOf('</div>', endIndex);
                    
                    if (nextEnd === -1) break;
                    
                    if (nextDiv !== -1 && nextDiv < nextEnd) {
                        depth++;
                        endIndex = nextDiv + 4;
                    } else {
                        depth--;
                        endIndex = nextEnd + 6;
                    }
                }
                
                if (depth === 0) {
                    const before = html.substring(0, startIndex);
                    const after = html.substring(endIndex);
                    html = before + replacement + after;
                    console.log('✅ 문자열 처리로 CMS 콘텐츠 교체 성공');
                } else {
                    console.warn('⚠️ CMS 콘텐츠 영역 교체 실패');
                }
            }
        }
        
        return html;
    }
    
    /**
     * 메뉴 네비게이션 HTML 생성
     */
    generateMenuNavigation(activeMenuId) {
        const menus = [
            { id: 'about', title: '학과소개' },
            { id: 'research', title: '학사정보' },
            { id: 'services', title: '입학정보' },
            { id: 'team', title: '학생활동' },
            { id: 'portfolio', title: '자료실' },
            { id: 'news', title: '커뮤니티' }
        ];
        
        return menus.map(menu => 
            `<li><a href="/${menu.id}" class="${menu.id === activeMenuId ? 'active' : ''}">${menu.title}</a></li>`
        ).join('\n');
    }
    
    /**
     * 디버깅 정보 출력
     */
    debug() {
        console.group('🐛 JSP Content Storage Debug');
        console.log('Status:', this.getStatus());
        console.log('Site ID:', this.siteId);
        console.log('Template ID:', this.templateId);
        console.log('Site Info:', this.siteInfo);
        console.log('Generated Content:', Array.from(this.generatedContent.keys()));
        console.log('Server Available:', this.serverAvailable);
        console.log('Session State:', this.sessionState);
        console.log('Sync Queue:', this.syncQueue);
        console.log('Auto Save Active:', !!this.autoSaveInterval);
        console.log('Template Loaded:', !!this.templateHTML);
        console.groupEnd();
    }
}

// 전역 JSP 콘텐츠 저장소 초기화 및 기본 저장소로 설정
if (typeof window !== 'undefined') {
    console.log('🚀 JSP Content Storage 전역 초기화 - 기본 저장소로 설정');
    window.jspContentStorage = new JSPContentStorage();
    
    // JSPContentStorage를 기본 ContentStorage로 설정
    window.contentStorage = window.jspContentStorage;
    
    console.log('✅ JSPContentStorage가 기본 저장소로 설정되었습니다');
}