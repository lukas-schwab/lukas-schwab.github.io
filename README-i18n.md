# Internationalization Guide (i18n)

This website supports **English (en)** and **German (de)** with automatic language detection. All UI text is centralized in a modular translation system for easy maintenance and expansion.

## 🌍 How Language Detection Works

### Automatic Detection
```javascript
// Language is detected from navigator.language in this order:
1. Check browser's language preference (navigator.language)
2. Parse language code (e.g., 'en-US' → 'en')
3. If 'en' or 'de', use that language
4. Otherwise, default to 'en' (English)
```

### Manual Override
```javascript
import { setUserLanguage, getUserLanguage } from './modules/i18n.js';

// Force a specific language
setUserLanguage('de');

// Get current language
const currentLang = getUserLanguage(); // Returns: 'en' or 'de'
```

## 📁 Translation System

### Core Module: `modules/i18n.js`

Contains three main exports:

**1. Translate Function: `t(key)`**
```javascript
import { t } from './modules/i18n.js';

// Get translated text for current language
const buttonText = t('actions.submit');      // Returns translated text
const pageTitle = t('labeling.title');       // Returns: 'Image Labeling' or 'Bildkennzeichnung'

// Works with nested keys
const nestedText = t('completion.feedbackTitle');
```

**2. DOM Translation: `applyTranslations()`**
```javascript
import { applyTranslations } from './modules/i18n.js';

// Scans DOM for data-i18n attributes and applies translations
applyTranslations();

// Should be called:
// - Once on page load
// - After loading new HTML pages
// - When manually changing language
```

**3. Language Management**
```javascript
import { getUserLanguage, setUserLanguage } from './modules/i18n.js';

const lang = getUserLanguage();   // Get current: 'en' or 'de'
setUserLanguage('de');            // Set to German
applyTranslations();              // Reapply all translations
```

### Translation Structure

```javascript
export const translations = {
    en: {
        common: {
            next: 'Next',
            back: 'Back',
            submit: 'Submit',
            cancel: 'Cancel'
        },
        labeling: {
            title: 'Image Labeling',
            instructions: 'Please classify the image content',
            placeholder: 'Enter description...'
        },
        actions: {
            submit: 'Submit',
            clear: 'Clear'
        },
        messages: {
            success: 'Successfully submitted!',
            error: 'An error occurred'
        },
        completion: {
            title: 'Study Completed!',
            feedbackTitle: 'Optional Feedback'
        }
        // ... more keys ...
    },
    de: {
        common: {
            next: 'Weiter',
            back: 'Zurück',
            submit: 'Absenden',
            cancel: 'Abbrechen'
        },
        labeling: {
            title: 'Bildkennzeichnung',
            instructions: 'Bitte klassifizieren Sie den Bildinhalt',
            placeholder: 'Beschreibung eingeben...'
        },
        // ... more translations ...
    }
};
```

## 🔧 Using Translations in HTML

### Static Text with `data-i18n`

```html
<!-- Text content will be replaced with translated text -->
<h1 data-i18n="labeling.title">Image Labeling</h1>
<p data-i18n="labeling.instructions">Please classify...</p>
<button data-i18n="actions.submit">Submit</button>
```

When page loads and `applyTranslations()` is called:
- English users see: "Image Labeling", "Please classify...", "Submit"
- German users see: "Bildkennzeichnung", "Bitte klassifizieren...", "Absenden"

### Placeholder Text with `data-i18n-placeholder`

```html
<!-- Placeholder attributes will be translated -->
<input 
    type="text" 
    data-i18n-placeholder="labeling.placeholder"
    placeholder="Enter description..."
>
```

### Using Both

```html
<textarea 
    data-i18n="completion.feedbackDescription"
    data-i18n-placeholder="completion.feedbackPlaceholder"
>
    Default description in English
</textarea>
```

## 📝 Adding a New Translation

### Step 1: Add Translation Keys to `modules/i18n.js`

```javascript
export const translations = {
    en: {
        // ... existing translations ...
        myFeature: {
            title: 'My Feature Title',
            description: 'Feature description',
            button: 'Click Me'
        }
    },
    de: {
        // ... existing translations ...
        myFeature: {
            title: 'Mein Funktionstitel',
            description: 'Funktionsbeschreibung',
            button: 'Klicken Sie mich'
        }
    }
};
```

