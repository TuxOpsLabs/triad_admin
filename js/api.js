/**
 * API client — talks to the real API or falls back to mock.
 */

const api = (() => {
    function baseUrl() {
        return window.TRIAD_CONFIG?.API_URL || "";
    }

    function useMock() {
        return !baseUrl();
    }

    let token = sessionStorage.getItem("token") || null;

    function setToken(t) {
        token = t;
        if (t) sessionStorage.setItem("token", t);
        else sessionStorage.removeItem("token");
    }

    function getToken() {
        return token;
    }

    function isAuthenticated() {
        return !!token;
    }

    async function request(method, path, body = null) {
        if (useMock()) return mockApi.handle(method, path, body);

        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const resp = await fetch(`${baseUrl()}${path}`, opts);
        if (resp.status === 401) {
            setToken(null);
            router.navigate("/login");
            return null;
        }
        if (resp.status === 204) return null;
        return resp.json();
    }

    return {
        get: (path) => request("GET", path),
        post: (path, body) => request("POST", path, body),
        patch: (path, body) => request("PATCH", path, body),
        del: (path) => request("DELETE", path),
        setToken,
        getToken,
        isAuthenticated,
    };
})();
