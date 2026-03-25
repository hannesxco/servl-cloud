import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirect_uri, access_token, time_min, time_max, events_to_push } = await req.json();

    // Step 1: Exchange authorization code for tokens
    if (action === "exchange_code") {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokenData);
        return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(tokenData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Refresh access token
    if (action === "refresh_token") {
      const { refresh_token } = await req.json().catch(() => ({ refresh_token: null }));
      const rt = arguments.length ? undefined : undefined; // unused
      const body = await req.clone().json().catch(() => ({}));
      const refreshToken = body.refresh_token;
      if (!refreshToken) {
        return new Response(JSON.stringify({ error: "No refresh_token provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ error: "Token refresh failed", details: tokenData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(tokenData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Fetch events from Google Calendar
    if (action === "fetch_events") {
      if (!access_token) {
        return new Response(JSON.stringify({ error: "No access_token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });
      if (time_min) params.set("timeMin", time_min);
      if (time_max) params.set("timeMax", time_max);

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const calData = await calRes.json();
      if (!calRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch events", details: calData }), {
          status: calRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(calData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Push event to Google Calendar
    if (action === "push_event") {
      if (!access_token || !events_to_push) {
        return new Response(JSON.stringify({ error: "Missing access_token or events_to_push" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const results = [];
      for (const ev of events_to_push) {
        const res = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ev),
          }
        );
        const data = await res.json();
        results.push({ ok: res.ok, data });
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 5: Return auth URL
    if (action === "get_auth_url") {
      const scopes = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-calendar error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
