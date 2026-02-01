/**
 * Internationalization module for bilingual support (English/German)
 */

const translations = {
    en: {
        // Landing Page
        landing: {
            badge: 'Research Study',
            titlePart1: 'Concept Interpretability',
            titlePart2: 'Study',
            subtitle: 'Help advance machine learning interpretability through human perception research',
            card1Title: 'What to Expect',
            card1Text: 'Complete interactive tasks involving image analysis, region selection, labeling, and similarity comparison.',
            card2Title: 'Time Commitment',
            card2Text: 'Approximately 5-10 minutes to complete all tasks at your own pace.',
            card3Title: 'Privacy First',
            card3Text: 'All data is fully pseudonymized. Only task responses are collected—no personal information.',
            startBtn: 'Begin Study'
        },
        // Labeling Page
        labeling: {
            title: 'Find a single word that you think fits these images.',
            subtitle: 'Please type something even if you are unsure about it.',
            placeholder: 'Enter label here...',
            submitBtn: 'Submit'
        },
        // Property Identifier Page
        propertyId: {
            title: 'Click on all the components you can identify in this image.',
            subtitle: 'A component can be a distinct object or a part of an object.',
            undoBtn: 'Undo Last Marker',
            submitBtn: 'Submit'
        },
        // Region Locator Page
        regionLocator: {
            title: 'Encircle image A in image B.',
            subtitle: 'Draw a boundary around the matching location on image B.',
            cardALabel: 'Image A (Reference)',
            cardBLabel: 'Image B (Draw here)',
            hintA: 'Target object to find',
            hintB: 'Click and drag to encircle',
            notFoundBtn: 'I do not see where image A is',
            submitBtn: 'Submit'
        },
        // Similarity Labeling Page
        similarity: {
            title: 'How similar are these two image groups to each other?',
            subtitle: 'Use the slider below to rank similarity from 1 (not similar) to 5 (identical).',
            sliderLeft: 'Not similar at all',
            sliderRight: 'Very similar',
            submitBtn: 'Submit'
        },
        // Completion Page
        completion: {
            title: 'All tasks completed!',
            thanks: 'Thank you for your participation.',
            restartBtn: 'Restart',
            uploading: 'Uploading results...',
            uploadFailed: 'Upload failed',
            retryBtn: 'Retry Upload',
            returnBtn: 'Return to Start'
        },
        // Storage View
        storage: {
            title: 'Collected Results',
            downloadBtn: 'Download JSON',
            clearBtn: 'Clear All',
            disclaimer: 'All information is pseudonymized.'
        },
        // Toasts/Messages
        messages: {
            storageCleared: 'Storage cleared.',
            downloadStarted: 'Download started.',
            clearConfirm: 'Are you sure you want to clear all collected results?',
            loadingTasks: 'Loading tasks, please wait...',
            uploadFailedToast: 'Upload error. Please contact the study administrator if this persists.'
        }
    },
    de: {
        // Landing Page
        landing: {
            badge: 'Research Study',
            titlePart1: 'Concept Interpretability',
            titlePart2: ' ',
            subtitle: 'Hilf uns dabei, maschinelles Lernen besser zu verstehen – durch deine Wahrnehmung',
            card1Title: 'Was dich erwartet',
            card1Text: 'Du absolvierst interaktive Aufgaben: Bilder analysieren, Bereiche auswählen, beschriften und vergleichen.',
            card2Title: 'Zeitaufwand',
            card2Text: 'Etwa 5-10 Minuten – ganz in deinem eigenen Tempo.',
            card3Title: 'Deine Privatsphäre',
            card3Text: 'Alle Daten sind vollständig pseudonymisiert. Wir sammeln nur deine Aufgabenlösungen – keine persönlichen Infos.',
            startBtn: 'Los geht\'s'
        },
        // Labeling Page
        labeling: {
            title: 'Finde ein einzelnes Wort, das zu diesen Bildern passt.',
            subtitle: 'Gib gerne etwas ein, auch wenn du dir nicht ganz sicher bist.',
            placeholder: 'Deine Bezeichnung...',
            submitBtn: 'Absenden'
        },
        // Property Identifier Page
        propertyId: {
            title: 'Klicke auf alle Komponenten, die du in diesem Bild erkennen kannst.',
            subtitle: 'Eine Komponente kann ein Objekt oder ein Teil eines Objekts sein.',
            undoBtn: 'Letzte Markierung rückgängig',
            submitBtn: 'Absenden'
        },
        // Region Locator Page
        regionLocator: {
            title: 'Umkreise Bild A in Bild B.',
            subtitle: 'Zeichne eine Grenze um die entsprechende Stelle in Bild B.',
            cardALabel: 'Bild A (Vorlage)',
            cardBLabel: 'Bild B (Hier zeichnen)',
            hintA: 'Das zu findende Objekt',
            hintB: 'Klicken und ziehen zum Umkreisen',
            notFoundBtn: 'Ich sehe Bild A nicht',
            submitBtn: 'Absenden'
        },
        // Similarity Labeling Page
        similarity: {
            title: 'Wie ähnlich sind diese beiden Bildgruppen?',
            subtitle: 'Nutze den Schieberegler, um die Ähnlichkeit von 1 (ganz unterschiedlich) bis 5 (sehr ähnlich) zu bewerten.',
            sliderLeft: 'Ganz unterschiedlich',
            sliderRight: 'Sehr Ähnlich',
            submitBtn: 'Absenden'
        },
        // Completion Page
        completion: {
            title: 'Alle Aufgaben erledigt!',
            thanks: 'Danke, dass du mitgemacht hast!',
            restartBtn: 'Neu starten',
            uploading: 'Ergebnisse werden übertragen...',
            uploadFailed: 'Übertragung fehlgeschlagen',
            retryBtn: 'Erneut versuchen',
            returnBtn: 'Zurück zum Start'
        },
        // Storage View
        storage: {
            title: 'Gesammelte Ergebnisse',
            downloadBtn: 'JSON herunterladen',
            clearBtn: 'Alles löschen',
            disclaimer: 'Alle Informationen sind pseudonymisiert.'
        },
        // Toasts/Messages
        messages: {
            storageCleared: 'Speicher gelöscht.',
            downloadStarted: 'Download gestartet.',
            clearConfirm: 'Sollen wirklich alle gesammelten Ergebnisse gelöscht werden?',
            loadingTasks: 'Aufgaben werden geladen, bitte warten...',
            uploadFailedToast: 'Übertragungsfehler. Bitte kontaktiere den Studienleiter, falls das Problem bestehen bleibt.'
        }
    }
};

