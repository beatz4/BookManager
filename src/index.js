export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      return handleAPI(request, env, path);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function handleAPI(request, env, path) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type,X-Auth-Password",
      }
    });
  }

  try {
    // GET /api/books — 누구나 조회 가능
    if (path === "/api/books" && request.method === "GET") {
      const data = await env.BOOKS_KV.get("books", "json");
      return new Response(JSON.stringify(data || []), { headers });
    }

    // POST /api/books — 비밀번호 필요
    if (path === "/api/books" && request.method === "POST") {
      const password = request.headers.get("X-Auth-Password");
      if (!password || password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "비밀번호가 틀렸습니다." }), {
          status: 401, headers
        });
      }
      const books = await request.json();
      await env.BOOKS_KV.put("books", JSON.stringify(books));
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // POST /api/verify — 비밀번호 확인용
    if (path === "/api/verify" && request.method === "POST") {
      const { password } = await request.json();
      const ok = password === env.ADMIN_PASSWORD;
      return new Response(JSON.stringify({ ok }), { headers });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}