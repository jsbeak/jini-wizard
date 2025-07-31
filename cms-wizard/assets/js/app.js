// Main Application Controller
class CMSWizardApp {
    constructor() {
        this.menuData = null;
        this.currentMenu = null;
        this.currentSubmenu = null;
        this.totalPages = 0;
        this.completedPages = 0;
        this.startTime = Date.now();
        this.isProcessing = false;
        this.timer = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Load menu data
            await this.loadMenuData();
            
            // Initialize components
            this.menuManager = new MenuManager(this.menuData, this);
            this.previewManager = new PreviewManager(this);
            this.animator = new Animator();
            this.aiSimulator = new AISimulator(this);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start intro sequence
            this.startIntroSequence();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    async loadMenuData() {
        try {
            const response = await fetch('assets/data/menu-data.json');
            const data = await response.json();
            this.menuData = data;
            
            // Calculate total pages
            this.totalPages = data.menus.reduce((total, menu) => {
                return total + menu.submenus.length;
            }, 0);
            
        } catch (error) {
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
        
        // Footer buttons
        const pauseBtn = document.getElementById('btn-pause');
        const skipBtn = document.getElementById('btn-skip');
        
        pauseBtn.addEventListener('click', () => this.togglePause());
        skipBtn.addEventListener('click', () => this.skipCurrentPage());
        
        // Header buttons
        document.getElementById('btn-help').addEventListener('click', () => this.showHelp());
        document.getElementById('btn-settings').addEventListener('click', () => this.showSettings());
        
        // Add click feedback to all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!btn.disabled) {
                    btn.classList.add('animate-buttonPress');
                    setTimeout(() => btn.classList.remove('animate-buttonPress'), 200);
                }
            });
        });
    }
    
    startIntroSequence() {
        const introScreen = document.getElementById('intro-screen');
        const mainInterface = document.getElementById('main-interface');
        
        // Show intro
        introScreen.classList.add('active');
        
        // Transition to main interface after 3 seconds
        setTimeout(() => {
            introScreen.classList.remove('active');
            setTimeout(() => {
                mainInterface.classList.add('active');
                this.startWizard();
            }, 500);
        }, 3000);
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
        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `경과 시간: ${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        
        // Mark as completed
        this.menuManager.setPageStatus(nextPage.menu.id, nextPage.submenu.id, 'completed');
        this.completedPages++;
        this.updateProgress();
        
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
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        progressCount.textContent = `${this.completedPages} / ${this.totalPages} 페이지`;
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
        
        event.target.classList.add('active');
        this.previewManager.setZoom(zoom);
    }
    
    togglePause() {
        const pauseBtn = document.getElementById('btn-pause');
        
        if (this.isProcessing) {
            this.isProcessing = false;
            pauseBtn.textContent = '계속';
            clearInterval(this.timer);
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
        clearInterval(this.timer);
        
        // Show completion modal
        this.showCompletionModal();
        
        // Create confetti effect
        this.createConfetti();
    }
    
    showCompletionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">축하합니다! 🎉</h2>
                </div>
                <div class="modal-body">
                    <div class="success-checkmark">
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle class="success-checkmark-circle" cx="40" cy="40" r="38" stroke-width="3" fill="none" />
                            <path class="success-checkmark-check" d="M20 40 L32 52 L60 24" stroke-width="3" fill="none" />
                        </svg>
                    </div>
                    <p style="text-align: center; margin-top: 24px; font-size: 18px;">
                        ${this.totalPages}개 페이지가 모두 완성되었습니다!
                    </p>
                    <p style="text-align: center; margin-top: 12px; color: var(--text-secondary);">
                        총 소요 시간: ${document.getElementById('timer').textContent.replace('경과 시간: ', '')}
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="location.reload()">다시 시작</button>
                    <button class="btn-primary" onclick="window.open('https://mysite.com', '_blank')">사이트 보기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    createConfetti() {
        const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }
    
    showHelp() {
        alert('CMS 사이트 마법사 도움말\n\nAI가 자동으로 사이트 컨텐츠를 생성합니다.\n일시정지하거나 건너뛸 수 있습니다.');
    }
    
    showSettings() {
        alert('설정 기능은 준비 중입니다.');
    }
    
    showError(message) {
        console.error(message);
        alert(`오류가 발생했습니다: ${message}`);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cmsWizardApp = new CMSWizardApp();
});