const baseUrl = String(process.env.AI_SERVICE_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

async function request(path, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options, signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || `El servicio de IA respondió ${response.status}.`);
    return body;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("El servicio de IA agotó el tiempo de espera.");
    throw error;
  } finally { clearTimeout(timeout); }
}

export const checkAiHealth = () => request("/health", {}, 2500);
export const trainRandomForest = (projectId, rows) => request("/train", { method: "POST", body: JSON.stringify({ project_id: projectId, rows }) }, 120000);
export const predictWithModel = (modelPath, rows) => request("/predict", { method: "POST", body: JSON.stringify({ model_path: modelPath, rows }) });
