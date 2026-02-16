export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 라우팅 (/api/...)
    if (path.startsWith("/api/")) {
      return handleAPI(request, env, path);
    }

    // 그 외 요청은 정적 파일(public/)로 자동 서빙
    return new Response("Not Found", { status: 404 });
  }
};

async function handleAPI(request, env, path) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...headers,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  try {
    // GET /api/books — 전체 목록 조회
    if (path === "/api/books" && request.method === "GET") {
      const data = await env.BOOKS_KV.get("books", "json");
      return new Response(JSON.stringify(data || []), { headers });
    }

    // POST /api/books — 전체 목록 저장 (덮어쓰기)
    if (path === "/api/books" && request.method === "POST") {
      const books = await request.json();
      await env.BOOKS_KV.put("books", JSON.stringify(books));
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}