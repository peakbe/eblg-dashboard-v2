import { ENDPOINTS } from "./config.js";
import { fetchJSON } from "./helpers.js";

/**
 * Charge les FIDS.
 */
export async function loadFids() {
    const data = await fetchJSON(ENDPOINTS.fids);
    updateFidsUI(data);
}

/**
 * Met à jour l’UI FIDS.
 */
export function updateFidsUI(data) {
    const container = document.getElementById("fids");
    if (!container) return;

    if (data.fallback) {
        container.innerHTML = `<div class="fids-row fids-unknown">FIDS indisponible</div>`;
        return;
    }

    const flights = Array.isArray(data) ? data : [];
    container.innerHTML = "";

    if (!flights.length) {
        container.innerHTML = `<div class="fids-row fids-unknown">Aucun vol disponible</div>`;
        return;
    }

    flights.forEach(flight => {
        const statusText = (flight.status || "").toLowerCase();

        let cssClass = "fids-unknown";
        if (statusText.includes("on time")) cssClass = "fids-on-time";
        if (statusText.includes("delayed")) cssClass = "fids-delayed";
        if (statusText.includes("cancel")) cssClass = "fids-cancelled";
        if (statusText.includes("board")) cssClass = "fids-boarding";

        const row = document.createElement("div");
        row.className = `fids-row ${cssClass}`;
        row.innerHTML = `
            <span>${flight.flight || "-"}</span>
            <span>${flight.destination || "-"}</span>
            <span>${flight.time || "-"}</span>
            <span>${flight.status || "-"}</span>
        `;
        container.appendChild(row);
    });
}
