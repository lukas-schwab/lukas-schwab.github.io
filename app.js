import { storage } from './modules/storage.js';
import { RegionLocatorController } from './modules/controllers/region-locator.js';
import { LabelingController } from './modules/controllers/labeling.js';
import { PropertyIdentifierController } from './modules/controllers/property-identifier.js';
import { SimilarityLabelingController } from './modules/controllers/similarity-labeling.js';
import { loadPageHTML } from './modules/utils.js';
import { applyTranslations, t, getUserLanguage, setUserLanguage } from './modules/i18n.js';
import { COOLDOWN } from './modules/constants.js';


// Fix for mobile viewport height (handles address bar showing/hiding)
// This is particularly important for Android Chrome/Brave
let lastHeight = 0;

// Reset function to clear the tracked height (call when loading new content)
function resetViewportHeight() {
    lastHeight = 0;
    console.log('Viewport height tracking reset');
}

function setViewportHeight() {
    // Use visualViewport API if available (better for mobile)
    let height = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    // On Android, we want to use the LARGEST height we've seen
    // This prevents layout shift when the address bar hides
    if (height > lastHeight) {
        lastHeight = height;
    }

    const vh = lastHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Debug log for testing
    console.log(`Viewport height set: ${lastHeight}px (${vh}px per vh unit)`);
}

// Update on load, resize, scroll, and orientation change
let resizeTimer;
function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        requestAnimationFrame(setViewportHeight);
    }, 50);
}

// Initial call
setViewportHeight();

// Listen to multiple events for better coverage
window.addEventListener('resize', handleResize);
window.addEventListener('scroll', handleResize, { passive: true });
window.addEventListener('orientationchange', () => {
    lastHeight = 0; // Reset on orientation change
    setTimeout(setViewportHeight, 100);
});

// Use visualViewport events if available (modern browsers)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
}

// Android-specific: Recalculate on touch (when user starts scrolling)
document.addEventListener('touchstart', () => {
    requestAnimationFrame(setViewportHeight);
}, { passive: true, once: false });

// Recalculate after page is fully loaded (Android address bar settles)
window.addEventListener('load', () => {
    setTimeout(setViewportHeight, 100);
    setTimeout(setViewportHeight, 300);
    setTimeout(setViewportHeight, 500);
});

// Recalculate when page becomes visible (user returns from another tab/app)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setTimeout(setViewportHeight, 100);
    }
});

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
let currentBatchCount = 0;
const MAX_BATCHES = 4;
let taskStartTime = null;

// Expose taskStartTime getter globally for controllers
window.getTaskStartTime = () => taskStartTime;

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

    // Reset and recalculate viewport height
    resetViewportHeight();
    requestAnimationFrame(() => {
        setViewportHeight();
        setTimeout(setViewportHeight, 100);
    });

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
        startButton.addEventListener('click', async () => {
            if (storage.isCoolingDown()) {
                showToast(t('messages.noMoreTasks'));
                return;
            }

            if (!tasksLoaded) {
                const tasks = await fetchTasksFromApi();
                taskList = tasks;
                tasksLoaded = true;
                currentBatchCount = tasks.length > 0 ? 1 : 0;
                updateUIWithTasks();
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
        // Upload and next-batch fetching happen sequentially on task completion.

        // All batches completed
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('group', 'referral');
        elements.taskContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h1 data-i18n="completion.title">${t('completion.title')}</h1>
                <p data-i18n="completion.thanks">${t('completion.thanks')}</p>
                <button class="primary" id="more-tasks-btn" data-i18n="completion.moreTasksBtn" style="display: none !important;">${t('completion.moreTasksBtn')}</button>
                
                <div style="margin-top: 3rem; padding: 1.5rem; border-radius: 8px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <h3 style="margin-top: 0; margin-bottom: 0.5rem;" data-i18n="completion.shareTitle">${t('completion.shareTitle')}</h3>
                    <p style="font-size: 0.9rem; margin-bottom: 1rem;" data-i18n="completion.shareDescription">${t('completion.shareDescription')}</p>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="text" id="share-link-input" value="${shareUrl}" readonly style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">
                        <button class="primary" id="copy-link-btn" data-i18n="completion.copyBtn">${t('completion.copyBtn')}</button>
                    </div>
                </div>
            </div>
            <footer class="landing-footer">
                <div class="footer-content">
                    <div class="footer-section">
                        <h4 data-i18n="landing.footerContactTitle">${t('landing.footerContactTitle')}</h4>
                        <a href="mailto:lschwab@stud.hs-offenburg.de" class="footer-link">lschwab@stud.hs-offenburg.de</a>
                    </div>
                    <div class="footer-divider"></div>
                    <div class="footer-section">
                        <h4 data-i18n="landing.footerOrgTitle">${t('landing.footerOrgTitle')}</h4>
                        <p data-i18n="landing.footerOrgName">${t('landing.footerOrgName')}</p>
                    </div>
                </div>
            </footer>
        `;

        // Apply translations to the newly added content
        applyTranslations(elements.taskContainer);

        // Reset and recalculate viewport height for completion page
        resetViewportHeight();
        requestAnimationFrame(() => {
            setViewportHeight();
            setTimeout(setViewportHeight, 100);
        });

        // Copy link button handler
        const copyLinkBtn = document.getElementById('copy-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', async () => {
                const shareInput = document.getElementById('share-link-input');
                try {
                    await navigator.clipboard.writeText(shareInput.value);
                    const originalText = copyLinkBtn.textContent;
                    copyLinkBtn.textContent = t('completion.copiedBtn');
                    copyLinkBtn.style.backgroundColor = '#4caf50';
                    setTimeout(() => {
                        copyLinkBtn.textContent = originalText;
                        copyLinkBtn.style.backgroundColor = '';
                    }, 2000);
                } catch (err) {
                    // Fallback for older browsers
                    shareInput.select();
                    document.execCommand('copy');
                }
            });
        }

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
                    tasksLoaded = true;
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

    // No prefetching: only fetch tasks when a user clicks a button

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

    // Reset and recalculate viewport height for new task
    resetViewportHeight();
    // Recalculate immediately and after DOM settles
    requestAnimationFrame(() => {
        setViewportHeight();
        setTimeout(setViewportHeight, 100);
        setTimeout(setViewportHeight, 300);
    });

    // Initialize task controller
    currentCleanup = taskMeta.controller.init(elements.taskContainer, taskConfig);
    currentTaskIndex = index;
    
    // Record task start time
    taskStartTime = Date.now();
}

// Listen for task completion signal from storage
window.addEventListener('task-completed', async () => {
    const isEndOfBatch = currentTaskIndex === taskList.length - 1;

    if (isEndOfBatch) {
        const uploadSuccess = await uploadResultsToApi();
        if (!uploadSuccess) {
            showToast(t('messages.uploadFailedToast') || 'Connection error. Progress might not be saved.');
        }

        if (currentBatchCount < MAX_BATCHES) {
            const nextTasks = await fetchTasksFromApi();
            if (nextTasks && nextTasks.length > 0) {
                taskList = [...taskList, ...nextTasks];
                currentBatchCount++;
                tasksLoaded = true;
            } else {
                storage.setCooldown();
                showToast(t('messages.noMoreTasks'));
            }
        }
    }

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

    await landingPromise;
});
