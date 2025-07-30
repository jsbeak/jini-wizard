// Preview Manager Class
class PreviewManager {
    constructor(app) {
        this.app = app;
        this.iframe = document.getElementById('preview-iframe');
        this.urlDisplay = document.getElementById('browser-url-text');
        this.currentZoom = 100;
        this.currentUrl = '';
    }
    
    async loadPage(url) {
        // Update URL display
        this.currentUrl = url;
        this.urlDisplay.textContent = `https://mysite.com${url}`;
        
        // Add page transition animation
        await this.animatePageTransition();
        
        // Create or load template page
        const templatePath = `templates${url}.html`;
        
        // For demo purposes, we'll create a simple template
        const pageContent = this.createTemplateContent(url);
        
        // Load content into iframe
        this.iframe.srcdoc = pageContent;
        
        // Apply zoom
        this.applyZoom();
    }
    
    createTemplateContent(url) {
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
                        font-size: 24px;
                        font-weight: bold;
                        color: #6366F1;
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
                        color: #6366F1;
                    }
                    
                    .hero {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                            <div class="logo">MyCompany</div>
                            <ul class="nav-menu">
                                <li><a href="/about">About</a></li>
                                <li><a href="/research">Research</a></li>
                                <li><a href="/services">Services</a></li>
                                <li><a href="/team">Team</a></li>
                                <li><a href="/portfolio">Portfolio</a></li>
                                <li><a href="/resources">Resources</a></li>
                                <li><a href="/news">News</a></li>
                                <li><a href="/contact">Contact</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                
                <section class="hero">
                    <div class="container">
                        <h1 class="page-title">${this.getPageTitle(section, page)}</h1>
                        <p class="page-subtitle">
                            <span class="placeholder-text ai-generating">AI가 콘텐츠를 생성하고 있습니다...</span>
                        </p>
                    </div>
                </section>
                
                <section class="content">
                    <div class="container">
                        <h2>Overview</h2>
                        <p>
                            <span class="placeholder-text">Lorem ipsum dolor sit amet</span>
                            <span class="placeholder-text">consectetur adipiscing elit</span>
                            <span class="placeholder-text">sed do eiusmod tempor</span>
                            <span class="placeholder-text">incididunt ut labore et dolore</span>
                        </p>
                        
                        <div class="image-placeholder">
                            <span>Image will be generated here</span>
                        </div>
                        
                        <div class="grid">
                            <div class="card">
                                <h3><span class="placeholder-text">Feature 1</span></h3>
                                <p>
                                    <span class="placeholder-text">Description text</span>
                                    <span class="placeholder-text">will be generated</span>
                                </p>
                            </div>
                            <div class="card">
                                <h3><span class="placeholder-text">Feature 2</span></h3>
                                <p>
                                    <span class="placeholder-text">Description text</span>
                                    <span class="placeholder-text">will be generated</span>
                                </p>
                            </div>
                            <div class="card">
                                <h3><span class="placeholder-text">Feature 3</span></h3>
                                <p>
                                    <span class="placeholder-text">Description text</span>
                                    <span class="placeholder-text">will be generated</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </body>
            </html>
        `;
    }
    
    getPageTitle(section, page) {
        const titles = {
            'about': {
                'welcome': 'Welcome to Our Company',
                'company': 'Company Overview',
                'mission': 'Our Mission & Vision'
            },
            'research': {
                'areas': 'Research Areas',
                'projects': 'Current Projects',
                'publications': 'Publications'
            },
            'services': {
                'consulting': 'Consulting Services',
                'development': 'Development Services',
                'support': 'Support Services'
            },
            'team': {
                'leadership': 'Our Leadership',
                'researchers': 'Research Team',
                'careers': 'Join Our Team'
            },
            'portfolio': {
                'case-studies': 'Case Studies',
                'clients': 'Our Clients',
                'testimonials': 'Client Testimonials'
            },
            'resources': {
                'blog': 'Blog & Articles',
                'whitepapers': 'Whitepapers',
                'tools': 'Tools & Downloads'
            },
            'news': {
                'latest': 'Latest News',
                'events': 'Upcoming Events',
                'press': 'Press Releases'
            },
            'contact': {
                'info': 'Contact Information',
                'location': 'Our Location',
                'support': 'Get Support'
            }
        };
        
        return titles[section]?.[page] || 'Page Title';
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
}