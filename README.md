# Concept Interpretability Study - Refactored

A modern, maintainable single-page application for conducting human perception research on machine learning interpretability. Features real HTML pages, modular controllers, organized styling, API integration, and network-aware image prefetching.

**Purpose:** To investigate whether technical metrics used to evaluate visual concepts extracted from neural networks align with human perception.

## 📁 Project Structure

```
lukas-schwab.github.io/
├── index.html                           # Main entry point
├── app.js                               # Application controller & router
├── modules/                             # Core application logic
│   ├── constants.js                     # Application-wide constants
│   ├── storage.js                       # Data persistence & local storage
│   ├── i18n.js                          # Internationalization (EN/DE)
│   ├── utils.js                         # Shared utilities
│   ├── controllers/                     # Task-specific controllers
│   │   ├── region-locator.js            # Region drawing logic
│   │   ├── labeling.js                  # Image labeling logic
│   │   ├── property-identifier.js       # Property marking logic
│   │   ├── similarity-labeling.js       # Similarity rating logic
│   │   └── completion.js                # Study completion handlers
│   └── app/                             # Application services & state
│       ├── config/
│       │   └── task-registry.js         # Task definitions & controller mappings
│       ├── services/
│       │   ├── task-api.js              # API handlers for tasks & results
│       │   └── image-prefetch.js        # Network-aware image prefetching
│       └── state/
│           └── runtime-state.js         # Runtime application state
├── pages/                               # HTML page templates
│   ├── landing.html                     # Study introduction & info
│   ├── region-locator.html              # Draw boundaries on images task
│   ├── labeling.html                    # Classify image content task
│   ├── property-identifier.html         # Click properties on objects task
│   ├── similarity-labeling.html         # Rate image pair similarity task
│   └── completion.html                  # Study completion & feedback page
├── styles/                              # Organized stylesheets
│   ├── main.css                         # Master entry point (imports all)
│   ├── components.css                   # UI components (buttons, inputs, cards)
│   ├── pages.css                        # Page layouts & page-specific styles
│   ├── layout.css                       # Grid and structural layout
│   └── responsive.css                   # Media queries & responsive design
├── assets/                              # High-resolution study images
│   ├── concepts/                        # Concept demonstration images
│   ├── patches/                         # Example patches for tasks
│   ├── targets/                         # Target images for tasks
│   └── dummy/                           # Dummy task images for testing flow
├── assets_low_res/                      # Assets that were constructed with an outdated method
└── assets_test/                         # Subset for testing (faster CI/development)
```


## 🎯 Key Architecture Improvements

### 1. **Real HTML Pages**
- HTML markup extracted from JavaScript strings into separate `.html` files
- Pages stored in `/pages` directory for better maintainability
- Pages loaded dynamically at runtime with `loadPageHTML()`
- Easier to visualize and modify markup structure

### 2. **Modular Controller Architecture**
- Clean separation of concerns between UI markup and logic
- Controllers in `/modules/controllers/` contain only business logic
- Controllers receive container element and task data
- Returns cleanup function for proper event listener teardown and memory management

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
    init: (container, data = {}) => {
        // Set up DOM elements and event listeners
        return () => { /* cleanup */ }
    }
}
```

### 3. **Organized Stylesheets**
- Styles split into logical, reusable modules
- Master entry point: `styles/main.css` imports all
- Component styles: `styles/components.css`
- Page-specific layouts: `styles/pages.css`
- Responsive design: `styles/responsive.css`
- Easier to locate and modify styles without affecting other pages

### 4. **API Integration**
- Server-side task fetching with `fetchTasksFromApi()` in `/modules/app/services/task-api.js`
- Result/feedback submission to cloud backend
- User UUID tracking across sessions
- Group identifier support for study cohorts
- Cooldown management to prevent API spam (1 hour between task batch fetches)

### 5. **Network-Aware Image Prefetching**
- Intelligent image preloading based on network conditions
- Adjusts concurrent prefetches based on connection type:
  - 2G/SaveData: 1 concurrent prefetch
  - 3G: 2 concurrent prefetches
  - 4G/5G/Unknown: 4 concurrent prefetches
- Prevents redundant prefetches with request deduplication

### 6. **Runtime State Management**
- Centralized app state in `modules/app/state/runtime-state.js`
- Tracks: current task index, task list, user progress, batch count, batch loading promise
- Manages task completion timing and result aggregation
- Supports multi-batch workflows with progress updates

### 7. **Internationalization (EN/DE)**
- Automatic language detection from `navigator.language`
- Falls back to English if language not supported
- All UI text centralized in `modules/i18n.js`
- Easy to add new languages by extending translation objects
- Support for HTML attributes: `data-i18n` and `data-i18n-placeholder`

### 8. **Shared Utilities** (`modules/utils.js`)
- `loadPageHTML(pageName)` - fetch and cache page templates
- `showToast(message, duration)` - display notifications
- `debounce()`, `deepClone()` - common helper functions
- Event utilities for toast broadcasting

## 🚀 Complete Task Flow

### Prerequisites
- Modern web browser (ES6+ support)
- Local HTTP server (required for CORS when loading pages and API calls)

### Setup
1. Clone the repository
2. Run a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. Open `http://localhost:8000` in your browser (or your configured port)

