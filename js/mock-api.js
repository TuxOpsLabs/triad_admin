/**
 * Mock API — returns fake data for development without a backend.
 */

const mockApi = (() => {
    const uuid = () => crypto.randomUUID();
    const now = () => new Date().toISOString();

    const mockReports = Array.from({ length: 12 }, (_, i) => ({
        id: uuid(),
        reporter_profile_id: uuid(),
        target_profile_id: uuid(),
        reason: ["spam", "harassment", "illegal_content", "impersonation", "other"][i % 5],
        comment: i % 3 === 0 ? "Abusive behavior in chat" : null,
        status: ["pending", "under_review", "dismissed", "action_taken"][i % 4],
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    const mockSanctions = Array.from({ length: 5 }, (_, i) => ({
        id: uuid(),
        profile_id: uuid(),
        type: ["warning", "shadowban", "temporary_ban", "permanent_ban"][i % 4],
        reason: "Violation of community guidelines",
        starts_at: now(),
        ends_at: i % 2 === 0 ? new Date(Date.now() + 86400000 * 7).toISOString() : null,
    }));

    const mockAuditEvents = Array.from({ length: 20 }, (_, i) => ({
        id: uuid(),
        actor_user_id: uuid(),
        actor_email: "admin@example.com",
        entity_id: uuid(),
        entity_type: ["report", "sanction", "profile", "device"][i % 4],
        action: ["report_reviewed", "sanction_applied", "profile_deleted", "device_banned"][i % 4],
        payload: { detail: "mock event" },
        checksum: "abc123def456",
        previous_checksum: i > 0 ? "prev_abc" : null,
        created_at: new Date(Date.now() - i * 1800000).toISOString(),
    }));

    const stats = {
        total_users: 1247,
        active_profiles: 892,
        pending_reports: mockReports.filter(r => r.status === "pending").length,
        active_sanctions: mockSanctions.length,
    };

    function handle(method, path, body) {
        // Auth
        if (path === "/auth/verify-otp" && method === "POST") {
            return { access_token: "mock-jwt-token", refresh_token: "mock-refresh", token_type: "bearer" };
        }

        // Dashboard stats
        if (path === "/admin/stats" && method === "GET") return stats;

        // Reports
        if (path.match(/^\/admin\/reports$/) && method === "GET") return mockReports;
        if (path.match(/^\/admin\/reports\/[^/]+$/) && method === "GET") {
            const id = path.split("/").pop();
            return mockReports.find(r => r.id === id) || mockReports[0];
        }
        if (path.match(/^\/admin\/reports\/[^/]+$/) && method === "PATCH") {
            const report = mockReports[0];
            report.status = body.status;
            return report;
        }

        // Evidence
        if (path.match(/^\/admin\/reports\/[^/]+\/evidence$/) && method === "GET") {
            return [
                { id: uuid(), mime_type: "image/png", object_key: "evidence/1.png", created_at: now() },
            ];
        }

        // Sanctions
        if (path === "/admin/sanctions" && method === "GET") return mockSanctions;
        if (path === "/admin/sanctions" && method === "POST") {
            return { id: uuid(), ...body, starts_at: now() };
        }

        // Devices
        if (path === "/admin/devices/ban" && method === "GET") {
            return [
                { device_id: "device-abc-123", reason: "Ban evasion", created_at: now() },
                { device_id: "device-xyz-789", reason: "Spam bot", created_at: now() },
            ];
        }

        // Audit
        if (path === "/admin/audit-events" && method === "GET") return mockAuditEvents;
        if (path.match(/^\/admin\/audit-events\/[^/]+\/chain$/) && method === "GET") {
            return mockAuditEvents.slice(0, 5);
        }

        console.warn("[MockAPI] Unhandled:", method, path);
        return {};
    }

    return { handle };
})();
