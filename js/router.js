/**
 * Router — minimal hash-based SPA router.
 */

const router = (() => {
    const routes = {};
    let currentCleanup = null;

    function register(path, handler) {
        routes[path] = handler;
    }

    function navigate(path) {
        window.location.hash = path;
    }

    async function resolve() {
        if (currentCleanup) currentCleanup();

        const hash = window.location.hash.slice(1) || "/login";
        const app = document.getElementById("app");

        // Find matching route (supports /reports/:id patterns)
        let handler = routes[hash];
        let params = {};

        if (!handler) {
            for (const [pattern, h] of Object.entries(routes)) {
                const regex = new RegExp("^" + pattern.replace(/:([^/]+)/g, "([^/]+)") + "$");
                const match = hash.match(regex);
                if (match) {
                    handler = h;
                    const keys = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
                    keys.forEach((k, i) => params[k] = match[i + 1]);
                    break;
                }
            }
        }

        if (!handler) {
            app.innerHTML = `<p class="text-center text-gray-500 mt-20">Page not found</p>`;
            return;
        }

        // Auth guard
        if (hash !== "/login" && !api.isAuthenticated()) {
            navigate("/login");
            return;
        }

        currentCleanup = await handler(app, params) || null;
    }

    window.addEventListener("hashchange", resolve);

    return { register, navigate, resolve };
})();