### Complete User Flow
```
1. User opens → index.html loads
   ↓
2. Landing page loads → "Begin Study" button
   ↓
3. API fetches first task batch (if available)
   ↓
4. Image prefetching starts (network-aware concurrency)
   ↓
5. First task loads + controller initializes
   ├─ Region Locator → user draws boundaries
   ├─ Labeling → user classifies content
   ├─ Property Identifier → user clicks properties
   └─ Similarity Labeling → user rates similarity
   ↓
6. On task completion → result saved locally
   ├─ Save to localStorage
   ├─ Dispatch 'task-completed' event
   └─ Schedule async upload to API (non-blocking)
   ↓
7. Load next task or show completion page
   ↓
8. Completion page displayed
   ├─ Show progress / tasks completed
   ├─ Optional: Load more task batches
   ├─ Optional: Provide feedback
   └─ Optional: Share study link
```

### Task Batch & Cooldown System

**Initial Load:**
- First batch of tasks fetched when study begins
- Image prefetching starts with network-aware concurrency
- Tasks queued in `runtimeState.taskList`

**Between Batches:**
- After completing final task in batch, user sees completion page
- User can click "More Tasks" to fetch next batch
- Cooldown enforced: 1 hour between batch fetches (configurable in `COOLDOWN.TASK_FETCH`)
- If cooldown active: toast message displayed instead

**Background Upload:**
- Results uploaded asynchronously to avoid blocking UI
- New batch fetching waits for previous upload to complete
- Allows up to 5 batch fetches to be started (limit prevents excessive API calls)

## 📝 Adding a New Task

### 1. Create the HTML Page
Create `pages/my-task.html`:
```html
<header>
    <h1 data-i18n="myTask.title">Task Title</h1>
    <p class="lead" data-i18n="myTask.description">Task description</p>
</header>

<section class="my-task-container">
    <img id="taskImage" alt="Task image">
    <button id="submitBtn" class="primary" data-i18n="actions.submit">Submit</button>
</section>
```

### 2. Create the Controller
Create `modules/controllers/my-task.js`:
```javascript
export const MyTaskController = {
    init: (container, data = {}) => {
        const image = container.querySelector('#taskImage');
        const submitBtn = container.querySelector('#submitBtn');
        
        if (image) image.src = data.img || 'assets/default.png';

        const handleSubmit = () => {
            // Collect results from UI
            const results = { /* collect user interaction data */ };
            
            // Dispatch custom event for the app to handle
            window.dispatchEvent(new CustomEvent('task-completed', {
                detail: { taskType: 'my_task', results }
            }));
        };

        submitBtn.addEventListener('click', handleSubmit);

        // Return cleanup function to be called when task unloads
        return () => {
            submitBtn.removeEventListener('click', handleSubmit);
        };
    }
};
```

### 3. Register in Task Registry
Update `modules/app/config/task-registry.js`:
```javascript
import { MyTaskController } from '../../controllers/my-task.js';

export const taskControllers = {
    // ... existing tasks
    my_task: { controller: MyTaskController, page: 'my-task' }
};

export const DUMMY_TASKS = {
    // ... existing dummy tasks
    my_task: {
        type: 'my_task',
        isDummy: true,
        assets: {
            img: 'assets/dummy/my-task-demo.png'
        }
    }
};
```

