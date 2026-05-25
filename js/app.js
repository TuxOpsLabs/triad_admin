/**
 * App entry point — registers routes and boots the SPA.
 */

(async () => {
    await i18n.load(i18n.getLocale());

    router.register("/login", pages.login);
    router.register("/dashboard", pages.dashboard);
    router.register("/reports", pages.reports);
    router.register("/reports/:id", pages.reportDetail);
    router.register("/sanctions", pages.sanctions);
    router.register("/devices", pages.devices);
    router.register("/audit", pages.audit);
    router.register("/audit/:id", pages.auditChain);

    // Language switcher (delegated)
    document.addEventListener("change", async (e) => {
        if (e.target.id === "lang-select") {
            await i18n.load(e.target.value);
            router.resolve();
        }
    });

    router.resolve();
})();
