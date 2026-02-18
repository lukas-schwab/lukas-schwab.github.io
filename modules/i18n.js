/**
 * Internationalization module for bilingual support (English/German)
 */

const translations = {
    en: {
        // Landing Page
        landing: {
            badge: 'Research Study',
            titlePart1: 'Concept Interpretability',
            titlePart2: ' ',
            subtitle: 'Help us advance ML interpretability by revealing how you perceive visual simuli.',
            card0Title: 'What is this about?',
            card0Text: 'To better understand how artificial neural networks work, we extract visual concepts from the internal decision-making process of the networks. To determine how meaningful these concepts are, there are some technical metrics. However, since it is unclear whether these metrics truly align with human perception, in this study we investigate how extracted concepts are actually perceived by humans.',
            card1Title: 'What to Expect',
            card1Text: 'Complete interactive tasks involving image analysis, region selection, labeling, and visual distinguishability.',
            card2Title: 'Time Commitment',
            card2Text: 'Approximately 5-10 minutes to complete all tasks at your own pace.',
            card3Title: 'Privacy First',
            card3Text: 'All data is fully pseudonymized. Only task responses are collected—no personal information.',
            startBtn: 'Begin Study',
            loadingText: 'Almost there...',
            footerContactTitle: 'Contact',
            footerOrgTitle: 'Organization',
            footerOrgName: 'Offenburg University of Applied Sciences'
        },
        // Labeling Page
        labeling: {
            title: 'You see details of images of class [class]. Label the common detail.',
            subtitle: 'Please type something even if you are unsure about it.',
            defaultClassName: "fish",
            placeholder: 'Enter label here...',
            submitBtn: 'Submit'
        },
        // Property Identifier Page
        propertyId: {
            title: 'Click on each seperate thing and visual property you see.',
            subtitle: 'You can set as many markers as you like.',
            undoBtn: 'Undo Last Marker',
            submitBtn: 'Submit'
        },
        // Region Locator Page
        regionLocator: {
            title: 'If the content of Image A were part of Image B, where would it be?',
            subtitle: 'Encircle that area in Image B. You can redraw multiple times.',
            cardALabel: 'Image A (Reference)',
            cardBLabel: 'Image B (Encircle here)',
            hintA: ' ',
            hintB: 'Click and drag to encircle',
            infoTooltip: 'If you can think of multiple locations, please encircle the most likely one, or just any matching location.',
            notFoundBtn: 'No area found',
            submitBtn: 'Submit'
        },
        // Similarity Labeling Page
        similarity: {
            title: 'How distinguishable are these two image groups?',
            subtitle: 'Use the slider below to rank distinguishability from 1 (Easy) to 5 (Hard).',
            sliderLeft: 'Easy',
            sliderRight: 'Hard',
            submitBtn: 'Submit'
        },
        // Completion Page
        completion: {
            title: 'All tasks completed!',
            thanks: 'Thank you for your participation.',
            moreTasksBtn: 'Give me more tasks!',
            uploading: 'Uploading results...',
            uploadFailed: 'Upload failed',
            retryBtn: 'Retry Upload',
            returnBtn: 'Return to Start',
            shareTitle: 'Share this study',
            shareDescription: 'Copy the link below to share with others:',
            copyBtn: 'Copy Link',
            copiedBtn: 'Copied!'
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
            uploadFailedToast: 'Upload error. Please contact the study administrator if this persists.',
            noMoreTasks: 'No more tasks available at the moment. Please try again later.',
            holdLongerToDraw: 'Hold down longer to draw!',
            drawOnImageB: 'You can only draw on Image B',
            encircleRegion: 'Please encircle a region on Image B first!',
            submittedRegion: 'Submitted: Region',
            submittedRegionNotFound: 'Submitted: Region not found.',
            enterLabel: 'Please enter a label.',
            clickProperty: 'Please click on at least one property!'
        }
    },
    de: {
        // Landing Page
        landing: {
            badge: 'Research Study',
            titlePart1: 'Concept Interpretability',
            titlePart2: ' ',
            card0Title: 'Worum geht es?',
            card0Text: 'Um besser zu verstehen, wie künstliche Neuronale Netzwerke funktionieren, extrahieren wir visuelle Konzepte aus dem internen Entscheidungsprozess der Netzwerke. Um zu bestimmen, wie aussagekräftig diese Konzepte darin sind, gibt es einige technische Metriken. Da jedoch fraglich ist, inwiefern diese Metriken tatsächlich mit der menschlichen Wahrnehmung übereinstimmen, untersuchen wir mit dieser Studie, wie extrahierte Konzepte tatsächlich durch den Menschen Wahrgenommen werden.',
            subtitle: 'Hilf uns mit deiner Wahrnehmung dabei, die Interpretierbarkeit von ML-Modellen zu verbessern.',
            card1Title: 'Was dich erwartet',
            card1Text: 'Du absolvierst interaktive Aufgaben: Bilder analysieren, Bereiche auswählen, beschriften und vergleichen.',
            card2Title: 'Zeitaufwand',
            card2Text: 'Etwa 5-10 Minuten – ganz in deinem eigenen Tempo.',
            card3Title: 'Deine Privatsphäre',
            card3Text: 'Alle Daten sind vollständig pseudonymisiert. Wir sammeln nur deine Aufgabenlösungen – keine persönlichen Infos.',
            startBtn: 'Los geht\'s',
            loadingText: 'Wird vorbereitet...',
            footerContactTitle: 'Kontakt',
            footerOrgTitle: 'Organisation',
            footerOrgName: 'Hochschule Offenburg'
        },
        // Labeling Page
        labeling: {
            title: 'Du kannst Details von Bildern der Klasse [class] sehen. Beschrifte das gemeinsame Detail.',
            subtitle: 'Bitte gebe auch dann etwas ein, wenn Du Dir unsicher bist.',
            defaultClassName: "Fisch",
            placeholder: 'Dein Wort...',
            submitBtn: 'Absenden'
        },
        // Property Identifier Page
        propertyId: {
            title: 'Klicke auf alle Dinge und visuellen Eigenschaften, die du sehen kannst.', 
            subtitle: 'Du kannst so viele Marker setzen wie Du möchtest.',
            undoBtn: 'Letzte Markierung rückgängig',
            submitBtn: 'Absenden'
        },
        // Region Locator Page
        regionLocator: {
            title: 'Wenn der Inhalt von Bild A teil von Bild B wäre, wo wäre er?',
            subtitle: 'Umkreise die Stelle in Bild B. Du kannst auch mehrmals neu zeichen.',
            cardALabel: 'Bild A (Vorlage)',
            cardBLabel: 'Bild B (Hier umkreisen)',
            hintA: ' ',
            hintB: 'Klicken und ziehen zum Umkreisen',
            infoTooltip: 'Wenn Dir mehrere Orte einfallen, kreise bitte den wahrscheinlichsten oder einen beliebigen passenden Ort ein.',
            notFoundBtn: 'Keine passende Stelle gefunden',
            submitBtn: 'Absenden'
        },
        // Similarity Labeling Page
        similarity: {
            title: 'Wie unterscheidbar sind diese beiden Bildgruppen?',
            subtitle: 'Nutze den Schieberegler, um die Unterscheidbarkeit von 1 (Einfach) bis 5 (Schwer) zu bewerten.',
            sliderLeft: 'Einfach',
            sliderRight: 'Schwer',
            submitBtn: 'Absenden'
        },
        // Completion Page
        completion: {
            title: 'Alle Aufgaben erledigt!',
            thanks: 'Danke, dass du mitgemacht hast!',
            moreTasksBtn: 'Gib mir mehr Aufgaben!',
            closeStudyBtn: 'Fenster schließen',
            uploading: 'Ergebnisse werden übertragen...',
            uploadFailed: 'Übertragung fehlgeschlagen',
            retryBtn: 'Erneut versuchen',
            returnBtn: 'Zurück zum Start',
            shareTitle: 'Diese Studie teilen',
            shareDescription: 'Kopiere den Link und Teile die Studie weiter:',
            copyBtn: 'Link kopieren',
            copiedBtn: 'Kopiert!'
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
            uploadFailedToast: 'Übertragungsfehler. Bitte kontaktiere den Studienleiter, falls das Problem bestehen bleibt.',
            noMoreTasks: 'Momentan sind keine weiteren Aufgaben verfügbar. Bitte versuche es später erneut.',
            holdLongerToDraw: 'Halte länger gedrückt, um zu zeichnen!',
            drawOnImageB: 'Du kannst nur auf Bild B zeichnen',
            encircleRegion: 'Bitte umkreise zuerst eine Region im Schema!',
            submittedRegion: 'Abgesendet: Region',
            submittedRegionNotFound: 'Abgesendet: Nicht zuordenbar.',
            enterLabel: 'Bitte gib eine Bezeichnung ein.',
            clickProperty: 'Bitte klicke auf mindestens eine Komponente!'
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
