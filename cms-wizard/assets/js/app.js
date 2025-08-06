// Main Application Controller
class CMSWizardApp {
    constructor() {
        this.siteId = this.getSiteIdFromParams();
        this.cms = null;
        this.menuData = null;
        this.currentMenu = null;
        this.currentSubmenu = null;
        this.totalPages = 0;
        this.completedPages = 0;
        this.startTime = Date.now();
        this.isProcessing = false;
        this.timer = null;
        this.isReviewMode = false; // 리뷰 모드 상태 추가
        this.isCompleted = false; // 생성 완료 상태 추가
        
        // Initialize JSP ContentStorage (하이브리드 모드)
        if (window.jspContentStorage) {
            window.contentStorage = window.jspContentStorage;
            console.log('✅ JSP ContentStorage 사용 (하이브리드 모드)');
        } else {
            window.contentStorage = new ContentStorage();
            console.log('⚠️ 기본 ContentStorage 사용 (로컬 모드)');
        }
        this.cmsMode = 'unknown'; // 'cms', 'fallback', 'error'
        this.eventListeners = new Map(); // Track event listeners for cleanup
        this.isDestroyed = false;
        
        // Bind methods to preserve context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        
        // Add page lifecycle listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        
        this.init();
    }
    
    /**
     * URL 파라미터에서 siteId 추출
     */
    getSiteIdFromParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const siteId = urlParams.get('siteId') || urlParams.get('site') || 'default-site';
        console.log('🎯 Site ID 감지:', siteId);
        return siteId;
    }
    
    async init() {
        if (window.performanceUtils) {
            window.performanceUtils.startPerformanceTimer('app-initialization');
            window.performanceUtils.logMemoryUsage('App Init Start');
        }
        
        try {
            console.log('🚀 CMS AI 마법사 초기화 시작...');
            
            // Initialize CMS integration
            if (window.performanceUtils) {
                window.performanceUtils.startPerformanceTimer('cms-initialization');
            }
            await this.initializeCMS();
            if (window.performanceUtils) {
                window.performanceUtils.endPerformanceTimer('cms-initialization');
            }
            
            // Load menu data (CMS or fallback)
            if (window.performanceUtils) {
                window.performanceUtils.startPerformanceTimer('menu-data-loading');
            }
            await this.loadMenuData();
            if (window.performanceUtils) {
                window.performanceUtils.endPerformanceTimer('menu-data-loading');
            }
            
            // Initialize components
            this.menuManager = new MenuManager(this.menuData, this);
            this.previewManager = new PreviewManager(this);
            window.previewManager = this.previewManager; // 전역 접근을 위한 등록
            this.animator = new Animator();
            this.aiSimulator = new AISimulator(this);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Show CMS connection status
            this.showCMSStatus();
            
            // Start intro sequence
            this.startIntroSequence();
            
            if (window.performanceUtils) {
                window.performanceUtils.endPerformanceTimer('app-initialization');
                window.performanceUtils.logMemoryUsage('App Init Complete');
            }
            
        } catch (error) {
            console.error('❌ 앱 초기화 실패:', error);
            this.handleError(error, 'App Initialization');
        }
    }
    
    /**
     * CMS 연동 초기화
     */
    async initializeCMS() {
        try {
            console.log('🔗 CMS 연동 초기화 중...', this.siteId);
            
            // CMS Integration 인스턴스 생성
            this.cms = new CMSIntegration(this.siteId);
            
            // CMS 연결 시도
            const initResult = await this.cms.initialize();
            
            this.cmsMode = initResult.mode;
            
            if (initResult.success) {
                console.log('✅ CMS 연동 성공');
            } else {
                console.warn('⚠️ CMS 연동 실패, 폴백 모드로 실행:', initResult.error);
            }
            
            return initResult;
            
        } catch (error) {
            console.error('❌ CMS 초기화 오류:', error);
            this.cmsMode = 'error';
            
            // 에러 발생 시에도 폴백 모드로 계속 진행
            this.cms = new CMSIntegration(this.siteId);
            this.cms.fallbackMode = true;
            
            return { success: false, mode: 'error', error: error.message };
        }
    }
    
    async loadMenuData() {
        try {
            console.log('📋 메뉴 데이터 로드 중...');
            
            // CMS에서 메뉴 구조 로드 시도
            if (this.cms) {
                this.menuData = await this.cms.loadMenuStructure();
                console.log('✅ CMS 메뉴 데이터 로드 완료:', this.menuData.menus.length, '개 메뉴');
            } else {
                // 폴백: 정적 파일에서 로드
                console.log('📋 정적 메뉴 파일에서 로드 중...');
                const response = await fetch('assets/data/menu-data.json');
                this.menuData = await response.json();
                console.log('✅ 정적 메뉴 데이터 로드 완료');
            }
            
            // Calculate total pages
            this.totalPages = this.menuData.menus.reduce((total, menu) => {
                return total + menu.submenus.length;
            }, 0);
            
            console.log('📊 총 페이지 수:', this.totalPages);
            
        } catch (error) {
            console.error('❌ 메뉴 데이터 로드 실패:', error);
            throw new Error('Failed to load menu data');
        }
    }
    
    setupEventListeners() {
        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleZoomChange(e.target.dataset.zoom);
            });
        });
        
        // Footer buttons with null checks
        const pauseBtn = document.getElementById('btn-pause');
        const skipBtn = document.getElementById('btn-skip');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipCurrentPage());
        }
        
        // Header buttons with null checks
        const helpBtn = document.getElementById('btn-help');
        const settingsBtn = document.getElementById('btn-settings');
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // Add click feedback to all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!btn.disabled) {
                    this.createRippleEffect(e, btn);
                    btn.classList.add('animate-buttonPress');
                    setTimeout(() => btn.classList.remove('animate-buttonPress'), 200);
                }
            });
        });
        
        // Add hover effects to interactive elements
        this.addHoverEffects();
        
        // Add focus management for accessibility
        this.setupFocusManagement();
    }
    
    startIntroSequence() {
        const introScreen = document.getElementById('intro-screen');
        const mainInterface = document.getElementById('main-interface');
        
        if (!introScreen || !mainInterface) {
            console.error('Intro sequence elements not found');
            return;
        }
        
        // Show intro with improved timing
        introScreen.classList.add('active');
        
        // Add skip functionality for power users
        const skipHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.type === 'click') {
                e.preventDefault();
                this.skipIntro(introScreen, mainInterface);
                document.removeEventListener('keydown', skipHandler);
                introScreen.removeEventListener('click', skipHandler);
            }
        };
        
        document.addEventListener('keydown', skipHandler);
        introScreen.addEventListener('click', skipHandler);
        
        // Add skip hint
        const skipHint = document.createElement('div');
        skipHint.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #6B7280;
            font-size: 12px;
            opacity: 0;
            animation: fadeIn 0.5s ease 2s forwards;
        `;
        skipHint.textContent = 'Press Enter or click to skip';
        introScreen.appendChild(skipHint);
        
        // Auto-transition with improved timing (reduced from 3s to 2.5s)
        const autoTransition = setTimeout(() => {
            if (!this.isDestroyed) {
                this.skipIntro(introScreen, mainInterface);
            }
            document.removeEventListener('keydown', skipHandler);
            introScreen.removeEventListener('click', skipHandler);
        }, 2500);
        
        // Store timeout for cleanup
        this.introTimeout = autoTransition;
    }
    
    skipIntro(introScreen, mainInterface) {
        if (this.introTimeout) {
            clearTimeout(this.introTimeout);
            this.introTimeout = null;
        }
        
        introScreen.classList.remove('active');
        setTimeout(() => {
            if (!this.isDestroyed) {
                mainInterface.classList.add('active');
                this.startWizard();
            }
        }, 300); // Reduced transition time
    }
    
    startWizard() {
        // Initialize menu
        this.menuManager.renderMenu();
        
        // Start timer
        this.startTimer();
        
        // Start processing first page
        this.processNextPage();
        
        // Enable controls
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-skip').disabled = false;
    }
    
    startTimer() {
        // Clear existing timer if any
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timerEl = document.getElementById('timer');
            
            if (timerEl) {
                timerEl.textContent = `경과 시간: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    async processNextPage() {
        if (this.isProcessing) return;
        
        // Find next page to process
        const nextPage = this.findNextPage();
        if (!nextPage) {
            this.completeWizard();
            return;
        }
        
        this.isProcessing = true;
        
        // Update current page
        this.currentMenu = nextPage.menu;
        this.currentSubmenu = nextPage.submenu;
        
        // Update UI
        this.menuManager.setPageStatus(nextPage.menu.id, nextPage.submenu.id, 'processing');
        this.updateStatusMessage('processing');
        
        // Load page in preview
        await this.previewManager.loadPage(nextPage.submenu.url);
        
        // Simulate AI content generation
        await this.aiSimulator.generateContent(nextPage);
        
        // 콘텐츠 저장 확인
        const pageId = `${nextPage.menu.id}/${nextPage.submenu.id}`;
        if (window.contentStorage) {
            const savedContent = window.contentStorage.getGeneratedContent(pageId);
            console.log(`📊 페이지 생성 완료 [${pageId}]:`, savedContent ? '✅ 저장됨' : '❌ 저장 실패');
        }
        
        // Mark as completed
        this.menuManager.setPageStatus(nextPage.menu.id, nextPage.submenu.id, 'completed');
        this.completedPages++;
        this.updateProgress();
        
        // 생성 완료 시 리뷰 모드 활성화
        if (this.completedPages >= this.totalPages) {
            this.isCompleted = true;
            this.isReviewMode = true;
            console.log('✅ 모든 페이지 생성 완료 - 리뷰 모드 활성화');
        }
        
        // Clean up any lingering pulse animations
        this.menuManager.cleanupPulseAnimations();
        
        this.isProcessing = false;
        
        // Process next page after a short delay
        setTimeout(() => {
            this.processNextPage();
        }, 1000);
    }
    
    findNextPage() {
        for (const menu of this.menuData.menus) {
            for (const submenu of menu.submenus) {
                if (submenu.status === 'waiting') {
                    return { menu, submenu };
                }
            }
        }
        return null;
    }
    
    updateProgress() {
        const percentage = Math.round((this.completedPages / this.totalPages) * 100);
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentage = document.querySelector('.progress-percentage');
        const progressCount = document.querySelector('.progress-count');
        
        // Use performance utils for smooth animations
        if (window.performanceUtils) {
            window.performanceUtils.batchDOMOperations([
                () => {
                    // Animate progress bar
                    if (progressFill) {
                        progressFill.style.transition = 'width 0.5s ease';
                        progressFill.style.width = `${percentage}%`;
                        this.animateProgressUpdate();
                    }
                },
                () => {
                    // Animate percentage update
                    if (progressPercentage) {
                        progressPercentage.classList.add('animate-success-burst');
                        progressPercentage.textContent = `${percentage}%`;
                        setTimeout(() => {
                            if (!this.isDestroyed) {
                                progressPercentage.classList.remove('animate-success-burst');
                            }
                        }, 600);
                    }
                },
                () => {
                    // Update count with animation
                    if (progressCount) {
                        progressCount.style.transform = 'scale(1.05)';
                        progressCount.style.transition = 'transform 0.2s ease';
                        progressCount.textContent = `${this.completedPages} / ${this.totalPages} 페이지`;
                        
                        setTimeout(() => {
                            if (!this.isDestroyed && progressCount) {
                                progressCount.style.transform = 'scale(1)';
                            }
                        }, 200);
                    }
                }
            ]);
        } else {
            // Fallback for browsers without performance utils
            if (progressFill) {
                progressFill.style.transition = 'width 0.5s ease';
                progressFill.style.width = `${percentage}%`;
                this.animateProgressUpdate();
            }
            
            if (progressPercentage) {
                progressPercentage.textContent = `${percentage}%`;
            }
            
            if (progressCount) {
                progressCount.textContent = `${this.completedPages} / ${this.totalPages} 페이지`;
            }
        }
        
        // Show toast notification for milestones
        if (percentage === 25 || percentage === 50 || percentage === 75) {
            this.showToast(`진행률 ${percentage}% 달성!`, 'success');
        }
        
        // Log memory usage at milestones
        if (window.performanceUtils && (percentage === 25 || percentage === 50 || percentage === 75 || percentage === 100)) {
            window.performanceUtils.logMemoryUsage(`Progress ${percentage}%`);
        }
    }
    
    updateStatusMessage(status) {
        const statusMessage = document.getElementById('status-message');
        const loadingMessage = document.getElementById('loading-message');
        const loadingTitle = document.getElementById('loading-title');
        const loadingSubtitle = document.getElementById('loading-subtitle');
        
        if (status === 'processing' && this.currentMenu && this.currentSubmenu) {
            // Hide status message and show loading message
            statusMessage.style.display = 'none';
            loadingMessage.style.display = 'block';
            
            // Update loading title with current page
            loadingTitle.textContent = `${this.currentSubmenu.title} 페이지를 생성합니다`;
            
            // Get random status message
            const messages = this.menuData.statusMessages[this.currentMenu.id];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            loadingSubtitle.textContent = randomMessage;
        } else if (status === 'completed') {
            // Show status message and hide loading message
            statusMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            statusMessage.textContent = '완료!';
        } else if (status === 'paused') {
            // Show status message and hide loading message
            statusMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            statusMessage.textContent = '일시정지됨';
        } else {
            // Show status message and hide loading message
            statusMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            statusMessage.textContent = '준비 중...';
        }
    }
    
    handleZoomChange(zoom) {
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Use the passed zoom parameter to find the correct button
        const targetBtn = document.querySelector(`[data-zoom="${zoom}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        if (this.previewManager && this.previewManager.setZoom) {
            this.previewManager.setZoom(zoom);
        }
    }
    
    togglePause() {
        const pauseBtn = document.getElementById('btn-pause');
        
        if (!pauseBtn) return;
        
        if (this.isProcessing) {
            this.isProcessing = false;
            pauseBtn.textContent = '계속';
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.updateStatusMessage('paused');
        } else {
            this.isProcessing = true;
            pauseBtn.textContent = '일시정지';
            this.startTimer();
            this.processNextPage();
        }
    }
    
    skipCurrentPage() {
        if (this.currentMenu && this.currentSubmenu) {
            // Mark current page as completed
            this.menuManager.setPageStatus(this.currentMenu.id, this.currentSubmenu.id, 'completed');
            this.completedPages++;
            this.updateProgress();
            
            // Force process next page
            this.isProcessing = false;
            this.processNextPage();
        }
    }
    
    completeWizard() {
        // 이미 완료된 경우 중복 실행 방지
        if (this.isCompleted) {
            console.log('⚠️ 이미 생성이 완료되었습니다.');
            return;
        }
        
        this.isCompleted = true; // 완료 상태 설정
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Disable controls with null checks
        const pauseBtn = document.getElementById('btn-pause');
        const skipBtn = document.getElementById('btn-skip');
        
        if (pauseBtn) pauseBtn.disabled = true;
        if (skipBtn) skipBtn.disabled = true;
        
        // Calculate completion time
        const totalTime = Date.now() - this.startTime;
        const avgTime = Math.round(totalTime / this.totalPages / 1000);
        
        // Show completion screen only if not in review mode
        if (!this.isReviewMode) {
            this.showCompletionScreen(totalTime, avgTime);
            
            // Create confetti effect
            this.createConfetti();
            
            // Show completion toast
            this.showToast('모든 페이지 생성이 완료되었습니다!', 'success', 5000);
        }
    }
    
    showCompletionScreen(totalTime, avgTime) {
        const completionScreen = document.getElementById('completion-screen');
        if (!completionScreen) {
            console.error('Completion screen not found');
            return;
        }
        
        // Update completion stats with null checks
        const minutes = Math.floor(totalTime / 60000);
        const seconds = Math.floor((totalTime % 60000) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const completedCountEl = document.getElementById('completed-count');
        const totalTimeEl = document.getElementById('total-time');
        const contentCountEl = document.getElementById('content-count');
        const avgTimeEl = document.getElementById('avg-time');
        
        if (completedCountEl) completedCountEl.textContent = this.totalPages;
        if (totalTimeEl) totalTimeEl.textContent = timeString;
        if (contentCountEl) contentCountEl.textContent = `${this.totalPages} 페이지`;
        if (avgTimeEl) avgTimeEl.textContent = `${avgTime}초`;
        
        // Setup button event listeners with null checks
        const viewSiteBtn = document.getElementById('btn-view-site');
        const restartBtn = document.getElementById('btn-restart');
        
        if (viewSiteBtn) {
            // Remove existing listeners
            const newViewSiteBtn = viewSiteBtn.cloneNode(true);
            viewSiteBtn.parentNode.replaceChild(newViewSiteBtn, viewSiteBtn);
            
            newViewSiteBtn.addEventListener('click', () => {
                this.enterReviewMode();
            });
        }
        
        if (restartBtn) {
            // Remove existing listeners
            const newRestartBtn = restartBtn.cloneNode(true);
            restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
            
            newRestartBtn.addEventListener('click', () => {
                location.reload();
            });
        }
        
        // Add close button functionality
        const closeBtn = document.getElementById('completion-close-btn');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', () => {
                this.enterReviewMode();
            });
        }
        
        // Show completion screen with animation
        setTimeout(() => {
            completionScreen.classList.add('active');
        }, 500);
    }
    
    createConfetti() {
        const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                
                // Add rotation for more dynamic effect
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.remove();
                    }
                }, 5000);
            }, i * 20);
        }
    }
    
    showHelp() {
        this.showHelpModal();
    }
    
    showHelpModal() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal-overlay';
        helpModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-icon" style="background-color: rgba(99, 102, 241, 0.1); color: var(--primary-blue);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9,9h6v6"></path>
                        <path d="m9,12 3-3 3,3"></path>
                    </svg>
                </div>
                <h2 class="modal-title">CMS 사이트 마법사 도움말</h2>
                <div class="modal-message" style="text-align: left; line-height: 1.6;">
                    <h3 style="margin-top: 0; color: var(--primary-blue);">🤖 AI 자동 생성</h3>
                    <p>AI가 자동으로 24개 페이지의 컨텐츠를 생성합니다.</p>
                    
                    <h3 style="color: var(--primary-blue);">⏸️ 제어 기능</h3>
                    <ul>
                        <li><strong>일시정지</strong>: 언제든 작업을 일시정지할 수 있습니다</li>
                        <li><strong>건너뛰기</strong>: 현재 페이지를 건너뛰고 다음으로 이동</li>
                        <li><strong>재시도</strong>: 오류 발생 시 재시도 가능</li>
                    </ul>
                    
                    <h3 style="color: var(--primary-blue);">⌨️ 키보드 단축키</h3>
                    <ul>
                        <li><kbd>Space</kbd> 또는 <kbd>Enter</kbd>: 일시정지/계속</li>
                        <li><kbd>Escape</kbd>: 모달 닫기</li>
                        <li><kbd>Tab</kbd>: 요소 간 이동</li>
                    </ul>
                    
                    <h3 style="color: var(--primary-blue);">📊 진행 상황</h3>
                    <p>좌측 메뉴에서 실시간으로 진행 상황을 확인할 수 있습니다.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary btn-close-help">이해했습니다</button>
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeBtn = helpModal.querySelector('.btn-close-help');
        const closeHandler = () => {
            helpModal.classList.remove('active');
            setTimeout(() => {
                if (helpModal.parentNode) {
                    helpModal.remove();
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeHandler);
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHandler();
        });
        
        document.body.appendChild(helpModal);
        
        // Show with animation
        setTimeout(() => {
            helpModal.classList.add('active');
        }, 10);
    }
    
    showSettings() {
        this.showSettingsModal();
    }
    
    showSettingsModal() {
        const settingsModal = document.createElement('div');
        settingsModal.className = 'modal-overlay';
        settingsModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-icon" style="background-color: rgba(107, 114, 128, 0.1); color: var(--text-secondary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m11-7a4 4 0 0 0-8 0m8 0a4 4 0 1 0-8 0"></path>
                    </svg>
                </div>
                <h2 class="modal-title">설정</h2>
                <div class="modal-message" style="text-align: left;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <input type="checkbox" id="setting-sounds" checked>
                            <span>사운드 효과 사용</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <input type="checkbox" id="setting-animations" checked>
                            <span>애니메이션 사용</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <input type="checkbox" id="setting-notifications" checked>
                            <span>알림 표시</span>
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px;">생성 속도:</label>
                        <input type="range" id="setting-speed" min="1" max="5" value="3" style="width: 100%;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                            <span>느림</span>
                            <span>보통</span>
                            <span>빠름</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        <p>설정은 이 세션에서만 적용됩니다.</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary btn-cancel-settings">취소</button>
                    <button class="btn-primary btn-save-settings">저장</button>
                </div>
            </div>
        `;
        
        // Add functionality
        const saveBtn = settingsModal.querySelector('.btn-save-settings');
        const cancelBtn = settingsModal.querySelector('.btn-cancel-settings');
        
        const closeHandler = () => {
            settingsModal.classList.remove('active');
            setTimeout(() => {
                if (settingsModal.parentNode) {
                    settingsModal.remove();
                }
            }, 300);
        };
        
        saveBtn.addEventListener('click', () => {
            // Apply settings
            const settings = {
                sounds: settingsModal.querySelector('#setting-sounds').checked,
                animations: settingsModal.querySelector('#setting-animations').checked,
                notifications: settingsModal.querySelector('#setting-notifications').checked,
                speed: parseInt(settingsModal.querySelector('#setting-speed').value)
            };
            
            this.applySettings(settings);
            this.showToast('설정이 저장되었습니다', 'success');
            closeHandler();
        });
        
        cancelBtn.addEventListener('click', closeHandler);
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeHandler();
        });
        
        document.body.appendChild(settingsModal);
        
        // Show with animation
        setTimeout(() => {
            settingsModal.classList.add('active');
        }, 10);
    }
    
    applySettings(settings) {
        // Store settings for session
        this.settings = settings;
        
        // Apply animation settings
        if (!settings.animations) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
        
        // Apply speed settings to AI simulator
        if (this.aiSimulator) {
            const speedMultiplier = settings.speed / 3; // Normalize to 1
            this.aiSimulator.generationDelay = {
                min: Math.max(500, 1000 / speedMultiplier),
                max: Math.max(1500, 3000 / speedMultiplier)
            };
        }
        
        console.log('설정 적용:', settings);
    }
    
    // Review mode - 완료 후 페이지 검토 모드
    enterReviewMode() {
        console.log('📋 검토 모드 진입');
        
        // 리뷰 모드 상태 설정
        this.isReviewMode = true;
        
        // Hide completion screen
        const completionScreen = document.getElementById('completion-screen');
        if (completionScreen) {
            completionScreen.classList.remove('active');
        }
        
        // Enable menu interactions
        this.enableReviewMode = true;
        
        // Update footer to show review mode
        this.updateFooterForReview();
        
        // Show review instructions
        this.showToast('클릭하여 생성된 페이지를 확인하세요', 'info', 5000);
        
        // Update status message
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #059669;">
                    <span style="font-size: 14px;">✅ 모든 페이지 생성 완료</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    메뉴를 클릭하여 생성된 페이지를 확인하세요
                </div>
            `;
        }
        
        // Enable menu clicking
        this.menuManager.enableReviewMode();
    }
    
    updateFooterForReview() {
        const footerActions = document.querySelector('.footer-actions');
        const footerInfo = document.querySelector('.footer-info');
        
        if (footerActions) {
            footerActions.innerHTML = `
                <button class="btn-secondary" id="btn-export">내보내기</button>
                <button class="btn-primary" id="btn-finish">완료</button>
            `;
            
            // Add event listeners for new buttons
            const exportBtn = document.getElementById('btn-export');
            const finishBtn = document.getElementById('btn-finish');
            
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportResults();
                });
            }
            
            if (finishBtn) {
                finishBtn.addEventListener('click', () => {
                    this.finishReview();
                });
            }
        }
        
        if (footerInfo) {
            const totalTime = Date.now() - this.startTime;
            const minutes = Math.floor(totalTime / 60000);
            const seconds = Math.floor((totalTime % 60000) / 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            footerInfo.innerHTML = `
                <span>총 소요 시간: ${timeString} | 생성된 페이지: ${this.totalPages}개</span>
            `;
        }
    }
    
    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            totalPages: this.totalPages,
            completedPages: this.completedPages,
            totalTime: Date.now() - this.startTime,
            siteId: this.siteId,
            cmsMode: this.cmsMode,
            pages: []
        };
        
        // Collect page data
        this.menuData.menus.forEach(menu => {
            menu.submenus.forEach(submenu => {
                if (submenu.status === 'completed') {
                    results.pages.push({
                        menuId: menu.id,
                        menuTitle: menu.koreanTitle || menu.title,
                        submenuId: submenu.id,
                        submenuTitle: submenu.koreanTitle || submenu.title,
                        url: submenu.url,
                        status: submenu.status
                    });
                }
            });
        });
        
        // Create download
        const blob = new Blob([JSON.stringify(results, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cms-generation-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('결과가 내보내졌습니다', 'success');
    }
    
    finishReview() {
        const confirmFinish = confirm('검토를 완료하고 종료하시겠습니까?');
        if (confirmFinish) {
            this.showToast('감사합니다! 페이지가 성공적으로 생성되었습니다.', 'success', 3000);
            
            setTimeout(() => {
                // Could redirect to final page or close window
                window.close() || (window.location.href = 'about:blank');
            }, 3000);
        }
    }
    
    showError(message) {
        console.error(message);
        this.showErrorModal(message);
    }
    
    showErrorModal(message = '페이지 생성이 예상보다 오래 걸리고 있습니다.') {
        const errorModal = document.getElementById('error-modal');
        
        // Update modal message
        const modalMessage = errorModal.querySelector('.modal-message');
        modalMessage.textContent = message;
        
        // Setup button event listeners
        const retryBtn = document.getElementById('btn-retry');
        const skipBtn = document.getElementById('btn-skip-page');
        const cancelBtn = document.getElementById('btn-cancel');
        
        // Remove existing event listeners
        const newRetryBtn = retryBtn.cloneNode(true);
        const newSkipBtn = skipBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        
        retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new event listeners
        newRetryBtn.addEventListener('click', () => {
            this.hideErrorModal();
            this.retryCurrentPage();
        });
        
        newSkipBtn.addEventListener('click', () => {
            this.hideErrorModal();
            this.skipCurrentPage();
        });
        
        newCancelBtn.addEventListener('click', () => {
            this.hideErrorModal();
            this.pauseWizard();
        });
        
        // Show modal with animation
        errorModal.classList.add('active');
    }
    
    hideErrorModal() {
        const errorModal = document.getElementById('error-modal');
        errorModal.classList.remove('active');
    }
    
    retryCurrentPage() {
        if (this.currentMenu && this.currentSubmenu) {
            // Reset current page status
            this.menuManager.setPageStatus(this.currentMenu.id, this.currentSubmenu.id, 'waiting');
            
            // Force retry
            this.isProcessing = false;
            this.processNextPage();
        }
    }
    
    pauseWizard() {
        this.isProcessing = false;
        const pauseBtn = document.getElementById('btn-pause');
        pauseBtn.textContent = '계속';
        clearInterval(this.timer);
        
        this.updateStatusMessage('paused');
    }
    
    /**
     * CMS 연결 상태 표시
     */
    showCMSStatus() {
        const statusMessage = document.getElementById('status-message');
        if (!statusMessage) return;
        
        let statusHTML = '';
        
        switch (this.cmsMode) {
            case 'cms':
                statusHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #10B981; font-size: 14px;">🔗 CMS 연결됨</span>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                        Site ID: ${this.siteId}
                    </div>
                `;
                break;
                
            case 'fallback':
                statusHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #F59E0B; font-size: 14px;">⚠️ 시뮬레이션 모드</span>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                        CMS 서버에 연결할 수 없어 데모 모드로 실행됩니다.
                    </div>
                `;
                break;
                
            case 'error':
                statusHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #EF4444; font-size: 14px;">❌ 연결 오류</span>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                        기본 모드로 실행됩니다.
                    </div>
                `;
                break;
                
            default:
                statusHTML = `
                    <div style="font-size: 14px; color: #6B7280;">
                        시스템 준비 중...
                    </div>
                `;
        }
        
        statusMessage.innerHTML = statusHTML;
        
        // 3초 후 원래 상태 메시지로 복구
        setTimeout(() => {
            if (statusMessage.innerHTML === statusHTML) {
                statusMessage.innerHTML = '준비 중...';
            }
        }, 3000);
    }
    
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // Ensure element has relative positioning for ripple
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }
    
    addHoverEffects() {
        // Menu items hover effects
        document.querySelectorAll('.menu-header, .submenu-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('processing') && !item.dataset.hoverDisabled) {
                    item.style.transform = 'translateX(4px)';
                    item.style.transition = 'transform 0.2s ease';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.dataset.hoverDisabled) {
                    item.style.transform = 'translateX(0)';
                }
            });
        });
        
        // Zoom controls hover effects
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (!btn.classList.contains('active') && !btn.disabled) {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.transition = 'transform 0.2s ease';
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                if (!btn.classList.contains('active') && !btn.disabled) {
                    btn.style.transform = 'scale(1)';
                }
            });
        });
        
        // Browser controls hover effects
        document.querySelectorAll('.browser-action').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (!btn.disabled) {
                    btn.style.transform = 'scale(1.1)';
                    btn.style.transition = 'transform 0.2s ease';
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                if (!btn.disabled) {
                    btn.style.transform = 'scale(1)';
                }
            });
        });
    }
    
    setupFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals
                const activeModal = document.querySelector('.modal-overlay.active, .completion-screen.active');
                if (activeModal) {
                    if (activeModal.classList.contains('completion-screen')) {
                        // Don't close completion screen with escape
                        return;
                    }
                    this.hideErrorModal();
                }
            }
        });
        
        // Add focus indicators for keyboard navigation
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('button, .menu-item, .submenu-item')) {
                e.target.classList.add('keyboard-focus');
            }
        });
        
        document.addEventListener('focusout', (e) => {
            e.target.classList.remove('keyboard-focus');
        });
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        // Add toast styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastBackground(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
    
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    getToastBackground(type) {
        const backgrounds = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#6366F1'
        };
        return backgrounds[type] || backgrounds.info;
    }
    
    animateProgressUpdate() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.classList.add('animate-pulse-glow');
            setTimeout(() => {
                if (progressFill && !this.isDestroyed) {
                    progressFill.classList.remove('animate-pulse-glow');
                }
            }, 1000);
        }
    }
    
    // Page lifecycle handlers
    handleVisibilityChange() {
        if (document.hidden && this.isProcessing) {
            // Pause when page becomes hidden
            console.log('Page hidden, pausing...');
            this.pauseWizard();
        }
    }
    
    handleBeforeUnload(event) {
        if (this.isProcessing && this.completedPages < this.totalPages) {
            event.preventDefault();
            event.returnValue = '진행 중인 작업이 있습니다. 정말 나가시겠습니까?';
            return event.returnValue;
        }
    }
    
    // Memory cleanup
    destroy() {
        console.log('Destroying CMSWizardApp...');
        this.isDestroyed = true;
        
        // Clear timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.introTimeout) {
            clearTimeout(this.introTimeout);
            this.introTimeout = null;
        }
        
        // Clear AI simulator timeout
        if (this.aiSimulator && this.aiSimulator.currentTimeout) {
            clearTimeout(this.aiSimulator.currentTimeout);
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        
        // Clean up event listeners map
        this.eventListeners.forEach((listener, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(listener.event, listener.handler);
            }
        });
        this.eventListeners.clear();
        
        // Clean up component references
        if (this.menuManager && typeof this.menuManager.destroy === 'function') {
            this.menuManager.destroy();
        }
        if (this.previewManager && typeof this.previewManager.destroy === 'function') {
            this.previewManager.destroy();
        }
        if (this.animator && typeof this.animator.destroy === 'function') {
            this.animator.destroy();
        }
        if (this.aiSimulator && typeof this.aiSimulator.destroy === 'function') {
            this.aiSimulator.destroy();
        }
        
        // Clean up performance utils
        if (window.performanceUtils) {
            window.performanceUtils.cleanup();
        }
        
        // Remove all modals and overlays
        document.querySelectorAll('.modal-overlay, .completion-screen, .toast').forEach(el => {
            if (el.parentNode) {
                el.remove();
            }
        });
        
        // Clear references
        this.cms = null;
        this.menuData = null;
        this.currentMenu = null;
        this.currentSubmenu = null;
        this.menuManager = null;
        this.previewManager = null;
        this.animator = null;
        this.aiSimulator = null;
        this.settings = null;
        
        // Final memory usage log
        if (window.performanceUtils) {
            window.performanceUtils.logMemoryUsage('App Destroyed');
        }
    }
    
    // Enhanced error handling
    handleError(error, context = 'Unknown') {
        console.error(`[${context}] Error:`, error);
        
        // Log error details for debugging
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            completedPages: this.completedPages,
            totalPages: this.totalPages,
            isProcessing: this.isProcessing
        };
        
        console.table(errorDetails);
        
        // Show user-friendly error message
        this.showToast(`오류가 발생했습니다: ${error.message}`, 'error');
        
        // For critical errors, offer recovery options
        if (context === 'Critical' || error.message.includes('치명적')) {
            this.showErrorModal(`심각한 오류가 발생했습니다: ${error.message}`);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // 전역 객체로 등록
    window.cmsWizardApp = new CMSWizardApp();
    window.app = window.cmsWizardApp; // 디버깅 및 접근성을 위한 별칭
    
    // 개발자 유틸리티 추가 (콘솔에서 사용 가능)
    window.devUtils = {
        // 즉시 리뷰 모드로 진입
        enableReviewMode: () => {
            console.log('🔄 리뷰 모드 강제 활성화...');
            
            // 모든 페이지를 완료 상태로 설정
            if (window.app.menuData) {
                let completedCount = 0;
                
                for (const menu of window.app.menuData.menus) {
                    for (const submenu of menu.submenus) {
                        if (submenu.status !== 'completed') {
                            // 가짜 컨텐츠 생성 및 저장
                            const pageId = `${menu.id}/${submenu.id}`;
                            const fakeContent = {
                                title: submenu.koreanTitle || submenu.title,
                                subtitle: '테스트용 자동 생성 콘텐츠',
                                mainContent: ['개발/테스트용 콘텐츠입니다.'],
                                features: [{ title: '테스트', desc: '개발용 기능' }],
                                cmsContentHTML: '<div><h2>' + (submenu.koreanTitle || submenu.title) + '</h2><p>테스트용 콘텐츠</p></div>',
                                metadata: { testMode: true, generatedAt: new Date().toISOString() }
                            };
                            
                            // 로컬 스토리지에 저장
                            window.contentStorage?.storeGeneratedContent(pageId, fakeContent);
                            
                            // 메뉴 상태 업데이트
                            window.app.menuManager?.setPageStatus(menu.id, submenu.id, 'completed');
                            
                            completedCount++;
                        }
                    }
                }
                
                // 앱 상태 업데이트
                window.app.completedPages = window.app.totalPages;
                window.app.isCompleted = true;
                window.app.isReviewMode = true;
                window.app.updateProgress();
                
                console.log(`✅ ${completedCount}개 페이지 완료 처리 - 리뷰 모드 활성화됨`);
                console.log('💡 이제 완료된 메뉴를 클릭하면 재생성 버튼이 나타납니다!');
                
                return { success: true, completedCount, message: '리뷰 모드가 활성화되었습니다' };
            } else {
                console.error('❌ 메뉴 데이터를 찾을 수 없습니다');
                return { success: false, message: '메뉴 데이터 없음' };
            }
        },
        
        // 특정 페이지만 완료 처리
        completePage: (menuId, submenuId) => {
            const pageId = `${menuId}/${submenuId}`;
            const fakeContent = {
                title: `${menuId} - ${submenuId}`,
                subtitle: '테스트용 콘텐츠',
                mainContent: ['개발용 콘텐츠입니다.'],
                features: [],
                cmsContentHTML: `<div><h2>${pageId}</h2><p>테스트</p></div>`,
                metadata: { testMode: true }
            };
            
            window.contentStorage?.storeGeneratedContent(pageId, fakeContent);
            window.app.menuManager?.setPageStatus(menuId, submenuId, 'completed');
            
            console.log(`✅ 페이지 완료: ${pageId}`);
        },
        
        // 재생성 버튼 강제 표시
        showRegenerateButton: () => {
            if (window.previewManager?.showRegenerateButton) {
                window.previewManager.showRegenerateButton();
                console.log('🔄 재생성 버튼 강제 표시');
            } else {
                console.error('❌ PreviewManager를 찾을 수 없습니다');
            }
        },
        
        // 현재 상태 확인
        checkStatus: () => {
            const status = {
                totalPages: window.app?.totalPages,
                completedPages: window.app?.completedPages,
                isCompleted: window.app?.isCompleted,
                isReviewMode: window.app?.isReviewMode,
                contentStorageType: window.contentStorage?.constructor.name,
                serverAvailable: window.contentStorage?.serverAvailable
            };
            console.table(status);
            return status;
        }
    };
    
    // 개발 모드에서 도움말 표시
    if (window.location.hostname === 'localhost' || window.location.port === '8080') {
        console.log(`
🚀 개발자 유틸리티 활성화!

📋 사용 가능한 명령어:
• devUtils.enableReviewMode()     - 즉시 리뷰 모드 활성화
• devUtils.completePage('about', 'welcome') - 특정 페이지 완료
• devUtils.showRegenerateButton() - 재생성 버튼 강제 표시
• devUtils.checkStatus()          - 현재 상태 확인

🔗 테스트용 URL:
• http://localhost:8080?dev       - 개발 모드 (빠른 생성)
• http://localhost:8080?test      - 테스트 모드
        `);
    }
});