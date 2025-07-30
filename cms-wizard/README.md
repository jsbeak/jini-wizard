# CMS Template Site Configuration Wizard

AI가 자동으로 사이트 컨텐츠를 생성하는 비주얼 마법사 인터페이스

## 🚀 Quick Start

1. **Local Development Server**
   ```bash
   cd cms-wizard
   python3 -m http.server 8000
   # or
   npx http-server -p 8000
   ```

2. **Open in Browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
cms-wizard/
├── index.html              # Main HTML file
├── assets/
│   ├── css/               # Stylesheets
│   │   ├── reset.css      # CSS reset
│   │   ├── variables.css  # CSS variables
│   │   ├── layout.css     # Layout styles
│   │   ├── components.css # Component styles
│   │   └── animations.css # Animation styles
│   ├── js/                # JavaScript files
│   │   ├── app.js         # Main application
│   │   ├── menu.js        # Menu navigation
│   │   ├── preview.js     # Preview manager
│   │   ├── animator.js    # Animation engine
│   │   └── ai-simulator.js # AI content simulator
│   └── data/              # Data files
│       └── menu-data.json # Menu structure
└── templates/             # Page templates (optional)
```

## 🎨 Features

- **Visual Wizard Interface**: 실시간 진행 상황 표시
- **AI Content Generation**: 자동 컨텐츠 생성 시뮬레이션
- **Smooth Animations**: Motion.js 기반 부드러운 애니메이션
- **Progress Tracking**: 24개 페이지 진행률 추적
- **Responsive Preview**: 브라우저 프레임 내 실시간 미리보기

## 🛠 Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Animation**: Motion.js
- **Libraries**: jQuery 3.6.0
- **Design**: Modern, minimalist UI
- **Browser Support**: Chrome, Safari, Firefox, Edge (latest)

## 📱 Browser Compatibility

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## 🚀 Deployment

### Static Hosting
1. Upload all files to your web server
2. Ensure proper MIME types for JavaScript and CSS
3. No server-side requirements

### CDN Setup (Optional)
```html
<!-- Update CDN paths in index.html -->
<link rel="stylesheet" href="https://your-cdn.com/css/app.min.css">
<script src="https://your-cdn.com/js/app.min.js"></script>
```

### Production Optimization
1. Minify CSS and JavaScript files
2. Enable gzip compression
3. Set proper cache headers
4. Use CDN for static assets

## 🔧 Configuration

### Customize Menu Structure
Edit `assets/data/menu-data.json` to modify:
- Menu items and submenus
- Status messages
- Page URLs

### Adjust Animation Speed
In `assets/js/ai-simulator.js`:
```javascript
this.generationDelay = { min: 1000, max: 3000 };
```

### Change Colors
Edit CSS variables in `assets/css/variables.css`

## 📝 License

Copyright (c) 2024. All rights reserved.