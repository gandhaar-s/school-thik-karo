const BASE = "https://kys.udiseplus.gov.in/mobileapp/api/";

export default async (request) => {
  const url = new URL(request.url);
  const udise = String(url.searchParams.get("udise") || "").trim();

  if (!/^\\d{11}$/.test(udise)) {
    return Response.json(
      { error: "Valid 11-digit UDISE code required" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const headers = {
    "accept": "application/json",
    "content-type": "application/json"
  };

  const steps = [];

  async function call(label, endpoint) {
    const r = await fetch(endpoint, { method: "GET", headers });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    steps.push({ label, status: r.status, ok: r.ok, body });
    return body;
  }

  function findId(x) {
    if (!x || typeof x !== "object") return null;
    if (x.schoolId != null) return x.schoolId;
    if (x.school_id != null) return x.school_id;
    for (const k of Object.keys(x)) {
      const found = findId(x[k]);
      if (found != null) return found;
    }
    return null;
  }

  try {
    const search = await call(
      "search",
      BASE + "search-school?searchType=3&searchParam=" + encodeURIComponent(udise)
    );

    const content = search?.data?.content || [];
    const exact = content.find(x => String(x.udiseschCode) === udise) || content[0] || null;
    const schoolId = exact?.schoolId ?? findId(search);

    if (schoolId != null) {
      await Promise.all([
        call("profile", BASE + "school/profile?schoolId=" + encodeURIComponent(schoolId)),
        call("facility", BASE + "school/facility?schoolId=" + encodeURIComponent(schoolId))
      ]);
    }

    return Response.json(
      { udise, schoolId, steps },
      {
        status: 200,
        headers: {
          "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
        }
      }
    );
  } catch (e) {
    return Response.json(
      { udise, error: String(e), steps },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
};
