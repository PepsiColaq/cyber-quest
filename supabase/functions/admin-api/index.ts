// Supabase Edge Function: admin-api
// Secrets: ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY (авто), SUPABASE_URL (авто)
// Deploy: supabase functions deploy admin-api --no-verify-jwt
// Set:   supabase secrets set ADMIN_PASSWORD=ваш_пароль

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "";
  if (!adminPassword) return json({ error: "admin_not_configured" }, 500);

  let payload: { action?: string; password?: string; day?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const pass = payload.password || req.headers.get("x-admin-password") || "";
  if (pass !== adminPassword) return json({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const action = payload.action || "ping";

  if (action === "login") {
    return json({ ok: true });
  }

  if (action === "live") {
    const cutoff = new Date(Date.now() - 45_000).toISOString();
    const { data, error } = await sb
      .from("sessions")
      .select("*")
      .gte("last_seen", cutoff)
      .neq("status", "left")
      .order("last_seen", { ascending: false })
      .limit(200);
    if (error) return json({ error: error.message }, 500);
    return json({ sessions: data || [] });
  }

  if (action === "journal") {
    const day = payload.day || new Date().toISOString().slice(0, 10);
    const from = `${day}T00:00:00.000Z`;
    const to = `${day}T23:59:59.999Z`;
    const { data: attempts, error: e1 } = await sb
      .from("attempts")
      .select("*")
      .gte("finished_at", from)
      .lte("finished_at", to)
      .order("finished_at", { ascending: false })
      .limit(500);
    if (e1) return json({ error: e1.message }, 500);

    const { data: runs, error: e2 } = await sb
      .from("game_runs")
      .select("*")
      .gte("started_at", from)
      .lte("started_at", to)
      .order("started_at", { ascending: false })
      .limit(2000);
    if (e2) return json({ error: e2.message }, 500);

    return json({ day, attempts: attempts || [], runs: runs || [] });
  }

  if (action === "summary") {
    const day = payload.day || new Date().toISOString().slice(0, 10);
    const from = `${day}T00:00:00.000Z`;
    const to = `${day}T23:59:59.999Z`;
    const { data: attempts, error } = await sb
      .from("attempts")
      .select("score, nick, games")
      .gte("finished_at", from)
      .lte("finished_at", to);
    if (error) return json({ error: error.message }, 500);
    const list = attempts || [];
    const total = list.length;
    const avg = total ? Math.round(list.reduce((s, a) => s + (a.score || 0), 0) / total) : 0;
    const best = list.reduce((m, a) => Math.max(m, a.score || 0), 0);
    const nicks = new Set(list.map((a) => (a.nick || "").toLowerCase()));
    const gameCount: Record<string, number> = {};
    list.forEach((a) => {
      (a.games || []).forEach((g: string) => {
        gameCount[g] = (gameCount[g] || 0) + 1;
      });
    });
    return json({
      day,
      total,
      avg,
      best,
      uniquePlayers: nicks.size,
      gameCount,
    });
  }

  if (action === "csv") {
    const day = payload.day || new Date().toISOString().slice(0, 10);
    const from = `${day}T00:00:00.000Z`;
    const to = `${day}T23:59:59.999Z`;
    const { data: attempts, error } = await sb
      .from("attempts")
      .select("*")
      .gte("finished_at", from)
      .lte("finished_at", to)
      .order("finished_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const rows = [["time", "nick", "score", "rank", "games", "details"].join(";")];
    (attempts || []).forEach((a) => {
      rows.push(
        [
          a.finished_at || "",
          a.nick || "",
          a.score ?? "",
          a.rank || "",
          (a.games || []).join("|"),
          JSON.stringify(a.details || {}).replace(/;/g, ","),
        ].join(";")
      );
    });
    return json({ csv: "\uFEFF" + rows.join("\n"), day });
  }

  if (action === "reset_day") {
    const day = payload.day || new Date().toISOString().slice(0, 10);
    const from = `${day}T00:00:00.000Z`;
    const to = `${day}T23:59:59.999Z`;
    const { error: e1 } = await sb.from("game_runs").delete().gte("started_at", from).lte("started_at", to);
    if (e1) return json({ error: e1.message }, 500);
    const { error: e2 } = await sb.from("attempts").delete().gte("finished_at", from).lte("finished_at", to);
    if (e2) return json({ error: e2.message }, 500);
    const { error: e3 } = await sb.from("sessions").delete().gte("started_at", from).lte("started_at", to);
    if (e3) return json({ error: e3.message }, 500);
    return json({ ok: true, day });
  }

  return json({ error: "unknown_action" }, 400);
});
