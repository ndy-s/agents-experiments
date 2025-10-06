import axios from "axios";
import { config } from "../config/env.js";

export async function callBackendAPI(api, params) {
    if (!api) throw new Error("API code is required");

    try {
        // const response = await axios.post(`${config.baseApiUrl}${api}`, params, {
        //     headers: {
        //         "Content-Type": "application/json",
        //         // Add auth headers here if needed
        //     },
        //     timeout: 10000, // 10s timeout
        // });
        //
        // return response.data;
        
        return { success: true, data: params };
    } catch (e) {
        const status = e.response?.status;
        const data = e.response?.data;
        console.error(`Error executing ${api}:`, status, data || e.message);
        throw new Error(`Failed to execute API ${api}: ${status ? `HTTP ${status}` : ""} ${e.message}`);
    }
}

