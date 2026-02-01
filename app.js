import { storage } from './modules/storage.js';
import { RegionLocatorController } from './modules/controllers/region-locator.js';
import { LabelingController } from './modules/controllers/labeling.js';
import { PropertyIdentifierController } from './modules/controllers/similarity.js';
import { SimilarityLabelingController } from './modules/controllers/similarity-labeling.js';
import { loadPageHTML } from './modules/utils.js';
import { applyTranslations, t, getUserLanguage, setUserLanguage } from './modules/i18n.js';

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

// Dummy function that acts like it receives a JSON from an API
async function fetchTasksFromApi() {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    type: 'property_identifier',
                    assets: {
                        img: 'assets/patches/patch_3_0.png'
                    }
                },
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
                        img: 'assets/concepts/concept_0.png'
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
        }, 1);
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

async function showLandingPage() {
    const landingHTML = await loadPageHTML('landing');
    elements.taskContainer.innerHTML = landingHTML;

    // Apply translations
    applyTranslations(elements.taskContainer);

    // Set task count with proper translation
    const taskCount = document.getElementById('taskCount');
    const card1Text = elements.taskContainer.querySelector('[data-i18n="landing.card1Text"]');
    if (taskCount && card1Text) {
        const translatedText = t('landing.card1Text').replace('{count}', taskList.length);
        card1Text.textContent = translatedText;
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
            if (taskCount && card1Text) {
                const translatedText = t('landing.card1Text').replace('{count}', taskList.length);
                card1Text.textContent = translatedText;
            }
        });
    }

    // Add event listener to start button
    const startButton = document.getElementById('start-tasks-btn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            storage.markVisited();
            loadTask(0);
        });
    }
}

async function loadTask(index) {
    if (index >= taskList.length) {
        elements.taskContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h1 data-i18n="completion.title">${t('completion.title')}</h1>
                <p data-i18n="completion.thanks">${t('completion.thanks')}</p>
                <button class="primary" onclick="location.reload()" data-i18n="completion.restartBtn">${t('completion.restartBtn')}</button>
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
    currentCleanup = taskMeta.controller.init(elements.taskContainer, taskConfig.assets);
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
    if (e.target.id === 'start-tasks-btn') {
        storage.markVisited();
        loadTask(0);
    }
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

    // Fetch task sequence from dummy API
    taskList = await fetchTasksFromApi();
    tasksLoaded = true;
    
    // always show landing page
    showLandingPage();
});
