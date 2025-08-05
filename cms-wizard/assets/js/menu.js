// Menu Manager Class
class MenuManager {
    constructor(menuData, app) {
        this.menuData = menuData;
        this.app = app;
        this.menuList = document.getElementById('menu-list');
        this.expandedMenus = new Set();
        this.eventListeners = new Map();
        this.animationTimeouts = new Set();
        this.isDestroyed = false;
        this.reviewMode = false;
    }
    
    renderMenu() {
        console.log('🎨 메뉴 렌더링 시작...');
        this.menuList.innerHTML = '';
        
        this.menuData.menus.forEach((menu, index) => {
            console.log(`📋 메뉴 생성 (${index + 1}/${this.menuData.menus.length}):`, menu.title || menu.koreanTitle);
            const menuItem = this.createMenuItem(menu);
            this.menuList.appendChild(menuItem);
        });
        
        // Clean up any existing pulse animations
        this.cleanupPulseAnimations();
        
        // Auto-expand first menu
        if (this.menuData.menus.length > 0) {
            const firstMenuItem = this.menuList.querySelector('.menu-item');
            this.toggleMenu(firstMenuItem);
            console.log('✅ 첫 번째 메뉴 자동 확장');
        }
        
        console.log('✅ 메뉴 렌더링 완료');
    }
    
    createMenuItem(menu) {
        const menuItem = document.createElement('li');
        menuItem.className = 'menu-item';
        menuItem.dataset.status = menu.status;
        menuItem.dataset.menuId = menu.id;
        
        // Create menu header
        const menuHeader = document.createElement('div');
        menuHeader.className = 'menu-header';
        
        // 한국어 제목이 있으면 우선 표시, 없으면 영문 제목 사용
        const displayTitle = menu.koreanTitle || menu.title;
        
        menuHeader.innerHTML = `
            <span class="menu-icon">${this.getStatusIcon(menu.status)}</span>
            <span class="menu-title">${displayTitle}</span>
        `;
        
        // Add click handler with memory tracking
        const clickHandler = () => {
            if (!this.isDestroyed) {
                this.toggleMenu(menuItem);
            }
        };
        
        menuHeader.addEventListener('click', clickHandler);
        
        // Track event listener for cleanup
        this.eventListeners.set(menuHeader, {
            event: 'click',
            handler: clickHandler
        });
        
        // Create submenu list
        const submenuList = document.createElement('ul');
        submenuList.className = 'submenu-list';
        
        menu.submenus.forEach(submenu => {
            const submenuItem = this.createSubmenuItem(submenu, menu.id);
            submenuList.appendChild(submenuItem);
        });
        
        menuItem.appendChild(menuHeader);
        menuItem.appendChild(submenuList);
        
        return menuItem;
    }
    
    createSubmenuItem(submenu, menuId) {
        const submenuItem = document.createElement('li');
        submenuItem.className = 'submenu-item';
        submenuItem.dataset.status = submenu.status;
        submenuItem.dataset.menuId = menuId;
        submenuItem.dataset.submenuId = submenu.id;
        
        // 서브메뉴도 한국어 제목 우선 표시
        const displayTitle = submenu.koreanTitle || submenu.title;
        
        submenuItem.innerHTML = `
            <span class="submenu-icon">${this.getStatusIcon(submenu.status)}</span>
            <span class="submenu-title">${displayTitle}</span>
        `;
        
        // Add click handler with memory tracking
        const submenuClickHandler = () => {
            if (!this.isDestroyed) {
                if (this.reviewMode && submenu.status === 'completed') {
                    // In review mode, load completed page immediately
                    this.loadCompletedPageImmediate(menuId, submenu.id, submenu);
                } else if (submenu.status === 'completed' && !this.reviewMode) {
                    // During generation, just preview completed pages
                    if (this.app.previewManager && this.app.previewManager.loadPage) {
                        this.app.previewManager.loadPage(submenu.url, false);
                    }
                }
            }
        };
        
        submenuItem.addEventListener('click', submenuClickHandler);
        
        // Track event listener for cleanup
        this.eventListeners.set(submenuItem, {
            event: 'click',
            handler: submenuClickHandler
        });
        
        return submenuItem;
    }
    
    toggleMenu(menuItem) {
        const menuId = menuItem.dataset.menuId;
        const isExpanded = menuItem.classList.contains('expanded');
        
        if (isExpanded) {
            menuItem.classList.remove('expanded');
            this.expandedMenus.delete(menuId);
        } else {
            menuItem.classList.add('expanded');
            this.expandedMenus.add(menuId);
            
            // Add ripple effect
            this.addRippleEffect(menuItem.querySelector('.menu-header'));
        }
    }
    
