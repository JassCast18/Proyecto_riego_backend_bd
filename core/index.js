import 'dotenv/config';

import { loadDatabasePasswordFromSecretsManager } from "./services/database-secret.service.js";

await loadDatabasePasswordFromSecretsManager();

const [
    { default: app },
    { startAlertMonitor },
    { startAiMonitor },
    { startSupportSync },
] = await Promise.all([
    import("./app.js"),
    import("./services/alert-monitor.service.js"),
    import("./services/ai-monitor.service.js"),
    import("./services/support-sync.service.js"),
]);


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);
    startAlertMonitor();
    startAiMonitor();
    startSupportSync();

});
