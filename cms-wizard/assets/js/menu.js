// Menu Manager Class
class MenuManager {
    constructor(menuData, app) {
        this.menuData = menuData;
        this.app = app;
        this.menuList = document.getElementById('menu-list');
        this.expandedMenus = new Set();
    }
    
    renderMenu() {
        this.menuList.innerHTML = '';
        
        this.menuData.menus.forEach(menu => {
            const menuItem = this.createMenuItem(menu);
            this.menuList.appendChild(menuItem);
        });
        
        // Auto-expand first menu
        if (this.menuData.menus.length > 0) {
            const firstMenuItem = this.menuList.querySelector('.menu-item');
            this.toggleMenu(firstMenuItem);
        }
    }
    
    createMenuItem(menu) {
        const menuItem = document.createElement('li');
        menuItem.className = 'menu-item';
        menuItem.dataset.status = menu.status;
        menuItem.dataset.menuId = menu.id;
        
        // Create menu header
        const menuHeader = document.createElement('div');
        menuHeader.className = 'menu-header';
        menuHeader.innerHTML = `
            <span class="menu-icon">${this.getStatusIcon(menu.status)}</span>
            <span class="menu-title">${menu.title}</span>
        `;
        
        // Add click handler
        menuHeader.addEventListener('click', () => this.toggleMenu(menuItem));
        
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
        
        submenuItem.innerHTML = `
            <span class="submenu-icon">${this.getStatusIcon(submenu.status)}</span>
            <span class="submenu-title">${submenu.title}</span>
        `;
        
        // Add click handler
        submenuItem.addEventListener('click', () => {
            if (submenu.status === 'completed') {
                this.app.previewManager.loadPage(submenu.url);
            }
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
            }
        }
        
        // Update UI
        this.updateMenuItemStatus(menuId, status);
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
    
    updateMenuItemStatus(menuId, status) {
        const menuItem = this.menuList.querySelector(`[data-menu-id="${menuId}"]`);
        if (menuItem) {
            const menu = this.menuData.menus.find(m => m.id === menuId);
            menuItem.dataset.status = menu.status;
            
            const icon = menuItem.querySelector('.menu-icon');
            icon.textContent = this.getStatusIcon(menu.status);
            
            // Add animation for status change
            if (menu.status === 'completed') {
                this.animateCompletion(icon);
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
                this.animateCompletion(icon);
            } else if (status === 'processing') {
                submenuItem.classList.add('pulse');
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
        // Scale animation
        element.style.transform = 'scale(0)';
        setTimeout(() => {
            element.style.transition = 'transform 0.3s ease';
            element.style.transform = 'scale(1.2)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        }, 50);
    }
    
    addRippleEffect(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.width = ripple.style.height = '0';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.width = ripple.style.height = rect.width + 'px';
        }, 10);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}