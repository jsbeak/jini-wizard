// JSP Content Storage - 하이브리드 콘텐츠 저장소
// 기존 ContentStorage를 확장하여 JSP API와 연동

class JSPContentStorage extends ContentStorage {
    constructor() {
        super();
        this.apiBase = 'api';
        this.enableHybridMode = true; // 로컬 + 서버 동시 저장
        this.enableOfflineMode = true; // 서버 장애 시 로컬 저장소 활용
        this.syncQueue = []; // 동기화 대기 큐
        this.serverAvailable = null; // 서버 상태 캐시
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1초
        
        console.log('🚀 JSP Content Storage 초기화');
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
            // 로컬 저장소와 서버 동기화
            await this.syncLocalToServer();
        } else {
            console.warn('⚠️ JSP 서버 연결 실패, 오프라인 모드로 작동');
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
            siteId: this.siteInfo.siteId || 'ewha-university',
            menuId: menuId,
            submenuId: submenuId,
            format: 'json',
            includeHtml: 'false' // 메타데이터만 조회
        });
        
        try {
            const response = await fetch(`${this.apiBase}/load-content.jsp?${params}`);
            
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
            
            if (!result.success || !result.data.page) {
                return null;
            }
            
            return result.data.page.metadata;
            
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
     * 디버깅 정보 출력
     */
    debug() {
        console.group('🐛 JSP Content Storage Debug');
        console.log('Status:', this.getStatus());
        console.log('Site Info:', this.siteInfo);
        console.log('Generated Content:', Array.from(this.generatedContent.keys()));
        console.log('Sync Queue:', this.syncQueue);
        console.groupEnd();
    }
}

// 전역 JSP 콘텐츠 저장소 초기화
if (typeof window !== 'undefined') {
    console.log('🚀 JSP Content Storage 전역 초기화');
    window.jspContentStorage = new JSPContentStorage();
}