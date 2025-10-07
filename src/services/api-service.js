import axios from "axios";
import { config } from "../config/env.js";

export async function callBackendAPI(api, params) {
    if (!api) throw new Error("API code is required");

    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const trsc_dt = `${yyyy}/${mm}/${dd}`;

        const response = await axios.post(`${config.baseApiUrl}/${api}`, params, {
            headers: {
                "Content-Type": "application/json",
                "sysinfo.subproc_cd": "A330A01",
                "CH-Auth-Token": "baf25f31-68c8-4fc3-9a44-584bb51dbc48",
                "sysinfo.user_id": "ONEQ005",
                "sysinfo.trsc_dt": trsc_dt
            },
            timeout: 0,
        });

        return response.data;
    } catch (e) {
        const status = e.response?.status;
        const data = e.response?.data;
        console.error(`Error executing ${api}:`, status, data || e.message);
        throw new Error(`Failed to execute API ${api}: ${status ? `HTTP ${status}` : ""} ${e.message}`);
    }
}

