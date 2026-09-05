# Servicio local de inteligencia artificial

Servicio aislado de Random Forest. No accede a PostgreSQL ni al hardware; solamente acepta datos del backend y devuelve métricas o predicciones.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

El backend utiliza `AI_SERVICE_URL=http://127.0.0.1:8001`.