### 4. Add Images to Assets
- Place task images in `assets/` (and optionally `assets_low_res/` for mobile)
- Place dummy/test images in `assets/dummy/`
- Image paths referenced in `fetchTasksFromApi()` response

### 5. Add Translations
Update `modules/i18n.js` to add EN/DE text:
```javascript
export const translations = {
    en: {
        myTask: {
            title: 'My Task Title',
            description: 'Task description text'
        }
    },
    de: {
        myTask: {
            title: 'Mein Aufgabentitel',
            description: 'Aufgabenbeschreibung'
        }
    }
};
```

## 🎨 Styling Guidelines

### Component-Based CSS Organization
- **components.css**: Reusable UI components (buttons, inputs, cards, markers, toasts)
- **pages.css**: Page-specific layouts and task-container styles
- **responsive.css**: Breakpoints and media queries for all screen sizes
- **layout.css**: Grid system and structural elements

### Common CSS Classes
- `.primary`, `.secondary` - Button variants
- `.imgwrap` - Image containers
- `.target-wrap` - Interactive image areas
- `.actions` - Button group containers
- `.status` - Status messages
- `.toast` - Toast notifications
- `.card` - Card component

### Adding Page-Specific Styles
1. Add styles to `styles/pages.css` under a page-specific selector
2. Use BEM naming: `.my-task-container`, `.my-task-container__element`
3. Add responsive breakpoints in `styles/responsive.css`
4. Reference main entry point `styles/main.css`

Example:
```css
.my-task-container {
    display: grid;
    gap: 1rem;
}

.my-task-container__image {
    width: 100%;
    border-radius: 8px;
}

@media (max-width: 768px) {
    .my-task-container {
        gap: 0.5rem;
    }
}
```

## 💾 Data Storage & Persistence

### Local Storage
All completed tasks are stored in browser's `localStorage` under key `'suite_results'`:
```javascript
// Retrieve stored results
const results = storage.getResults();

// Subscribe to result changes
storage.subscribe((results) => {
    console.log('Results updated:', results);
});

// Download as JSON
storage.downloadResults(); // Downloads: suite_results.json
```

### Result Entry Structure
```javascript
{
    taskId: "unique-task-id",          // Task identifier from API
    taskType: "labeling",               // Type of task (from taskControllers)
    timestamp: "2026-03-09T...",        // ISO timestamp of completion
    groupIdentifier: "group-123",       // Study cohort (from URL or localStorage)
    userUuid: "uuid-string",            // Unique user identifier
    assets: { img: "path/to/image" },  // Task image references
    data: { /* user interaction */ },  // Task-specific results
    isDummy: false,                     // Whether this was a test/dummy task
    timeTakenMs: 45000                  // Time spent on task (if tracked)
}
```

### API Integration

**Task Fetching** (`modules/app/services/task-api.js`):
```javascript
// API endpoint
https://europe-west3-concept-interpretability-efded.cloudfunctions.net/get_tasks_batch

// Request params
?userId={userUuid}

// Response format
{
    tasks: [ /* array of task objects */ ],
    userProgress: { /* progress metadata */ }
}
```

**Results Upload**:
```javascript
// API endpoint
POST https://europe-west3-concept-interpretability-efded.cloudfunctions.net/submit_results_batch

// Payload: Array of result objects from localStorage
[{ taskId, taskType, timestamp, ... }, ...]
```

**Feedback Submission**:
```javascript
// API endpoint
POST https://europe-west3-concept-interpretability-efded.cloudfunctions.net/submit_feedback

// Payload
{ userId, feedback: "User's feedback text" }
```

### Constants Configuration
Modify timings in `modules/constants.js`:
```javascript
export const COOLDOWN = {
    BUTTON: 2000,           // 2 seconds - button submission cooldown
    TASK_FETCH: 3600000,    // 1 hour - between task batch fetches
    TOAST_DURATION: 3000    // 3 seconds - toast display time
};

export const INTERACTION = {
    MIN_DRAW_DURATION: 200,  // Minimum drawing interaction time
    MIN_DRAW_POINTS: 5       // Minimum points for valid drawing
};

export const DRAWING_STYLE = {
    strokeColor: '#ff4757',
    lineWidth: 3,
    shadowBlur: 10,
    shadowColor: 'rgba(255, 71, 87, 0.8)',
    fillOpacity: 0.2
};

export const USE_BROWSER_LANG = false;  // Override: force EN/DE detection
```

