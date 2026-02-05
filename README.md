# Concept Interpretability Study - Refactored

A modern, maintainable single-page application for conducting human perception research on machine learning interpretability. Features real HTML pages, modular controllers, and organized styling.

## 📁 Project Structure

```
lukas-schwab.github.io/
├── index.html                           # Main entry point
├── app.js                               # Application controller & router
├── styles/                              # Organized stylesheets (NEW)
│   ├── main.css                         # Entry point with imports
│   ├── components.css                   # UI components (buttons, inputs, cards)
│   ├── pages.css                        # Page layouts & page-specific styles
│   ├── layout.css                       # Grid and structure
│   └── responsive.css                   # Media queries & responsive design
├── pages/                               # Real HTML page templates (NEW)
│   ├── landing.html                     # Study introduction
│   ├── region-locator.html              # Draw boundaries task
│   ├── labeling.html                    # Image labeling task
│   ├── property-identifier.html         # Click properties task
│   └── similarity-labeling.html         # Rate similarity task
├── modules/                             # Core modules
│   ├── storage.js                       # Data persistence & local storage
│   ├── utils.js                         # Shared utilities (NEW)
│   ├── controllers/                     # Task-specific controllers (NEW)
│   │   ├── region-locator.js            # Region drawing logic
│   │   ├── labeling.js                  # Label input logic
│   │   ├── property-identifier.js       # Property marking logic
│   │   └── similarity-labeling.js       # Slider rating logic
│   ├── region_locator.js                # (DEPRECATED - kept for reference)
│   ├── labeling.js                      # (DEPRECATED - kept for reference)
│   ├── property_identifier.js           # (DEPRECATED - kept for reference)
│   └── similarity.js                    # (DEPRECATED - kept for reference)
├── assets/                              # Images and media
│   ├── concepts/
│   ├── patches/
│   └── targets/
└── old/                                 # Legacy files (archived)
```

## 🎯 Key Improvements

### 1. **Real HTML Pages**
- HTML markup extracted from JavaScript strings
- Pages stored as separate `.html` files in `/pages`
- Pages loaded dynamically at runtime
- Easier to maintain and visualize markup structure

### 2. **Modular Controller Architecture**
- Clean separation of concerns
- Controllers in `/modules/controllers/` contain only logic
- Controllers receive container element and configuration
- Returns cleanup function for proper teardown

**Old Pattern:**
```javascript
export const Module = {
    render: (data) => `<html>...</html>`,
    init: (container) => { /* logic */ }
}
```

**New Pattern:**
```javascript
export const Controller = {
    init: (container, data) => {
        // Set up DOM elements and event listeners
        return () => { /* cleanup */ }
    }
}
```

### 3. **Organized Stylesheets**
- Styles split into logical modules
- Main entry point: `styles/main.css`
- Component styles: `styles/components.css`
- Page-specific layouts: `styles/pages.css`
- Responsive design: `styles/responsive.css`
- Easier to locate and modify styles

### 4. **Shared Utilities**
- Common functions extracted to `modules/utils.js`
- `loadPageHTML()` - fetch page templates
- `showToast()` - display notifications
- `debounce()`, `deepClone()` - helper utilities

### 5. **Dynamic Page Loading**
- App controller dynamically loads page HTML
- Single HTML entry point with dynamic content
- Smooth transitions between tasks
- Proper event delegation and cleanup

## 🚀 Getting Started

### Prerequisites
- Modern web browser (ES6+ support)
- Local HTTP server (required for CORS when loading pages)

### Setup
1. Clone the repository
2. Run a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. Open `http://localhost:8000` in your browser

### File Loading Workflow
1. User opens `index.html`
2. `app.js` loads and initializes
3. Landing page HTML is fetched from `pages/landing.html`
4. User clicks "Begin Study"
5. Task pages are loaded dynamically from `pages/`
6. Corresponding controller initializes and binds events
7. On task completion, cleanup function is called
8. Next task page is loaded

## 📝 Adding a New Task

### 1. Create the HTML Page
Create `pages/my-task.html`:
```html
<header>
    <h1>Task Title</h1>
    <p class="lead">Task description</p>
</header>

<section class="my-task-container">
    <img id="taskImage" alt="Task image">
    <button id="submitBtn" class="primary">Submit</button>
</section>
```

