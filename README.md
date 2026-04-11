# Concept Interpretability Study

A single-page application for conducting human perception research on machine learning interpretability. This project investigates whether technical metrics used to evaluate visual concepts extracted from neural networks align with human perception.

**The study has finished, many thanks to everyone who participated!**

## 🚀 Quick Start

1. **Clone the repository.**
2. **Run a local HTTP server** (required for CORS):
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. **Open `http://localhost:8000`** in your browser.

## 📁 Project Structure

- `index.html`: Main entry point.
- `app.js`: Application controller and router.
- `modules/`: Core logic (controllers, services, state, and utilities).
- `pages/`: HTML templates for study tasks.
- `styles/`: Modular CSS organization.
- `assets/`: Study images and task resources.

## 🎯 Key Features

- **Modular Architecture**: Separate HTML templates and JS controllers for every task.
- **API Integration**: Server-side task fetching and asynchronous result submission.
- **Network-Aware Prefetching**: Intelligent image preloading based on connection quality.
- **Internationalization**: Multi-language support (EN/DE) with automatic detection.
- **Persistence**: Local storage caching with background sync to the cloud.

## 📝 Adding a New Task

1. **Template**: Create the task UI in `pages/my-task.html`.
2. **Controller**: Implement logic in `modules/controllers/my-task.js`.
3. **Registration**: Add the task to `modules/app/config/task-registry.js`.
4. **Localization**: Define strings in `modules/i18n.js`.

---

**Version:** 2.2  
**Repository:** [lukas-schwab.github.io](https://github.com/lukas-schwab/lukas-schwab.github.io)  
**License:** See LICENSE file