## 🖼️ Image Management

### Prefetching Strategy
Images are preloaded intelligently based on network conditions:

1. **Network Detection** (from Navigator Connection API):
   - Detects: 2G, 3G, 4G, 5G, or unknown
   - Respects: Data saver mode if enabled

2. **Concurrent Prefetch Limits**:
   - 2G or SaveData: 1 concurrent image
   - 3G: 2 concurrent images
   - 4G/5G/Unknown: 4 concurrent images

3. **Prefetch Queuing**:
   - Dual task batch prefetching (current + next batch)
   - Dummy image prefetching before study starts
   - Deduplication prevents redundant loads

### Asset Variants
- **`assets/`**: High-resolution images (original quality)
- **`assets_low_res/`**: Low-resolution variants (for mobile/slow networks)
- **`assets_test/`**: Subset for testing (faster CI/development)

## 🔧 Core Utilities & APIs

### Document Loading: `modules/utils.js`

**`loadPageHTML(pageName)`**
```javascript
// Fetch and return HTML for a page template
const html = await loadPageHTML('labeling');
container.innerHTML = html;
// Pages cached after first load
```

**`showToast(message, duration = 3000)`**
```javascript
// Display a temporary notification toast
showToast('Task submitted!');
showToast('Error occurred', 5000); // Custom duration
```

**`debounce(func, wait)`**
```javascript
// Debounce function calls for performance
const handleResize = debounce(() => {
    calculateLayout();
}, 300);
window.addEventListener('resize', handleResize);
```

**`deepClone(obj)`**
```javascript
// Deep clone objects for state management
const backup = deepClone(runtimeState.taskList);
```

### Event System
```javascript
// Listen for task completions globally
window.addEventListener('task-completed', (e) => {
    console.log('Task finished:', e.detail.taskType);
});

// Dispatch custom toast events
window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { message: 'Custom notification' }
}));
```

### Storage Module: `modules/storage.js`

```javascript
import { storage } from './modules/storage.js';

// Save task result
storage.saveResult(
    taskId,           // Unique task identifier
    taskType,         // Task type (for API)
    resultData,       // User-collected data
    assetReferences,  // Original task images
    startTime,        // Task start timestamp (optional)
    isDummy           // Whether it's a dummy/test task
);

// Get all results
const allResults = storage.getResults();

// Monitor changes
storage.subscribe((results) => {
    updateUI(results);
});

// Manage cooldown
if (storage.isCoolingDown()) {
    showMessage('Please wait before fetching more tasks');
}

// Get identifiers
const userId = storage.getUserUuid();
const group = storage.getGroupIdentifier();

// Clear all local results
storage.clear();

// Download results as JSON file
storage.downloadResults();
```

### i18n Module: `modules/i18n.js`

```javascript
import { t, applyTranslations, getUserLanguage, setUserLanguage } from './modules/i18n.js';

// Get translated text
const title = t('labeling.instructionTitle');

// Apply translations to DOM
applyTranslations();

// Get current language
const lang = getUserLanguage(); // 'en' or 'de'

// Manually set language
setUserLanguage('de');

// HTML usage
// <h1 data-i18n="labeling.title">English title</h1>
// <input data-i18n-placeholder="labeling.placeholder" />
```

## 🚀 Performance Considerations

### Optimization Strategies
- **Lazy Page Loading**: Pages fetched only when needed
- **Image Prefetching**: Network-aware concurrent image loading
- **Efficient Event Cleanup**: Controllers return cleanup functions preventing memory leaks
- **Result Batching**: Multiple results uploaded in single API call
- **No Build Process**: Direct ES6 module support - runs in browser as-is
- **Minimal Dependencies**: Pure JavaScript, no external libraries
- **Local Caching**: Pages and images cached after first fetch

### Performance Metrics to Monitor
- Page transition time (~200ms typical)
- Image prefetch success rate by network type
- Result upload latency
- Local storage size (results accumulate until cleared)

## 🛠️ Debugging Guide

### Enable Verbose Logging
Add to `app.js` before other code:
```javascript
const originalLog = console.log;
console.log = (...args) => {
    originalLog('[APP]', ...args);
};
```