### 2. Create the Controller
Create `modules/controllers/my-task.js`:
```javascript
import { storage } from '../storage.js';
import { showToast } from '../utils.js';

export const MyTaskController = {
    init: (container, data = {}) => {
        const image = container.querySelector('#taskImage');
        const submitBtn = container.querySelector('#submitBtn');
        
        if (image) image.src = data.img || 'assets/default.png';

        const handleSubmit = () => {
            storage.saveResult('my_task', { /* results */ }, data);
            showToast('Submitted!');
        };

        submitBtn.addEventListener('click', handleSubmit);

        // Return cleanup function
        return () => {
            submitBtn.removeEventListener('click', handleSubmit);
        };
    }
};
```

### 3. Register in `app.js`
```javascript
import { MyTaskController } from './modules/controllers/my-task.js';

const taskControllers = {
    // ... existing tasks
    my_task: { controller: MyTaskController, page: 'my-task' }
};
```

### 4. Update Task List
Modify `fetchTasksFromApi()` in `app.js`:
```javascript
{
    type: 'my_task',
    assets: {
        img: 'assets/image.png'
    }
}
```

## 🎨 Styling Guidelines

### Component-Based CSS
- **components.css**: Reusable UI elements
  - Buttons, inputs, cards, markers, toasts
- **pages.css**: Page-specific layouts
  - Landing page, task containers, grids
- **responsive.css**: Breakpoints & media queries

### CSS Classes
- `.primary`, `.secondary` - Button variants
- `.imgwrap` - Image containers
- `.target-wrap` - Interactive image areas
- `.actions` - Button groups
- `.status` - Status messages
- `.toast` - Notifications

### Adding Page-Specific Styles
1. Add styles to `styles/pages.css`
2. Use BEM naming: `.my-task-container`, `.my-task__element`
3. Ensure responsive breakpoints are handled in `styles/responsive.css`

## 🔄 Task Flow

```
Landing Page
    ↓
User Clicks "Begin Study"
    ↓
Load Region Locator Page → Initialize Controller → User Completes → Cleanup
    ↓
Load Labeling Page → Initialize Controller → User Completes → Cleanup
    ↓
Load Property Identifier Page → Initialize Controller → User Completes → Cleanup
    ↓
Load Similarity Labeling Page → Initialize Controller → User Completes → Cleanup
    ↓
Completion Page (Show Results)
```

## 💾 Data Storage

All results are saved via `storage.saveResult()`:
```javascript
storage.saveResult(taskType, results, originalData);
```

Results are:
- Stored in browser's local storage
- Pseudonymized (no personal data)
- Downloadable as JSON
- Clearable by user

## 🔧 Utilities

### `loadPageHTML(pageName)`
```javascript
const html = await loadPageHTML('labeling');
container.innerHTML = html;
```

### `showToast(message)`
```javascript
showToast('Submitted: Region');
```

### Event Listeners
- Global app toasts: `window.addEventListener('app-toast', ...)`
- Task completion: `window.addEventListener('task-completed', ...)`
- Landing button: Delegated click on `#start-tasks-btn`

## 🚀 Performance Notes

- Pages are loaded on-demand (lazy loading)
- Minimal bundle size
- No build process required
- Direct browser ES6 module support
- Efficient event cleanup prevents memory leaks

## ♻️ Migration from Old Code

Old modules (in `modules/`) are kept for reference but superseded:
- `region_locator.js` → `controllers/region-locator.js`
- `labeling.js` → `controllers/labeling.js`
- `property_identifier.js` → `controllers/property-identifier.js`
- `similarity.js` → `controllers/similarity-labeling.js`

Old styles are consolidated:
- `styles.css` → `styles/`
- `spa.css` → `styles/`

## 📋 Checklist for Maintenance

- [ ] Update `fetchTasksFromApi()` for new task sequences
- [ ] Add page to `pages/`
- [ ] Create controller in `modules/controllers/`
- [ ] Register in `taskControllers` object
- [ ] Add styles to `styles/pages.css` or `styles/components.css`
- [ ] Test with `npm run serve` or local HTTP server
- [ ] Verify responsive behavior
- [ ] Check event cleanup in controller

## 🐛 Debugging

### Check Page Loading
Open browser DevTools Console:
```javascript
// Should load the page HTML
fetch('./pages/labeling.html').then(r => r.text()).then(t => console.log(t))
```

### Monitor Storage
```javascript
storage.subscribe((results) => console.log('Results:', results));
```

### Verify Controller Initialization
Add console logs in controller `init()` function:
```javascript
console.log('Labeling controller initialized');
```

## 📚 Additional Resources

- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [CSS Modules Pattern](https://css-tricks.com/css-modules/)
- [Single Page Application Architecture](https://en.wikipedia.org/wiki/Single-page_application)

---

**Version:** 2.0 (Refactored)  
**Last Updated:** January 2026
