/**
 * App entry point — registers routes and boots the SPA.
 */

(async () => {
    await i18n.load(i18n.getLocale());

    router.register("/login", pages.login);
    router.register("/dashboard", pages.dashboard);
    router.register("/reports", pages.reports);
    router.register("/reports/:id", pages.reportDetail);
    // TODO: sanctions, devices, audit pages (Phase 2)

    // Language switcher (delegated)
    document.addEventListener("change", async (e) => {
        if (e.target.id === "lang-select") {
            await i18n.load(e.target.value);
            router.resolve();
        }
    });

    router.resolve();
})();