### Monitor Task Completion
```javascript
// In browser console
window.addEventListener('task-completed', (e) => {
    console.log('Task completed:', e.detail);
});

// Inspect stored results
storage.getResults();

// Watch for result updates
storage.subscribe((results) => {
    console.log('Results changed, count:', results.length);
});
```

### Check API Connectivity
```javascript
// Test task fetching
try {
    const tasks = await fetchTasksFromApi();
    console.log('Fetched tasks:', tasks);
} catch(err) {
    console.error('Fetch failed:', err);
}

// Check Network Information API
const connection = navigator.connection || navigator.mozConnection;
console.log('Network type:', connection?.effectiveType);
console.log('Save data:', connection?.saveData);
```

### Verify Page Loading
```javascript
// Fetch a page directly
const html = await loadPageHTML('labeling');
console.log('Loaded HTML length:', html.length);
```

### Inspect Runtime State
```javascript
// View current app state
console.log('Runtime State:', runtimeState);
console.log('Current task:', runtimeState.taskList[runtimeState.currentTaskIndex]);
console.log('Task count:', runtimeState.batchCount);
```

### Monitor LocalStorage
```javascript
// View raw storage
console.log(localStorage.getItem('suite_results'));

// Parse and inspect
const results = JSON.parse(localStorage.getItem('suite_results') || '[]');
console.table(results.map(r => ({ type: r.taskType, time: r.timeTakenMs })));
```

## 📋 Maintenance Checklist

When updating the application:

- [ ] Update `modules/app/config/task-registry.js` for new/modified tasks
- [ ] Create/update HTML page in `pages/` directory
- [ ] Create/update controller in `modules/controllers/`
- [ ] Add or update styles in `styles/pages.css` (or appropriate style file)
- [ ] Add translations to `modules/i18n.js` for both EN and DE
- [ ] Test with low-res assets by changing `assets/` path to `assets_low_res/`
- [ ] Test on mobile device or use device emulation
- [ ] Verify responsive breakpoints in `styles/responsive.css`
- [ ] Test with network throttling (DevTools: Slow 3G/etc)
- [ ] Verify event cleanup in controller (no memory leaks)
- [ ] Check browser console for errors after each transition
- [ ] Test task result storage and download

## 🎓 Current Study Tasks

### 1. **Region Locator** (`image_region_locator`)
- User draws boundaries around regions of interest on an image
- Collects: boundary coordinates, drawing time
- Page: `pages/region-locator.html`
- Controller: `modules/controllers/region-locator.js`

### 2. **Labeling** (`labeling`)
- User classifies or labels image content
- Collects: selected labels/classifications
- Page: `pages/labeling.html`
- Controller: `modules/controllers/labeling.js`

### 3. **Property Identifier** (`property_identifier`)
- User clicks on properties or features within an image
- Collects: clicked coordinates and property types
- Page: `pages/property-identifier.html`
- Controller: `modules/controllers/property-identifier.js`

### 4. **Similarity Labeling** (`similarity_labeling`)
- User rates how similar two images are using a slider
- Collects: similarity score, rating time
- Page: `pages/similarity-labeling.html`
- Controller: `modules/controllers/similarity-labeling.js`

### 5. **Completion** (Special Page)
- Shows after all tasks completed
- Allows fetching more task batches
- Collects optional feedback
- Displays shareable study link
- Page: `pages/completion.html`

## 🌐 Internationalization (i18n)

### Supported Languages
- **English** (en) - Default fallback
- **German** (de) - Active if browser language is detected as German

### How to Add New Language

1. Add language object to `modules/i18n.js`:
```javascript
export const translations = {
    en: { /* existing */ },
    de: { /* existing */ },
    fr: {  // New French translation
        common: {
            next: 'Suivant',
            back: 'Retour'
        },
        labeling: {
            title: 'Classification d\'image'
        }
        // ... all keys ...
    }
};
```

2. Update language detection in `modules/i18n.js`:
```javascript
const SUPPORTED_LANGUAGES = ['en', 'de', 'fr'];
```

3. Update HTML `lang` attribute as needed

## 📚 Additional Resources

- [MDN: LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Google: PageSpeed Insights](https://pagespeed.web.dev/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version:** 2.1  
**Last Updated:** March 2026  
**Repository:** lukas-schwab.github.io  
**License:** See LICENSE file