    setPageStatus(menuId, submenuId, status) {
        // Update menu data
        const menu = this.menuData.menus.find(m => m.id === menuId);
        if (menu) {
            const submenu = menu.submenus.find(s => s.id === submenuId);
            if (submenu) {
                submenu.status = status;
            }
            
            // Update menu status if all submenus are completed
            const allCompleted = menu.submenus.every(s => s.status === 'completed');
            if (allCompleted) {
                menu.status = 'completed';
            } else if (menu.submenus.some(s => s.status === 'processing')) {
                menu.status = 'processing';
            } else {
                menu.status = 'waiting';
            }
        }
        
        // Update UI - but don't animate parent menu
        this.updateMenuItemStatus(menuId, menu.status, false); // false = no animation for parent
        this.updateSubmenuItemStatus(menuId, submenuId, status);
        
        // Auto-expand menu if processing
        if (status === 'processing') {
            const menuItem = this.menuList.querySelector(`[data-menu-id="${menuId}"]`);
            if (!menuItem.classList.contains('expanded')) {
                this.toggleMenu(menuItem);
            }
            
            // Scroll to active item
            this.scrollToActiveItem(menuId, submenuId);
        }
    }
    
    updateMenuItemStatus(menuId, status, allowAnimation = true) {
        const menuItem = this.menuList.querySelector(`[data-menu-id="${menuId}"]`);
        if (menuItem) {
            const menu = this.menuData.menus.find(m => m.id === menuId);
            menuItem.dataset.status = menu.status;
            
            const icon = menuItem.querySelector('.menu-icon');
            icon.textContent = this.getStatusIcon(menu.status);
            
            // Only add animation if explicitly allowed and not during processing
            if (allowAnimation) {
                if (menu.status === 'completed') {
                    menuItem.classList.remove('pulse'); // Remove pulse animation
                    this.animateCompletion(icon);
                } else if (menu.status === 'processing') {
                    // Don't add pulse to parent menu when child is processing
                    menuItem.classList.remove('pulse');
                } else {
                    menuItem.classList.remove('pulse'); // Clean up pulse animation
                }
            } else {
                // Just update status without animation
                menuItem.classList.remove('pulse');
            }
        }
    }
    