/**
 * Get the user's preferred language from browser settings or localStorage
 * @returns {string} 'en' or 'de'
 */
export function getUserLanguage() {
    // Check if user has manually selected a language
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['en', 'de'].includes(savedLang)) {
        return savedLang;
    }

    // Fall back to browser language
    const browserLang = navigator.language.split('-')[0]; // 'de', 'en', etc.
    return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
}

/**
 * Set the user's preferred language
 * @param {string} lang - Language code ('en' or 'de')
 */
export function setUserLanguage(lang) {
    if (!['en', 'de'].includes(lang)) {
        throw new Error('Invalid language code. Must be "en" or "de".');
    }
    localStorage.setItem('preferredLanguage', lang);
    applyTranslations();
}

/**
 * Get translated text by key
 * @param {string} key - Dot-notation key (e.g., 'landing.title')
 * @param {string} lang - Language code (optional, defaults to user's browser language)
 * @returns {string} Translated text or key if not found
 */
export function t(key, lang = getUserLanguage()) {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

/**
 * Apply translations to all elements with data-i18n attribute
 * @param {HTMLElement} container - Container element to search within (defaults to document)
 */
export function applyTranslations(container = document) {
    const lang = getUserLanguage();
    container.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key, lang);
    });

    // Handle placeholder translations
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key, lang);
    });
}

/**
 * Get the current active language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
    return getUserLanguage();
}