### Step 2: Use in HTML

```html
<section class="my-feature">
    <h2 data-i18n="myFeature.title">My Feature Title</h2>
    <p data-i18n="myFeature.description">Feature description</p>
    <button data-i18n="myFeature.button">Click Me</button>
</section>
```

### Step 3: Reference in JavaScript

```javascript
import { t } from './modules/i18n.js';

const featureTitle = t('myFeature.title');
const featureButton = t('myFeature.button');
```

## 🧪 Testing Different Languages

### Test 1: Browser Language Settings
1. Change your OS/browser language to German (Deutsch)
2. Reload the page
3. Content should appear in German

### Test 2: Browser DevTools Override

Open browser Developer Tools Console and run:

```javascript
// Force German language
Object.defineProperty(navigator, 'language', {
    get: () => 'de'
});
location.reload();

// Force English language
Object.defineProperty(navigator, 'language', {
    get: () => 'en'
});
location.reload();
```

### Test 3: Direct Language Override (In App Code)

```javascript
import { setUserLanguage, applyTranslations } from './modules/i18n.js';

// Switch to German
setUserLanguage('de');
applyTranslations();

// Switch back to English
setUserLanguage('en');
applyTranslations();
```

## 🎯 Best Practices

### Do's ✅
- Keep translation keys organized with category prefixes
- Always provide translations for both EN and DE
- Use semantic key names: `labeling.title` instead of `label1`
- Use `data-i18n` for all user-facing text
- Call `applyTranslations()` after loading new pages
- Test UI in both languages before committing

### Don'ts ❌
- Mixing untranslated English text with translated text
- Using hardcoded strings instead of translation keys
- Forgetting to add German translations (causes key fallback)
- Not testing on both browsers and with language override
- Storing translated strings in JavaScript variables at module load time (retrieve with `t()` at runtime instead)

## 🔄 Adding a New Language (Beyond EN/DE)

### Step 1: Add Translation Object

```javascript
export const translations = {
    en: { /* ... */ },
    de: { /* ... */ },
    fr: {  // French
        common: { /* French translations */ },
        labeling: { /* French translations */ },
        // ... all keys ...
    }
};
```

### Step 2: Update Supported Languages

```javascript
const SUPPORTED_LANGUAGES = ['en', 'de', 'fr'];
```

### Step 3: Update Language Detection

```javascript
export function getUserLanguage() {
    let language = localStorage.getItem('userLanguage');
    if (!language) {
        const browserLang = (navigator.language || 'en').split('-')[0];
        language = SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : 'en';
        localStorage.setItem('userLanguage', language);
    }
    return language;
}
```

## 📊 Translation Coverage

Monitor translation completeness:

```javascript
// In browser console
import { translations } from './modules/i18n.js';

function checkCoverage() {
    const enKeys = Object.keys(JSON.stringify(translations.en));
    const deKeys = Object.keys(JSON.stringify(translations.de));
    
    console.log(`EN keys: ${enKeys.length}, DE keys: ${deKeys.length}`);
    console.log('English and German translation coverage should match');
}

checkCoverage();
```

## 🐛 Troubleshooting i18n

### Issue: Text Not Translating
```javascript
// Check if element has data-i18n attribute
document.querySelector('[data-i18n="labeling.title"]'); // Should return element

// Verify translation key exists
import { t } from './modules/i18n.js';
t('labeling.title'); // Should return translated text, not the key itself

// Force re-apply translations
import { applyTranslations } from './modules/i18n.js';
applyTranslations();
```

### Issue: Placeholder Not Translating
```javascript
// Use data-i18n-placeholder attribute specifically for inputs
// Regular data-i18n will replace textContent, not placeholder

const input = document.querySelector('input[data-i18n-placeholder]');
input.placeholder; // Should show translated text after applyTranslations()
```

### Issue: Wrong Language Detected
```javascript
// Check current language
import { getUserLanguage } from './modules/i18n.js';
console.log('Current language:', getUserLanguage());

// Check browser language
console.log('Browser language:', navigator.language);

// Clear localStorage language override
localStorage.removeItem('userLanguage');
location.reload();
```

---

**Last Updated:** March 2026  
**Supported Languages:** English (en), German (de)  
**Module Location:** `modules/i18n.js`