    updateSubmenuItemStatus(menuId, submenuId, status) {
        const submenuItem = this.menuList.querySelector(
            `[data-menu-id="${menuId}"][data-submenu-id="${submenuId}"]`
        );
        
        if (submenuItem) {
            submenuItem.dataset.status = status;
            
            const icon = submenuItem.querySelector('.submenu-icon');
            icon.textContent = this.getStatusIcon(status);
            
            // Add animation for status change
            if (status === 'completed') {
                submenuItem.classList.remove('pulse'); // Remove pulse animation
                this.animateCompletion(icon);
            } else if (status === 'processing') {
                submenuItem.classList.add('pulse');
            } else {
                submenuItem.classList.remove('pulse'); // Clean up pulse animation
            }
        }
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'waiting':
                return '○';
            case 'processing':
                return '⏳';
            case 'completed':
                return '✓';
            default:
                return '○';
        }
    }
    
    scrollToActiveItem(menuId, submenuId) {
        const submenuItem = this.menuList.querySelector(
            `[data-menu-id="${menuId}"][data-submenu-id="${submenuId}"]`
        );
        
        if (submenuItem) {
            submenuItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    animateCompletion(element) {
        if (this.isDestroyed || !element) return;
        
        // Scale animation
        element.style.transform = 'scale(0)';
        
        const timeoutId1 = setTimeout(() => {
            if (!this.isDestroyed && element) {
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = 'scale(1.2)';
                
                const timeoutId2 = setTimeout(() => {
                    if (!this.isDestroyed && element) {
                        element.style.transform = 'scale(1)';
                    }
                    this.animationTimeouts.delete(timeoutId2);
                }, 300);
                
                this.animationTimeouts.add(timeoutId2);
            }
            this.animationTimeouts.delete(timeoutId1);
        }, 50);
        
        this.animationTimeouts.add(timeoutId1);
    }
    
    addRippleEffect(element) {
        if (this.isDestroyed || !element) return;
        
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.width = ripple.style.height = '0';
        
        element.appendChild(ripple);
        
        const timeoutId1 = setTimeout(() => {
            if (!this.isDestroyed && ripple) {
                ripple.style.width = ripple.style.height = rect.width + 'px';
            }
            this.animationTimeouts.delete(timeoutId1);
        }, 10);
        
        const timeoutId2 = setTimeout(() => {
            if (!this.isDestroyed && ripple.parentNode) {
                ripple.remove();
            }
            this.animationTimeouts.delete(timeoutId2);
        }, 600);
        
        this.animationTimeouts.add(timeoutId1);
        this.animationTimeouts.add(timeoutId2);
    }
    
    // Clean up pulse animations for completed items
    cleanupPulseAnimations() {
        if (this.isDestroyed || !this.menuList) return;
        
        const allPulseItems = this.menuList.querySelectorAll('.pulse');
        allPulseItems.forEach(item => {
            const status = item.dataset.status;
            if (status === 'completed' || status === 'waiting') {
                item.classList.remove('pulse');
            }
        });
    }
    
    // Memory cleanup method
    destroy() {
        console.log('Destroying MenuManager...');
        this.isDestroyed = true;
        
        // Clear all animation timeouts
        this.animationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.animationTimeouts.clear();
        
        // Remove all event listeners
        this.eventListeners.forEach((listener, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(listener.event, listener.handler);
            }
        });
        this.eventListeners.clear();
        
        // Clear references
        this.menuData = null;
        this.app = null;
        this.menuList = null;
        this.expandedMenus.clear();
    }
    
    // Enable review mode - allows clicking on completed items
    enableReviewMode() {
        console.log('📋 메뉴 검토 모드 활성화');
        this.reviewMode = true;
        
        // Update all completed items to show they're clickable
        document.querySelectorAll('.submenu-item[data-status="completed"]').forEach(item => {
            item.style.cursor = 'pointer';
            item.style.opacity = '1';
            
            // 저장된 콘텐츠 확인
            const menuId = item.getAttribute('data-menu-id');
            const submenuId = item.getAttribute('data-submenu-id');
            if (menuId && submenuId && window.contentStorage) {
                const pageId = `${menuId}/${submenuId}`;
                const hasContent = window.contentStorage.getGeneratedContent(pageId);
                console.log(`📄 콘텐츠 확인 [${pageId}]:`, hasContent ? '✅ 있음' : '❌ 없음');
            }
            
            // Add visual indicator
            if (!item.querySelector('.review-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'review-indicator';
                indicator.innerHTML = '👁️';
                indicator.style.cssText = `
                    font-size: 12px;
                    margin-left: 8px;
                    opacity: 0.7;
                    transition: opacity 0.2s ease;
                `;
                item.appendChild(indicator);
            }
        });
        
        // Add hover effects for completed items
        document.querySelectorAll('.submenu-item[data-status="completed"]').forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (this.reviewMode) {
                    item.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    item.style.transform = 'translateX(8px)';
                    const indicator = item.querySelector('.review-indicator');
                    if (indicator) {
                        indicator.style.opacity = '1';
                    }
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (this.reviewMode) {
                    item.style.backgroundColor = '';
                    item.style.transform = 'translateX(0)';
                    const indicator = item.querySelector('.review-indicator');
                    if (indicator) {
                        indicator.style.opacity = '0.7';
                    }
                }
            });
        });
        
        // Expand all menus for easy access
        this.expandAllMenus();
    }
    
    expandAllMenus() {
        document.querySelectorAll('.menu-item').forEach(menuItem => {
            if (!menuItem.classList.contains('expanded')) {
                this.toggleMenu(menuItem);
            }
        });
    }
    
    loadCompletedPage(menuId, submenuId, submenu) {
        console.log(`🔍 검토 모드: ${submenu.koreanTitle || submenu.title} 페이지 로드`);
        
        // Highlight current selection
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('current-review');
        });
        
        const currentItem = document.querySelector(`[data-menu-id="${menuId}"][data-submenu-id="${submenuId}"]`);
        if (currentItem) {
            currentItem.classList.add('current-review');
        }
        
        // Load the page with generated content
        if (this.app.previewManager) {
            this.app.previewManager.loadCompletedPageForReview(menuId, submenuId, submenu);
        }
        
        // Update status message
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #6366F1;">
                    <span style="font-size: 14px;">👁️ 검토 중: ${submenu.koreanTitle || submenu.title}</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    생성된 콘텐츠를 확인하고 있습니다
                </div>
            `;
        }
        
        // Show review toast
        this.app.showToast(`"${submenu.koreanTitle || submenu.title}" 페이지를 검토 중입니다`, 'info');
    }
    
    /**
     * 완료된 페이지를 즉시 로드 (애니메이션 없이)
     */
    loadCompletedPageImmediate(menuId, submenuId, submenu) {
        console.log(`⚡ 즉시 로드: ${submenu.koreanTitle || submenu.title} 페이지`);
        
        // Highlight current selection
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('current-review');
        });
        
        const currentItem = document.querySelector(`[data-menu-id="${menuId}"][data-submenu-id="${submenuId}"]`);
        if (currentItem) {
            currentItem.classList.add('current-review');
        }
        
        // 즉시 페이지 로드 (애니메이션 없이)
        if (this.app.previewManager) {
            // URL 먼저 업데이트
            const url = submenu.url || `/${menuId}/${submenuId}`;
            this.app.previewManager.currentUrl = url;
            this.app.previewManager.urlDisplay.textContent = `https://mysite.com${url}`;
            
            // ContentStorage를 사용해 즉시 HTML 생성 및 로드
            if (!window.contentStorage) {
                window.contentStorage = new ContentStorage();
            }
            
            const reviewContent = window.contentStorage.generatePageHTML(menuId, submenuId, submenu);
            this.app.previewManager.iframe.srcdoc = reviewContent;
            this.app.previewManager.applyZoom();
        }
        
        // Update status message
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #6366F1;">
                    <span style="font-size: 14px;">👁️ 검토 중: ${submenu.koreanTitle || submenu.title}</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    생성된 콘텐츠를 확인하고 있습니다
                </div>
            `;
        }
        
        console.log(`✅ 즉시 로드 완료: ${submenu.koreanTitle || submenu.title}`);
    }
}