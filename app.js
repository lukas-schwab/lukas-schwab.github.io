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

// Dummy function that acts like it receives a JSON from an API
async function fetchTasksFromApi() {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    type: 'image_region_locator',
                    assets: {
                        imgA: 'assets/reference_object_a.png',
                        imgB: 'assets/target_scene_b.png'
                    }
                },
                {
                    type: 'labeling',
                    assets: {
                        img: 'assets/reference_object_a.png'
                    }
                },
                {
                    type: 'property_identifier',
                    assets: {
                        img: 'assets/target_scene_b.png'
                    }
                },
                {
                    type: 'similarity_labeling',
                    assets: {
                        imgA: 'assets/reference_object_a.png',
                        imgB: 'assets/target_scene_b.png'
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
    loadTask(0);
});
