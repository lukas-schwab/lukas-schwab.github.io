import { storage } from './modules/storage.js';
import { RegionLocatorController } from './modules/controllers/region-locator.js';
import { LabelingController } from './modules/controllers/labeling.js';
import { PropertyIdentifierController } from './modules/controllers/similarity.js';
import { SimilarityLabelingController } from './modules/controllers/similarity-labeling.js';
import { loadPageHTML } from './modules/utils.js';
import { applyTranslations, t, getUserLanguage, setUserLanguage } from './modules/i18n.js';
import { COOLDOWN } from './modules/constants.js';

const taskControllers = {
    image_region_locator: { controller: RegionLocatorController, page: 'region-locator' },
    labeling: { controller: LabelingController, page: 'labeling' },
    property_identifier: { controller: PropertyIdentifierController, page: 'property-identifier' },
    similarity_labeling: { controller: SimilarityLabelingController, page: 'similarity-labeling' }
};

const elements = {
    taskContainer: document.getElementById('task-container'),
    resultsDisplay: document.getElementById('results-display'),
    clearStorage: document.getElementById('clearStorage'),
    downloadResults: document.getElementById('downloadResults'),
    toastContainer: document.getElementById('toast-container'),
    storageView: document.getElementById('storage-view')
};

let currentCleanup = null;
let currentTaskIndex = 0;
let taskList = [];
let tasksLoaded = false;

// Batch Configuration
const MAX_BATCHES = 4;
let currentBatchCount = 1;
let nextBatchPromise = null;

// Cooldown functions removed as they are now in storage.js

