# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CMS Template Site Configuration Wizard - a visual interface that simulates AI-powered automatic content generation for website templates. The application presents a wizard-like interface showing real-time progress as it "generates" content for 24 pages across 8 menu categories.

## Running the Application

```bash
# Navigate to the wizard directory
cd cms-wizard

# Start a local development server (choose one):
python3 -m http.server 8000
# or
npx http-server -p 8000

# Open in browser
http://localhost:8000
```

## Key Architecture Concepts

### Application Flow
1. **Intro Sequence** → Shows logo and welcome message for 3 seconds
2. **Main Interface** → Displays menu navigation (left) and browser preview (right)
3. **Auto-Processing** → Automatically processes each page sequentially
4. **Content Generation** → Simulates AI generating Korean content with typewriter effects
5. **Completion** → Shows success modal with confetti animation

### Component Architecture

The application follows a class-based architecture with clear separation of concerns:

- **CMSWizardApp** (`app.js`): Main controller that orchestrates the entire application
  - Manages application state (current page, progress, timing)
  - Coordinates between all other components
  - Handles the main workflow loop

- **MenuManager** (`menu.js`): Controls the left sidebar menu
  - Renders menu structure from `menu-data.json`
  - Updates menu item states (waiting → processing → completed)
  - Handles menu expansion/collapse and visual feedback

- **PreviewManager** (`preview.js`): Manages the browser preview iframe
  - Creates template pages dynamically
  - Handles page transitions with animations
  - Manages zoom functionality (50%, 75%, 100%)

- **Animator** (`animator.js`): Centralized animation engine using Motion.js
  - Provides reusable animation methods (fadeIn, typewriter, etc.)
  - Manages complex animation sequences
  - Handles performance optimizations

- **AISimulator** (`ai-simulator.js`): Simulates AI content generation
  - Contains Korean content database for all 24 pages
  - Implements realistic typing delays
  - Updates page content with animation effects

### Data Flow

```
menu-data.json → CMSWizardApp → MenuManager
                      ↓
                 AISimulator → PreviewManager
                      ↓
                  Animator (handles all visual effects)
```

### Critical Configuration Points

1. **Menu Structure** (`assets/data/menu-data.json`):
   - Defines all 8 menu categories and their 3 submenus each
   - Contains status messages shown during processing
   - Total of 24 pages must be maintained for progress tracking

2. **Content Database** (`ai-simulator.js`):
   - Korean content is hardcoded in `initContentDatabase()`
   - Each page has title, subtitle, content array, and features array
   - Content structure must match the template structure in `preview.js`

3. **Animation Timing**:
   - Intro sequence: 3 seconds
   - Page processing delay: 1-3 seconds (randomized)
   - Page transition: 1 second between pages
   - Typewriter speed: 50ms per character

### CSS Architecture

The CSS is modular with clear separation:
- `variables.css`: Design tokens (colors, spacing, typography)
- `layout.css`: Major layout components
- `components.css`: Reusable UI components
- `animations.css`: All keyframe animations

## Common Modifications

### Adding/Removing Menu Items
1. Edit `assets/data/menu-data.json`
2. Update content database in `ai-simulator.js`
3. The app will automatically adjust total page count

### Changing Animation Speed
- Generation delay: `ai-simulator.js` → `this.generationDelay`
- Typewriter speed: `animator.js` → `typewriterEffect()` speed parameter
- Page transitions: `animations.css` → animation durations

### Customizing Content
- All Korean content is in `ai-simulator.js` → `initContentDatabase()`
- Template HTML structure is in `preview.js` → `createTemplateContent()`

### Styling Changes
- Colors: Edit CSS variables in `variables.css`
- Layout dimensions: `--header-height`, `--sidebar-width`, `--footer-height`
- Responsive breakpoints: Currently desktop-only (1920x1080 optimized)

## Important Implementation Details

- The application uses `iframe.srcdoc` instead of loading actual files for security and simplicity
- All animations use GPU-accelerated properties (transform, opacity) for performance
- The progress calculation is automatic based on menu structure
- Menu state changes trigger visual updates through data attributes
- The browser frame zoom affects the iframe content using CSS transforms