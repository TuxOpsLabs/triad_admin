/**
 * Pages — each function renders a page into the app container.
 */

const pages = (() => {

    // --- Login ---
    function login(app) {
        const socialEnabled = window.TRIAD_CONFIG?.SOCIAL_AUTH_ENABLED;
        app.innerHTML = `
        <div class="flex items-center justify-center min-h-[80vh]">
            <div class="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h1 class="text-2xl font-bold text-center mb-8">${i18n.t("login.title")}</h1>
                <div id="login-error" class="hidden bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-6"></div>
                <form id="login-form" class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" name="email" id="email" required
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="${i18n.t("login.email_placeholder")}">
                    </div>
                    <button type="submit"
                        class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition">
                        ${i18n.t("login.send_magic_link")}
                    </button>
                </form>
                ${socialEnabled ? `
                <div class="mt-6 flex items-center">
                    <div class="flex-1 border-t border-gray-700"></div>
                    <span class="px-4 text-sm text-gray-500">${i18n.t("login.or_continue_with")}</span>
                    <div class="flex-1 border-t border-gray-700"></div>
                </div>
                <div class="mt-6 grid grid-cols-3 gap-3">
                    <button class="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">Google</button>
                    <button class="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">Apple</button>
                    <button class="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">GitHub</button>
                </div>` : ""}
            </div>
        </div>`;

        document.getElementById("login-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            // For PoC: auto-login via OTP mock
            const result = await api.post("/auth/verify-otp", { email, code: "000000" });
            if (result && result.access_token) {
                api.setToken(result.access_token);
                router.navigate("/dashboard");
            } else {
                const err = document.getElementById("login-error");
                err.textContent = i18n.t("login.error_access_denied");
                err.classList.remove("hidden");
            }
        });
    }

    // --- Dashboard ---
    async function dashboard(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const stats = await api.get("/admin/stats");
        app.innerHTML = `
        ${nav()}
        <h1 class="text-3xl font-bold mb-8">${i18n.t("dashboard.title")}</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${statCard(i18n.t("dashboard.total_users"), stats.total_users, "text-white")}
            ${statCard(i18n.t("dashboard.active_profiles"), stats.active_profiles, "text-white")}
            ${statCard(i18n.t("dashboard.pending_reports"), stats.pending_reports, "text-yellow-400")}
            ${statCard(i18n.t("dashboard.active_sanctions"), stats.active_sanctions, "text-red-400")}
        </div>`;
    }

    // --- Reports ---
    async function reports(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get("/admin/reports");
        app.innerHTML = `
        ${nav()}
        <div class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold">${i18n.t("reports.title")}</h1>
            <select id="status-filter" class="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="">${i18n.t("reports.filter_all")}</option>
                <option value="pending">${i18n.t("reports.filter_pending")}</option>
                <option value="under_review">${i18n.t("reports.filter_under_review")}</option>
                <option value="dismissed">${i18n.t("reports.filter_dismissed")}</option>
                <option value="action_taken">${i18n.t("reports.filter_action_taken")}</option>
            </select>
        </div>
        <div id="reports-table">${reportsTable(data)}</div>`;

        document.getElementById("status-filter").addEventListener("change", async (e) => {
            const all = await api.get("/admin/reports");
            const filtered = e.target.value ? all.filter(r => r.status === e.target.value) : all;
            document.getElementById("reports-table").innerHTML = reportsTable(filtered);
        });
    }

    // --- Report Detail ---
    async function reportDetail(app, params) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const report = await api.get(`/admin/reports/${params.id}`);
        const evidence = await api.get(`/admin/reports/${params.id}/evidence`);
        app.innerHTML = `
        ${nav()}
        <a href="#/reports" class="text-indigo-400 hover:text-indigo-300 mb-6 inline-block">${i18n.t("report.back")}</a>
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-bold">Report #${report.id.slice(0, 8)}</h1>
                ${statusBadge(report.status)}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><p class="text-gray-400">Reporter</p><p>${report.reporter_profile_id}</p></div>
                <div><p class="text-gray-400">Target</p><p>${report.target_profile_id}</p></div>
                <div><p class="text-gray-400">Reason</p><p>${report.reason}</p></div>
                <div><p class="text-gray-400">Created</p><p>${new Date(report.created_at).toLocaleString()}</p></div>
                ${report.comment ? `<div class="md:col-span-2"><p class="text-gray-400">Comment</p><p>${report.comment}</p></div>` : ""}
            </div>
        </div>
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">${i18n.t("report.evidence")} (${evidence.length})</h2>
            ${evidence.length ? evidence.map(e => `
                <div class="flex items-center justify-between bg-gray-700 rounded p-3 mb-2">
                    <span class="text-sm">${e.mime_type}</span>
                    <span class="text-xs text-gray-400">${new Date(e.created_at).toLocaleString()}</span>
                </div>`).join("") : `<p class="text-gray-500">${i18n.t("report.no_evidence")}</p>`}
        </div>
        <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold mb-4">${i18n.t("report.actions")}</h2>
            ${report.status === "pending" || report.status === "under_review" ? `
            <div class="flex flex-wrap gap-3">
                <button onclick="pages.reviewReport('${report.id}', 'under_review')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition">${i18n.t("report.mark_under_review")}</button>
                <button onclick="pages.reviewReport('${report.id}', 'dismissed')" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition">${i18n.t("report.dismiss")}</button>
                <button onclick="pages.reviewReport('${report.id}', 'action_taken')" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition">${i18n.t("report.take_action")}</button>
            </div>` : `<p class="text-gray-500">${i18n.t("report.already_resolved")}</p>`}
        </div>`;
    }

    async function reviewReport(id, status) {
        await api.patch(`/admin/reports/${id}`, { status });
        router.navigate(`/reports/${id}`);
        router.resolve();
    }

    // --- Helpers ---
    function nav() {
        return `
        <nav class="flex items-center justify-between mb-8 pb-4 border-b border-gray-700">
            <div class="flex items-center space-x-6">
                <span class="text-xl font-bold text-indigo-400">Triad Admin</span>
                <a href="#/dashboard" class="text-gray-300 hover:text-white">${i18n.t("nav.dashboard")}</a>
                <a href="#/reports" class="text-gray-300 hover:text-white">${i18n.t("nav.reports")}</a>
                <a href="#/sanctions" class="text-gray-300 hover:text-white">${i18n.t("nav.sanctions")}</a>
                <a href="#/devices" class="text-gray-300 hover:text-white">${i18n.t("nav.devices")}</a>
                <a href="#/audit" class="text-gray-300 hover:text-white">${i18n.t("nav.audit")}</a>
            </div>
            <div class="flex items-center space-x-4">
                <select id="lang-select" class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs">
                    ${i18n.supportedLocales.map(l => `<option value="${l}" ${l === i18n.getLocale() ? "selected" : ""}>${l.toUpperCase()}</option>`).join("")}
                </select>
                <a href="#/login" onclick="api.setToken(null)" class="text-sm text-red-400 hover:text-red-300">${i18n.t("nav.logout")}</a>
            </div>
        </nav>`;
    }

    function statCard(label, value, color) {
        return `<div class="bg-gray-800 rounded-lg p-6"><p class="text-sm text-gray-400">${label}</p><p class="text-3xl font-bold ${color}">${value}</p></div>`;
    }

    function statusBadge(status) {
        const colors = {
            pending: "bg-yellow-900 text-yellow-300",
            under_review: "bg-blue-900 text-blue-300",
            dismissed: "bg-gray-700 text-gray-400",
            action_taken: "bg-red-900 text-red-300",
        };
        return `<span class="px-3 py-1 rounded text-sm ${colors[status] || ""}">${status}</span>`;
    }

    function reportsTable(reports) {
        if (!reports.length) return `<p class="text-center text-gray-500 py-8">${i18n.t("reports.no_reports")}</p>`;
        return `<table class="w-full text-sm">
            <thead><tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-3">${i18n.t("reports.col_reporter")}</th>
                <th class="pb-3">${i18n.t("reports.col_target")}</th>
                <th class="pb-3">${i18n.t("reports.col_reason")}</th>
                <th class="pb-3">${i18n.t("reports.col_status")}</th>
                <th class="pb-3">${i18n.t("reports.col_date")}</th>
                <th class="pb-3"></th>
            </tr></thead>
            <tbody>${reports.map(r => `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="py-3">${r.reporter_profile_id.slice(0, 8)}</td>
                    <td class="py-3">${r.target_profile_id.slice(0, 8)}</td>
                    <td class="py-3"><span class="px-2 py-1 rounded text-xs bg-gray-700">${r.reason}</span></td>
                    <td class="py-3">${statusBadge(r.status)}</td>
                    <td class="py-3 text-gray-400">${new Date(r.created_at).toLocaleDateString()}</td>
                    <td class="py-3"><a href="#/reports/${r.id}" class="text-indigo-400 hover:text-indigo-300">${i18n.t("reports.view")}</a></td>
                </tr>`).join("")}
            </tbody></table>`;
    }

    return { login, dashboard, reports, reportDetail, reviewReport };
})();
