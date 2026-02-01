# Bilingual Support (EN/DE)

This website now supports English and German based on the user's browser language settings.

## How It Works

1. **Automatic Detection**: The system detects the browser's language preference using `navigator.language`
2. **Fallback**: If the browser language is not English or German, it defaults to English
3. **Translation Module**: All text is stored in `modules/i18n.js` with structured translation keys

## Files Modified

### New Files
- `modules/i18n.js` - Translation module with all English and German text

### Updated Files
- `app.js` - Added i18n imports and translation application
- `index.html` - Added data-i18n attributes to storage view
- `pages/landing.html` - Added data-i18n attributes
- `pages/labeling.html` - Added data-i18n attributes
- `pages/property-identifier.html` - Added data-i18n attributes
- `pages/region-locator.html` - Added data-i18n attributes
- `pages/similarity-labeling.html` - Added data-i18n attributes

## Adding New Translations

To add or modify translations:

1. Edit `modules/i18n.js`
2. Add the key to both `en` and `de` objects
3. Use `data-i18n="category.key"` in HTML
4. For placeholders, use `data-i18n-placeholder="category.key"`

Example:
```javascript
// In i18n.js
en: {
    myCategory: {
        myText: 'Hello World'
    }
}

// In HTML
<p data-i18n="myCategory.myText">Hello World</p>
```

## Testing Different Languages

To test the German version:
1. Change your browser language settings to German (de)
2. Reload the page

Or use browser dev tools:
```javascript
// In console, override the language detection
Object.defineProperty(navigator, 'language', {
    get: () => 'de'
});
location.reload();
```

## Language-Specific Features

- Dynamic HTML `lang` attribute updates
- Placeholder text translation for input fields
- Toast messages in appropriate language
- Confirmation dialogs in appropriate language
