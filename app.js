import { storage } from './modules/storage.js';
import { RegionLocator } from './modules/region_locator.js';
import { Labeling } from './modules/labeling.js';
import { PropertyIdentifier } from './modules/property_identifier.js';
import { SimilarityLabeling } from './modules/similarity.js';

const tasks = {
    image_region_locator: RegionLocator,
    labeling: Labeling,
    property_identifier: PropertyIdentifier,
    similarity_labeling: SimilarityLabeling
};

const elements = {
    taskContainer: document.getElementById('task-container'),
    resultsDisplay: document.getElementById('results-display'),
    clearStorage: document.getElementById('clearStorage'),
    downloadResults: document.getElementById('downloadResults'),
    navItems: document.querySelectorAll('.nav-item'),
    toastContainer: document.getElementById('toast-container'),
    storageView: document.getElementById('storage-view')
};

let currentCleanup = null;
let currentTaskIndex = 0;
let taskList = [];
let tasksLoaded = false;

// Dummy function that acts like it receives a JSON from an API
async function fetchTasksFromApi() {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    type: 'image_region_locator',
                    assets: {
                        imgA: 'assets/patches/patch_3_0.png',
                        imgB: 'assets/targets/img_0.png'
                    }
                },
                {
                    type: 'labeling',
                    assets: {
                        img: 'assets/patches/patch_3_0.png'
                    }
                },
                {
                    type: 'property_identifier',
                    assets: {
                        img: 'assets/targets/img_0.png'
                    }
                },
                {
                    type: 'similarity_labeling',
                    assets: {
                        imgA: 'assets/concepts/concept_0.png',
                        imgB: 'assets/concepts/concept_1.png'
                    }
                }
            ]);
        }, 500);
    });
}

function showToast(message) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

function showLandingPage() {
    elements.taskContainer.innerHTML = `
        <div class="landing-page">
            <div class="landing-hero">
                <div class="landing-badge">Research Study</div>
                <h1 class="landing-title">
                    <span class="gradient-text">Concept Interpretability</span>
                    Study
                </h1>
                <p class="landing-subtitle">
                    Help advance machine learning interpretability through human perception research
                </p>
            </div>

            <div class="landing-content">
                <div class="landing-cards">
                    <div class="landing-card">
                        <div class="card-icon">📋</div>
                        <h3>What to Expect</h3>
                        <p>Complete ${taskList.length} interactive tasks involving image analysis, region selection, labeling, and similarity comparison.</p>
                    </div>
                    <div class="landing-card">
                        <div class="card-icon">⏱️</div>
                        <h3>Time Commitment</h3>
                        <p>Approximately 5-10 minutes to complete all tasks at your own pace.</p>
                    </div>
                    <div class="landing-card">
                        <div class="card-icon">🔒</div>
                        <h3>Privacy First</h3>
                        <p>All data is fully pseudonymized. Only task responses are collected—no personal information.</p>
                    </div>
                </div>

                <div class="landing-features">
                    <div class="feature-item">
                        <span class="check-icon">✓</span>
                        <span>Progress automatically saved</span>
                    </div>
                    <div class="feature-item">
                        <span class="check-icon">✓</span>
                        <span>No registration required</span>
                    </div>
                    <div class="feature-item">
                        <span class="check-icon">✓</span>
                        <span>Mobile-friendly interface</span>
                    </div>
                </div>

                <button class="landing-start-btn" id="start-tasks-btn">
                    <span>Begin Study</span>
                    <span class="btn-arrow">→</span>
                </button>
            </div>
        </div>
    `;

    // Add event listener to start button
    const startButton = document.getElementById('start-tasks-btn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            storage.markVisited();
            loadTask(0);
        });
    }
}

function loadTask(index) {
    if (index >= taskList.length) {
        elements.taskContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h1>All tasks completed!</h1>
                <p>Thank you for your participation.</p>
                <button class="primary" onclick="location.reload()">Restart Sequence</button>
            </div>
        `;
        // Show results when all tasks are finished
        if (elements.storageView) {
            elements.storageView.style.display = 'block';
        }
        return;
    }

    if (currentCleanup) {
        currentCleanup();
    }

    // Hide results when entering a task
    if (elements.storageView) {
        elements.storageView.style.display = 'none';
    }

    const taskConfig = taskList[index];
    const taskModule = tasks[taskConfig.type];

    if (!taskModule) {
        console.error(`Task type ${taskConfig.type} not found`);
        return;
    }

    // Update active nav based on task type
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.task === taskConfig.type);
    });

    // Render task HTML with assets
    elements.taskContainer.innerHTML = taskModule.render(taskConfig.assets);

    // Initialize task logic with assets
    currentCleanup = taskModule.init(elements.taskContainer, taskConfig.assets);
    currentTaskIndex = index;
}

// Global Event Listeners
window.addEventListener('app-toast', (e) => {
    showToast(e.detail);
});

// Listen for task completion signal from storage
window.addEventListener('task-completed', () => {
    setTimeout(() => {
        currentTaskIndex++;
        loadTask(currentTaskIndex);
    }, 1500); // Small delay to let user see "Submitted" toast
});

elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
        const taskKey = item.dataset.task;
        // Manual override - find first task of this type in the list (optional behavior)
        const idx = taskList.findIndex(t => t.type === taskKey);
        if (idx !== -1 && idx !== currentTaskIndex) {
            loadTask(idx);
        }
    });
});

elements.clearStorage.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all collected results?')) {
        storage.clear();
        showToast('Storage cleared.');
    }
});

elements.downloadResults.addEventListener('click', () => {
    storage.downloadResults();
    showToast('Download started.');
});

// Subscribe to storage updates
storage.subscribe((results) => {
    elements.resultsDisplay.textContent = JSON.stringify(results, null, 2);
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    storage.getGroupIdentifier();
    storage.getUserUuid();
    window.history.pushState({}, document.title, "/");

    // Fetch task sequence from dummy API
    taskList = await fetchTasksFromApi();
    tasksLoaded = true;
    
    // Show landing page only if user hasn't visited before
    // if (storage.hasVisited()) {
    //     loadTask(0);
    // } else {
    //     showLandingPage();
    // }

    // always show landing page
    showLandingPage();
});