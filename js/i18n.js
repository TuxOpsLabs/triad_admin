/**
 * i18n — minimal translation system.
 * Loads JSON locale files, detects browser language, allows override.
 */

const i18n = (() => {
    let locale = localStorage.getItem("locale") || navigator.language.slice(0, 2) || "en";
    let messages = {};

    const supportedLocales = ["en", "es"];

    if (!supportedLocales.includes(locale)) locale = "en";

    async function load(lang) {
        locale = lang;
        localStorage.setItem("locale", lang);
        const resp = await fetch(`/locales/${lang}.json`);
        messages = await resp.json();
        document.documentElement.lang = lang;
    }

    function t(key) {
        return messages[key] || key;
    }

    function getLocale() {
        return locale;
    }

    return { load, t, getLocale, supportedLocales };
})();
