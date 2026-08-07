const ECOCROP_BASE_URL = "https://ecocrop.apps.fao.org/ecocrop/srv/en";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const responseCache = new Map();

const SCIENTIFIC_SEARCH_TERMS = {
    maiz: "Zea", corn: "Zea",
    frijol: "Phaseolus", bean: "Phaseolus",
    // EcoCrop conserva el nombre taxonómico histórico del tomate.
    tomate: "Lycopersicon", tomato: "Lycopersicon",
    cafe: "Coffea", coffee: "Coffea",
    chile: "Capsicum", chili: "Capsicum", pepper: "Capsicum",
};

function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function decodeHtml(value) {
    return String(value || "")
        .replace(/&nbsp;/gi, " ").replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function cleanCell(value) {
    return decodeHtml(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

async function ecocropRequest(path, params = {}) {
    const url = new URL(`${ECOCROP_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });

    const cacheKey = url.toString();
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.body;

    let response;
    try {
        response = await fetch(url, {
            headers: { Accept: "text/html", "User-Agent": "ProyectoRiego/1.0 (FAO EcoCrop reference client)" },
            signal: AbortSignal.timeout(10000),
        });
    } catch {
        throw new Error("FAO EcoCrop no está disponible temporalmente. Puedes ingresar los valores manualmente.");
    }
    if (!response.ok) throw new Error("No fue posible consultar la referencia agrícola en FAO EcoCrop.");

    const body = await response.text();
    responseCache.set(cacheKey, { body, createdAt: Date.now() });
    return body;
}

export async function searchPlantVarieties(query) {
    const normalized = normalize(query);
    const searchTerm = SCIENTIFIC_SEARCH_TERMS[normalized] || String(query).trim();
    const relation = searchTerm.includes(" ") ? "contains" : "beginsWith";
    const html = await ecocropRequest("/cropList", { name: searchTerm, relation });
    const results = [];
    const rowPattern = /<tr[^>]*>[\s\S]*?cropView\?id=(\d+)[\s\S]*?class="serviceLink"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/tr>/gi;
    let match;
    while ((match = rowPattern.exec(html)) && results.length < 15) {
        const id = match[1];
        const scientificName = cleanCell(match[2]);
        if (!scientificName || results.some((item) => item.id === id)) continue;
        results.push({
            id, slug: id, nombre: scientificName, nombreComun: scientificName,
            rango: scientificName.includes("ssp.") || scientificName.includes("var.") ? "subespecie" : "especie",
        });
    }
    return results;
}

function rowCells(html, label) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const row = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?<th[^>]*>\\s*${escaped}\\s*</th>([\\s\\S]*?)</tr>`, "i"));
    if (!row) return [];
    return [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cleanCell(cell[1]));
}

function numberOrNull(value) {
    if (value === "" || value === "-" || value == null) return null;
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) ? number : null;
}

export async function getPlantReference(id) {
    if (!/^\d+$/.test(String(id))) throw new Error("La referencia de FAO EcoCrop no es válida.");
    const html = await ecocropRequest("/dataSheet", { id });
    const title = cleanCell(html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]);
    const temperatures = rowCells(html, "Temperat. requir.").map(numberOrNull);
    const rainfall = rowCells(html, "Rainfall (annual)").map(numberOrNull);
    const soilPh = rowCells(html, "Soil PH").map(numberOrNull);
    const cycleRow = html.match(/<th[^>]*>\s*Crop cycle\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    const cycleMinimum = numberOrNull(cleanCell(cycleRow?.[1]));
    const cycleMaximum = numberOrNull(cleanCell(cycleRow?.[2]));
    const harvestEstimate = cycleMinimum != null && cycleMaximum != null
        ? Math.round((cycleMinimum + cycleMaximum) / 2)
        : cycleMinimum ?? cycleMaximum;

    const reference = {
        nombre: title, nombreComun: "",
        tiempoCosechaDias: harvestEstimate,
        tiempoCosechaMinimo: cycleMinimum, tiempoCosechaMaximo: cycleMaximum,
        temperaturaMinima: temperatures[0] ?? null, temperaturaMaxima: temperatures[1] ?? null,
        temperaturaAbsolutaMinima: temperatures[2] ?? null, temperaturaAbsolutaMaxima: temperatures[3] ?? null,
        precipitacionMinima: rainfall[0] ?? null, precipitacionMaxima: rainfall[1] ?? null,
        phMinimo: soilPh[0] ?? null, phMaximo: soilPh[1] ?? null,
        humedadSueloEscala: null,
        fuente: "FAO EcoCrop", fuenteUrl: `${ECOCROP_BASE_URL}/dataSheet?id=${encodeURIComponent(id)}`,
    };
    reference.camposDisponibles = [
        reference.tiempoCosechaDias != null ? "cosecha estimada" : null,
        reference.temperaturaMinima != null ? "temperatura mínima" : null,
        reference.temperaturaMaxima != null ? "temperatura máxima" : null,
        reference.precipitacionMinima != null ? "precipitación" : null,
        reference.phMinimo != null ? "pH del suelo" : null,
    ].filter(Boolean);
    return reference;
}
