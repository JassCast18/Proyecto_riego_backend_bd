import 'dotenv/config';

import app from "./app.js";
import { startAlertMonitor } from "./services/alert-monitor.service.js";


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);
    startAlertMonitor();

});