// Function to fetch tasks from the API
async function fetchTasksFromApi() {
    if (storage.isCoolingDown()) return [];

    const userId = storage.getUserUuid();
    const url = `https://europe-west3-concept-interpretability-efded.cloudfunctions.net/get_tasks_batch?userId=${userId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tasks = await response.json();
        return tasks;
    } catch (error) {
        console.error('Could not fetch tasks:', error);
        return [];
    }
}

// Function to upload results to the API
async function uploadResultsToApi() {
    const results = storage.getResults();
    if (results.length === 0) return true;

    const url = 'https://europe-west3-concept-interpretability-efded.cloudfunctions.net/submit_results_batch';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error(`Upload failed! status: ${response.status}`);
        }

        // Clear local storage after successful upload of this batch
        storage.clear();
        return true;
    } catch (error) {
        console.error('Could not upload batch results:', error);
        return false;
    }
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
    }, COOLDOWN.TOAST_DURATION);
}

// Helper to update UI elements that depend on the task list
function updateUIWithTasks() {
    const card1Text = elements.taskContainer.querySelector('[data-i18n="landing.card1Text"]');
    if (card1Text) {
        const translatedText = t('landing.card1Text').replace('{count}', taskList.length);
        card1Text.textContent = translatedText;
    }
}

async function showLandingPage() {
    const landingHTML = await loadPageHTML('landing');
    elements.taskContainer.innerHTML = landingHTML;

    // Apply translations
    applyTranslations(elements.taskContainer);

    // Set initial task count if tasks are already loaded
    if (tasksLoaded) {
        updateUIWithTasks();
    }

    // Set up language toggle
    const languageToggle = document.getElementById('language-toggle');
    const langLabelEn = document.getElementById('lang-label-en');
    const langLabelDe = document.getElementById('lang-label-de');

    if (languageToggle && langLabelEn && langLabelDe) {
        // Set initial state based on current language
        const currentLang = getUserLanguage();
        languageToggle.checked = currentLang === 'de';
        langLabelEn.classList.toggle('active', currentLang === 'en');
        langLabelDe.classList.toggle('active', currentLang === 'de');

        // Add change event listener
        languageToggle.addEventListener('change', (e) => {
            const newLang = e.target.checked ? 'de' : 'en';
            setUserLanguage(newLang);

            // Update label states
            langLabelEn.classList.toggle('active', newLang === 'en');
            langLabelDe.classList.toggle('active', newLang === 'de');

            // Re-translate the task count
            if (tasksLoaded) {
                updateUIWithTasks();
            }
        });
    }

    // Add event listener to start button
    const startButton = document.getElementById('start-tasks-btn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (storage.isCoolingDown()) {
                showToast(t('messages.noMoreTasks'));
                return;
            }

            if (!tasksLoaded) {
                showToast(t('messages.loadingTasks'));
                return;
            }
            if (taskList.length === 0) {
                storage.setCooldown();
                showToast(t('messages.noMoreTasks'));
                return;
            }
            storage.markVisited();
            loadTask(0);
        });
    }
}

async function loadTask(index) {
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    if (index >= taskList.length) {
        // Current batch is finished. 
        // 1. Silent upload the current batch
        uploadResultsToApi().then(success => {
            if (!success) {
                showToast(t('messages.uploadFailedToast') || 'Connection error. Progress might not be saved.');
            }
        });

        // 2. Check if we have more batches to go
        if (currentBatchCount < MAX_BATCHES) {
            if (nextBatchPromise) {
                const nextTasks = await nextBatchPromise;
                if (nextTasks && nextTasks.length > 0) {
                    taskList = [...taskList, ...nextTasks];
                    currentBatchCount++;
                    nextBatchPromise = null;
                    // Proceed to first task of new batch
                    loadTask(index);
                    return;
                }
            }
            // If promise wasn't ready or failed, try fetching once more
            const nextTasks = await fetchTasksFromApi();
            if (nextTasks && nextTasks.length > 0) {
                taskList = [...taskList, ...nextTasks];
                currentBatchCount++;
                loadTask(index);
                return;
            }
        }

        // All batches completed
        elements.taskContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h1 data-i18n="completion.title">${t('completion.title')}</h1>
                <p data-i18n="completion.thanks">${t('completion.thanks')}</p>
                <button class="primary" id="more-tasks-btn" data-i18n="completion.moreTasksBtn">${t('completion.moreTasksBtn')}</button>
            </div>
        `;

        // Apply translations to the newly added content
        applyTranslations(elements.taskContainer);

        const moreTasksBtn = document.getElementById('more-tasks-btn');
        if (moreTasksBtn) {
            moreTasksBtn.addEventListener('click', async () => {
                if (storage.isCoolingDown()) {
                    showToast(t('messages.noMoreTasks'));
                    return;
                }

                moreTasksBtn.disabled = true;
                const originalText = moreTasksBtn.textContent;
                moreTasksBtn.textContent = t('messages.loadingTasks');

                const nextTasks = await fetchTasksFromApi();
                if (nextTasks && nextTasks.length > 0) {
                    taskList = nextTasks;
                    currentBatchCount = 1;
                    nextBatchPromise = null;
                    loadTask(0);
                } else {
                    storage.setCooldown();
                    showToast(t('messages.noMoreTasks'));
                    moreTasksBtn.disabled = false;
                    moreTasksBtn.textContent = originalText;
                }
            });
        }
        return;
    }

    // Pre-fetch the NEXT batch when the user starts the LAST task of the current batch
    const currentBatchLastIndex = taskList.length - 1;
    if (index === currentBatchLastIndex && currentBatchCount < MAX_BATCHES && !nextBatchPromise) {
        console.log(`Pre-fetching batch ${currentBatchCount + 1}...`);
        nextBatchPromise = fetchTasksFromApi();
    }

    // Hide results when entering a task
    if (elements.storageView) {
        elements.storageView.style.display = 'none';
    }

    const taskConfig = taskList[index];
    const taskMeta = taskControllers[taskConfig.type];

    if (!taskMeta) {
        console.error(`Task type ${taskConfig.type} not found`);
        return;
    }

    // Load and render page HTML
    const pageHTML = await loadPageHTML(taskMeta.page);
    elements.taskContainer.innerHTML = pageHTML;

    // Apply translations to the loaded content
    applyTranslations(elements.taskContainer);

    window.scrollTo(0, 0);

    // Initialize task controller
    currentCleanup = taskMeta.controller.init(elements.taskContainer, taskConfig);
    currentTaskIndex = index;
}

// Listen for task completion signal from storage
window.addEventListener('task-completed', () => {
    setTimeout(() => {
        currentTaskIndex++;
        loadTask(currentTaskIndex);
    }, 250); // Small delay to let user see "Submitted" toast
});

// Global Event Listeners
window.addEventListener('app-toast', (e) => {
    showToast(e.detail);
});

// Delegate landing page button click
document.addEventListener('click', (e) => {
    // If we need any other global event delegation, it would go here
});

elements.clearStorage.addEventListener('click', () => {
    if (confirm(t('messages.clearConfirm'))) {
        storage.clear();
        showToast(t('messages.storageCleared'));
    }
});

elements.downloadResults.addEventListener('click', () => {
    storage.downloadResults();
    showToast(t('messages.downloadStarted'));
});

// Subscribe to storage updates
storage.subscribe((results) => {
    elements.resultsDisplay.textContent = JSON.stringify(results, null, 2);
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    // Set HTML lang attribute based on user's browser language
    document.documentElement.lang = getUserLanguage();

    // Apply translations to static elements (like storage view)
    applyTranslations();

    storage.getGroupIdentifier();
    storage.getUserUuid();
    window.history.pushState({}, document.title, "/");

    // Start showing landing page immediately
    const landingPromise = showLandingPage();

    // Fetch task sequence from API in the background
    fetchTasksFromApi().then(tasks => {
        taskList = tasks;
        tasksLoaded = true;
        updateUIWithTasks();
    });

    await landingPromise;
});
