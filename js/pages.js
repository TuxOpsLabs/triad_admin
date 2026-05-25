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
                <div id="login-step-email">
                    <form id="email-form" class="space-y-6">
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
                </div>
                <div id="login-step-code" class="hidden">
                    <form id="code-form" class="space-y-6">
                        <p class="text-sm text-gray-400 mb-4">Code sent to <span id="sent-email" class="text-white"></span></p>
                        <div>
                            <label for="code" class="block text-sm font-medium text-gray-300 mb-2">Code</label>
                            <input type="text" name="code" id="code" required maxlength="6" pattern="[0-9]{6}"
                                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="000000">
                        </div>
                        <label class="flex items-center space-x-2 text-sm text-gray-400">
                            <input type="checkbox" id="keep-session" class="rounded bg-gray-700 border-gray-600">
                            <span>Keep me logged in</span>
                        </label>
                        <button type="submit"
                            class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition">
                            Verify
                        </button>
                        <button type="button" id="back-btn"
                            class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                            ← Back
                        </button>
                    </form>
                </div>
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

        let userEmail = "";

        document.getElementById("email-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            userEmail = document.getElementById("email").value;
            const err = document.getElementById("login-error");
            err.classList.add("hidden");

            await api.post("/auth/request-otp", { email: userEmail });

            document.getElementById("login-step-email").classList.add("hidden");
            document.getElementById("login-step-code").classList.remove("hidden");
            document.getElementById("sent-email").textContent = userEmail;
            document.getElementById("code").focus();
        });

        document.getElementById("back-btn").addEventListener("click", () => {
            document.getElementById("login-step-code").classList.add("hidden");
            document.getElementById("login-step-email").classList.remove("hidden");
            document.getElementById("login-error").classList.add("hidden");
        });

        document.getElementById("code-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const code = document.getElementById("code").value;
            const rememberMe = document.getElementById("keep-session").checked;
            const result = await api.post("/auth/verify-otp", { email: userEmail, code, remember_me: rememberMe });

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
        if (!stats || stats.detail) {
            app.innerHTML = `
            ${nav()}
            <div class="flex items-center justify-center min-h-[60vh]">
                <div class="text-center">
                    <p class="text-4xl mb-4">🚫</p>
                    <p class="text-xl text-gray-300">${i18n.t("dashboard.access_denied")}</p>
                </div>
            </div>`;
            return;
        }
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
                <a href="#/users" class="text-gray-300 hover:text-white">${i18n.t("nav.users")}</a>
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


    // --- Users ---
    async function users(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get("/admin/users");
        app.innerHTML = `
        ${nav()}
        <div class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold">${i18n.t("users.title")}</h1>
            <input type="text" id="user-search" placeholder="${i18n.t("users.search_placeholder")}"
                class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div id="users-table">${usersTable(data)}</div>`;

        let debounce = null;
        document.getElementById("user-search").addEventListener("input", (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                const q = e.target.value.trim();
                const results = q ? await api.get(`/admin/users?search=${encodeURIComponent(q)}`) : await api.get("/admin/users");
                document.getElementById("users-table").innerHTML = usersTable(results);
            }, 300);
        });
    }

    async function userDetail(app, params) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const u = await api.get(`/admin/users/${params.id}`);
        const profiles = await api.get(`/admin/users/${params.id}/profiles`);
        if (!u || u.detail) {
            app.innerHTML = `${nav()}<p class="text-red-400">${i18n.t("users.not_found")}</p>`;
            return;
        }
        app.innerHTML = `
        ${nav()}
        <a href="#/users" class="text-indigo-400 hover:text-indigo-300 mb-6 inline-block">${i18n.t("users.back")}</a>
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h1 class="text-2xl font-bold mb-4">${u.username || u.email}</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><p class="text-gray-400">Email</p><p>${u.email}</p></div>
                <div><p class="text-gray-400">Username</p><p>${u.username || "—"}</p></div>
                <div><p class="text-gray-400">Role</p><p>${roleBadge(u.role)}</p></div>
                <div><p class="text-gray-400">Active</p><p>${u.is_active ? "✅" : "❌"}</p></div>
            </div>
        </div>
        <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold mb-4">${i18n.t("users.profiles")} (${profiles.length})</h2>
            ${profiles.length ? profiles.map(p => `
                <div class="flex items-center justify-between bg-gray-700 rounded p-3 mb-2">
                    <div>
                        <span class="font-medium">${p.display_name}</span>
                        <span class="text-xs text-gray-400 ml-2">${p.profile_type}</span>
                    </div>
                    <span class="text-xs text-gray-500">${p.id.slice(0, 8)}</span>
                </div>`).join("") : `<p class="text-gray-500">${i18n.t("users.no_profiles")}</p>`}
        </div>`;
    }

    // --- Sanctions ---
    async function sanctions(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get("/admin/sanctions");
        app.innerHTML = `
        ${nav()}
        <h1 class="text-3xl font-bold mb-8">${i18n.t("nav.sanctions")}</h1>
        <table class="w-full text-sm">
            <thead><tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-3">Profile</th>
                <th class="pb-3">Type</th>
                <th class="pb-3">Reason</th>
                <th class="pb-3">Starts</th>
                <th class="pb-3">Ends</th>
                <th class="pb-3"></th>
            </tr></thead>
            <tbody>${data.length ? data.map(s => `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="py-3">${s.profile_id.slice(0, 8)}</td>
                    <td class="py-3">${sanctionBadge(s.type)}</td>
                    <td class="py-3 text-gray-300">${s.reason || "—"}</td>
                    <td class="py-3 text-gray-400">${new Date(s.starts_at).toLocaleDateString()}</td>
                    <td class="py-3 text-gray-400">${s.ends_at ? new Date(s.ends_at).toLocaleDateString() : "Permanent"}</td>
                    <td class="py-3"><button onclick="pages.removeSanction('${s.id}')" class="text-red-400 hover:text-red-300 text-sm">Remove</button></td>
                </tr>`).join("") : `<tr><td colspan="6" class="py-8 text-center text-gray-500">No active sanctions</td></tr>`}
            </tbody>
        </table>`;
    }

    async function removeSanction(id) {
        await api.del(`/admin/sanctions/${id}`);
        router.resolve();
    }

    // --- Devices ---
    async function devices(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get("/admin/devices/ban");
        app.innerHTML = `
        ${nav()}
        <h1 class="text-3xl font-bold mb-8">${i18n.t("nav.devices")}</h1>
        <div class="mb-6">
            <form id="ban-form" class="flex gap-3">
                <input type="text" id="ban-device-id" placeholder="Device ID" required
                    class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <input type="text" id="ban-reason" placeholder="Reason (optional)"
                    class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button type="submit" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition">Ban Device</button>
            </form>
        </div>
        <table class="w-full text-sm">
            <thead><tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-3">Device ID</th>
                <th class="pb-3">Reason</th>
                <th class="pb-3">Banned At</th>
                <th class="pb-3"></th>
            </tr></thead>
            <tbody>${data.length ? data.map(d => `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="py-3 font-mono text-sm">${d.device_id}</td>
                    <td class="py-3 text-gray-300">${d.reason || "—"}</td>
                    <td class="py-3 text-gray-400">${new Date(d.created_at).toLocaleDateString()}</td>
                    <td class="py-3"><button onclick="pages.unbanDevice('${d.device_id}')" class="text-green-400 hover:text-green-300 text-sm">Unban</button></td>
                </tr>`).join("") : `<tr><td colspan="4" class="py-8 text-center text-gray-500">No banned devices</td></tr>`}
            </tbody>
        </table>`;

        document.getElementById("ban-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const device_id = document.getElementById("ban-device-id").value;
            const reason = document.getElementById("ban-reason").value || null;
            await api.post("/admin/devices/ban", { device_id, reason });
            router.resolve();
        });
    }

    async function unbanDevice(deviceId) {
        await api.del(`/admin/devices/ban/${deviceId}`);
        router.resolve();
    }

    // --- Audit ---
    async function audit(app) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get("/admin/audit-events");
        app.innerHTML = `
        ${nav()}
        <h1 class="text-3xl font-bold mb-8">${i18n.t("nav.audit")}</h1>
        <table class="w-full text-sm">
            <thead><tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-3">Actor</th>
                <th class="pb-3">Action</th>
                <th class="pb-3">Entity</th>
                <th class="pb-3">Date</th>
                <th class="pb-3"></th>
            </tr></thead>
            <tbody>${data.map(e => `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="py-3">${e.actor_email || e.actor_user_id.slice(0, 8)}</td>
                    <td class="py-3"><span class="px-2 py-1 rounded text-xs bg-gray-700">${e.action}</span></td>
                    <td class="py-3 text-gray-400">${e.entity_type || "—"} ${e.entity_id ? e.entity_id.slice(0, 8) : ""}</td>
                    <td class="py-3 text-gray-400">${new Date(e.created_at).toLocaleString()}</td>
                    <td class="py-3">${e.entity_id ? `<a href="#/audit/${e.entity_id}" class="text-indigo-400 hover:text-indigo-300">Chain</a>` : ""}</td>
                </tr>`).join("")}
            </tbody>
        </table>`;
    }

    // --- Audit Chain ---
    async function auditChain(app, params) {
        app.innerHTML = `<p class="text-gray-400">${i18n.t("common.loading")}</p>`;
        const data = await api.get(`/admin/audit-events/${params.id}/chain`);
        app.innerHTML = `
        ${nav()}
        <a href="#/audit" class="text-indigo-400 hover:text-indigo-300 mb-6 inline-block">← Back to Audit</a>
        <h1 class="text-2xl font-bold mb-6">Audit Chain: ${params.id.slice(0, 8)}...</h1>
        <div class="space-y-3">
            ${data.map((e, i) => `
            <div class="bg-gray-800 rounded-lg p-4 ${i === 0 ? "border-l-4 border-indigo-500" : ""}">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">${e.action}</span>
                    <span class="text-xs text-gray-400">${new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div class="text-xs text-gray-500">
                    <span>Actor: ${e.actor_email || e.actor_user_id.slice(0, 8)}</span>
                    <span class="ml-4">Checksum: ${e.checksum.slice(0, 12)}...</span>
                    ${e.previous_checksum ? `<span class="ml-4">Prev: ${e.previous_checksum.slice(0, 12)}...</span>` : ""}
                </div>
                ${e.payload ? `<pre class="mt-2 text-xs text-gray-400 bg-gray-900 rounded p-2 overflow-x-auto">${JSON.stringify(e.payload, null, 2)}</pre>` : ""}
            </div>`).join("")}
        </div>`;
    }

    // --- Helpers ---
    function usersTable(users) {
        if (!users || !users.length) return `<p class="text-center text-gray-500 py-8">${i18n.t("users.no_users")}</p>`;
        return `<table class="w-full text-sm">
            <thead><tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-3">${i18n.t("users.col_email")}</th>
                <th class="pb-3">${i18n.t("users.col_username")}</th>
                <th class="pb-3">${i18n.t("users.col_role")}</th>
                <th class="pb-3">${i18n.t("users.col_active")}</th>
                <th class="pb-3">${i18n.t("users.col_created")}</th>
                <th class="pb-3"></th>
            </tr></thead>
            <tbody>${users.map(u => `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="py-3">${u.email}</td>
                    <td class="py-3">${u.username || "—"}</td>
                    <td class="py-3">${roleBadge(u.role)}</td>
                    <td class="py-3">${u.is_active ? "✅" : "❌"}</td>
                    <td class="py-3 text-gray-400">${u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td class="py-3"><a href="#/users/${u.id}" class="text-indigo-400 hover:text-indigo-300">View</a></td>
                </tr>`).join("")}
            </tbody></table>`;
    }

    function roleBadge(role) {
        const colors = {
            admin: "bg-red-900 text-red-300",
            moderator: "bg-blue-900 text-blue-300",
            user: "bg-gray-700 text-gray-300",
        };
        return `<span class="px-2 py-1 rounded text-xs ${colors[role] || "bg-gray-700"}">${role}</span>`;
    }

    function sanctionBadge(type) {
        const colors = {
            warning: "bg-yellow-900 text-yellow-300",
            shadowban: "bg-purple-900 text-purple-300",
            temporary_ban: "bg-orange-900 text-orange-300",
            permanent_ban: "bg-red-900 text-red-300",
        };
        return `<span class="px-2 py-1 rounded text-xs ${colors[type] || "bg-gray-700"}">${type}</span>`;
    }

    return { login, dashboard, reports, reportDetail, reviewReport, sanctions, removeSanction, devices, unbanDevice, audit, auditChain, users, userDetail };
})();
