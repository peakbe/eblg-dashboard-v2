// ======================================================
// CONFIGURATION GLOBALE
// ======================================================

export const PROXY = "https://eblg-proxy.onrender.com";

export const ENDPOINTS = {
    metar: `${PROXY}/metar`,
    taf: `${PROXY}/taf`,
    fids: `${PROXY}/fids`
};

export const SONOS = [
  { id:"F017", lat:50.764883, lon:5.630606 },
  { id:"F001", lat:50.737, lon:5.608833 },
  { id:"F014", lat:50.718894, lon:5.573164 },
  { id:"F015", lat:50.688839, lon:5.526217 },
  { id:"F005", lat:50.639331, lon:5.323519 },
  { id:"F003", lat:50.601167, lon:5.3814 },
  { id:"F011", lat:50.601142, lon:5.356006 },
  { id:"F008", lat:50.594878, lon:5.35895 },
  { id:"F002", lat:50.588414, lon:5.370522 },
  { id:"F007", lat:50.590756, lon:5.345225 },
  { id:"F009", lat:50.580831, lon:5.355417 },
  { id:"F004", lat:50.605414, lon:5.321406 },
  { id:"F010", lat:50.599392, lon:5.313492 },
  { id:"F013", lat:50.586914, lon:5.308678 },
  { id:"F016", lat:50.619617, lon:5.295345 },
  { id:"F006", lat:50.609594, lon:5.271403 },
  { id:"F012", lat:50.621917, lon:5.254747 }
];

export const SONO_ADDRESSES = {
    "F017": "Rue de la Pommeraie, 4690 Wonck, Belgique",
    "F001": "Rue Franquet, Houtain",
    "F014": "Rue Léon Labaye, Juprelle",
    "F015": "Rue du Brouck, Juprelle",
    "F005": "Rue Caquin, Haneffe",
    "F003": "Rue Fond Méan, Saint-Georges",
    "F011": "Rue Albert 1er, Saint-Georges",
    "F008": "Rue Warfusée, Saint-Georges",
    "F002": "Rue Noiset, Saint-Georges",
    "F007": "Rue Yernawe, Saint-Georges",
    "F009": "Bibliothèque Communale, Place Verte 4470 Stockay",
    "F004": "Vinâve des Stréats, Verlaine",
    "F010": "Rue Haute Voie, Verlaine",
    "F013": "Rue Bois Léon, Verlaine",
    "F016": "Rue de Chapon-Seraing, Verlaine",
    "F006": "Rue Bolly Chapon, Seraing",
    "F012": "Rue Barbe d'Or, 4317 Aineffe"
};
// ======================================================
// HELPERS
// ======================================================

export async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Erreur fetch :", err);
        return { fallback: true, error: err.message };
    }
}

export function deg2rad(d) {
    return d * Math.PI / 180;
}

export function haversineDistance(a, b) {
    const R = 6371;
    const dLat = deg2rad(b[0] - a[0]);
    const dLon = deg2rad(b[1] - a[1]);
    const lat1 = deg2rad(a[0]);
    const lat2 = deg2rad(b[0]);

    const h = Math.sin(dLat/2)**2 +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2)**2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

export function updateStatusPanel(service, data) {
    const panel = document.getElementById("status-panel");
    if (!panel) return;

    if (data.fallback) {
        panel.className = "status-fallback";
        panel.innerText = `${service} : fallback (source offline)`;
        return;
    }

    if (data.error) {
        panel.className = "status-offline";
        panel.innerText = `${service} : offline`;
        return;
    }

    panel.className = "status-ok";
    panel.innerText = `${service} : OK`;
}
import { SONOS, SONO_ADDRESSES } from "./config.js";
import { haversineDistance } from "./helpers.js";

export let sonometers = {};
export let heatLayer = null;

export function highlightSonometerInList(id) {
    const list = document.getElementById("sono-list");
    if (!list) return;

    list.querySelectorAll(".sono-item").forEach(el =>
        el.classList.remove("sono-highlight")
    );

    const item = [...list.children].find(el => el.textContent.trim() === id);
    if (item) {
        item.classList.add("sono-highlight");
        item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

export function updateHeatmap(map) {
    if (heatLayer) map.removeLayer(heatLayer);

    const points = Object.values(sonometers).map(s => {
        let weight = 0.2;
        if (s.marker.options.color === "green") weight = 0.6;
        if (s.marker.options.color === "red") weight = 1.0;
        return [s.lat, s.lon, weight];
    });

    heatLayer = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 12,
        minOpacity: 0.3
    }).addTo(map);
}

export function showDetailPanel(id, runwayHeading) {
    const s = sonometers[id];
    if (!s) return;

    const panel = document.getElementById("detail-panel");
    const title = document.getElementById("detail-title");
    const address = document.getElementById("detail-address");
    const town = document.getElementById("detail-town");
    const status = document.getElementById("detail-status");
    const distance = document.getElementById("detail-distance");

    const fullAddress = SONO_ADDRESSES[id] || "Adresse inconnue";
    const townName = fullAddress.split(",")[1] || "—";

    const d = haversineDistance([s.lat, s.lon], runwayHeading).toFixed(2);

    title.textContent = id;
    address.textContent = fullAddress;
    town.textContent = townName.trim();
    status.textContent = s.marker.options.color.toUpperCase();
    distance.textContent = `${d} km`;

    panel.classList.remove("hidden");
}

export function initSonometers(map) {
    SONOS.forEach(s => {
        const marker = L.circleMarker([s.lat, s.lon], {
            radius: 6,
            color: "gray",
            fillColor: "gray",
            fillOpacity: 0.9,
            weight: 1
        }).addTo(map);

        const address = SONO_ADDRESSES[s.id] || "Adresse inconnue";

        marker.bindTooltip(s.id);

        marker.on("click", () => {
            marker.bindPopup(`<b>${s.id}</b><br>${address}`).openPopup();
            highlightSonometerInList(s.id);
            showDetailPanel(s.id, [50.64695, 5.44340]); // centre piste 22
        });

        sonometers[s.id] = { ...s, marker, status: "UNKNOWN" };
    });
}
// ======================================================
// RUNWAYS & CORRIDORS
// ======================================================

/**
 * Définitions des pistes EBLG.
 * heading = QFU réel
 */
export const RUNWAYS = {
    "22": {
        heading: 220,
        start: [50.64695, 5.44340],
        end:   [50.63740, 5.46010],
        width_m: 45
    },
    "04": {
        heading: 40,
        start: [50.63740, 5.46010],
        end:   [50.64695, 5.44340],
        width_m: 45
    }
};

/**
 * Corridors d’approche/départ simplifiés.
 */
export const CORRIDORS = {
    "04": [
        [50.700000, 5.300000],
        [50.670000, 5.380000],
        [50.645900, 5.443300]
    ],
    "22": [
        [50.600000, 5.600000],
        [50.620000, 5.520000],
        [50.637300, 5.463500]
    ]
};

/**
 * Dessine la piste active sur la carte.
 * @param {string} runway - "22", "04" ou "UNKNOWN"
 * @param {L.LayerGroup} layer - layer Leaflet
 */
export function drawRunway(runway, layer) {
    layer.clearLayers();
    if (runway === "UNKNOWN") return;

    const r = RUNWAYS[runway];
    const [lat1, lng1] = r.start;
    const [lat2, lng2] = r.end;

    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const px = -(dy / len);
    const py = dx / len;

    const meterToDeg = 1 / 111320;
    const halfW = (r.width_m * meterToDeg) / 2;

    const p1L = [lat1 + py * halfW, lng1 + px * halfW];
    const p1R = [lat1 - py * halfW, lng1 - px * halfW];
    const p2L = [lat2 + py * halfW, lng2 + px * halfW];
    const p2R = [lat2 - py * halfW, lng2 - px * halfW];

    L.polygon([p1L, p1R, p2R, p2L], {
        color: "#222",
        weight: 1,
        fillColor: "#333",
        fillOpacity: 0.9
    }).addTo(layer);

    L.polyline([r.start, r.end], {
        color: "#fff",
        weight: 2,
        dashArray: "8,8"
    }).addTo(layer);

    const num1 = (r.heading / 10).toFixed(0).padStart(2, "0");
    const num2 = (((r.heading + 180) % 360) / 10).toFixed(0).padStart(2, "0");

    L.marker(r.start, {
        icon: L.divIcon({ className: "runway-number", html: num1 })
    }).addTo(layer);

    L.marker(r.end, {
        icon: L.divIcon({ className: "runway-number", html: num2 })
    }).addTo(layer);
}

/**
 * Dessine le corridor d’approche/départ.
 * @param {string} runway
 * @param {L.LayerGroup} layer
 */
export function drawCorridor(runway, layer) {
    layer.clearLayers();
    if (runway === "UNKNOWN") return;

    const line = L.polyline(CORRIDORS[runway], {
        color: "orange",
        weight: 2,
        dashArray: "6,6"
    }).addTo(layer);

    if (L.polylineDecorator) {
        L.polylineDecorator(line, {
            patterns: [{
                offset: "25%",
                repeat: "50%",
                symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: { stroke: true, color: "orange" }
                })
            }]
        }).addTo(layer);
    }
}

/**
 * Détermine la piste active en fonction du vent.
 * @param {number} windDir
 * @returns {string}
 */
export function getRunwayFromWind(windDir) {
    if (!windDir) return "UNKNOWN";
    const diff22 = Math.abs(windDir - 220);
    const diff04 = Math.abs(windDir - 40);
    return diff22 < diff04 ? "22" : "04";
}

/**
 * Calcule le crosswind.
 * @returns {{crosswind:number, angleDiff:number}}
 */
export function computeCrosswind(windDir, windSpeed, runwayHeading) {
    if (!windDir || !windSpeed || !runwayHeading)
        return { crosswind: 0, angleDiff: 0 };

    const angleDiff = Math.abs(windDir - runwayHeading);
    const rad = angleDiff * Math.PI / 180;
    const crosswind = Math.round(Math.abs(windSpeed * Math.sin(rad)));

    return { crosswind, angleDiff };
}
// ======================================================
// SONOMÈTRES
// ======================================================

import { SONOS, SONO_ADDRESSES } from "./config.js";
import { haversineDistance } from "./helpers.js";

export let sonometers = {};
export let heatLayer = null;

/**
 * Surligne un sonomètre dans la liste.
 * @param {string} id
 */
export function highlightSonometerInList(id) {
    const list = document.getElementById("sono-list");
    if (!list) return;

    list.querySelectorAll(".sono-item").forEach(el =>
        el.classList.remove("sono-highlight")
    );

    const item = [...list.children].find(el => el.textContent.trim() === id);
    if (item) {
        item.classList.add("sono-highlight");
        item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

/**
 * Met à jour la heatmap en fonction des statuts.
 * @param {L.Map} map
 */
export function updateHeatmap(map) {
    if (heatLayer) map.removeLayer(heatLayer);

    const points = Object.values(sonometers).map(s => {
        let weight = 0.2;
        if (s.marker.options.color === "green") weight = 0.6;
        if (s.marker.options.color === "red") weight = 1.0;
        return [s.lat, s.lon, weight];
    });

    heatLayer = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 12,
        minOpacity: 0.3
    }).addTo(map);
}

/**
 * Affiche le panneau latéral détaillé.
 * @param {string} id
 * @param {[number,number]} runwayStart
 */
export function showDetailPanel(id, runwayStart) {
    const s = sonometers[id];
    if (!s) return;

    const panel = document.getElementById("detail-panel");
    const title = document.getElementById("detail-title");
    const address = document.getElementById("detail-address");
    const town = document.getElementById("detail-town");
    const status = document.getElementById("detail-status");
    const distance = document.getElementById("detail-distance");

    const fullAddress = SONO_ADDRESSES[id] || "Adresse inconnue";
    const townName = fullAddress.split(",")[1] || "—";

    const d = haversineDistance([s.lat, s.lon], runwayStart).toFixed(2);

    title.textContent = id;
    address.textContent = fullAddress;
    town.textContent = townName.trim();
    status.textContent = s.marker.options.color.toUpperCase();
    distance.textContent = `${d} km`;

    panel.classList.remove("hidden");
}

/**
 * Initialise les sonomètres sur la carte.
 * @param {L.Map} map
 */
export function initSonometers(map) {
    SONOS.forEach(s => {
        const marker = L.circleMarker([s.lat, s.lon], {
            radius: 6,
            color: "gray",
            fillColor: "gray",
            fillOpacity: 0.9,
            weight: 1
        }).addTo(map);

        const address = SONO_ADDRESSES[s.id] || "Adresse inconnue";

        marker.bindTooltip(s.id);

        marker.on("click", () => {
            marker.bindPopup(`<b>${s.id}</b><br>${address}`).openPopup();
            highlightSonometerInList(s.id);
            showDetailPanel(s.id, [50.64695, 5.44340]); // centre piste 22
        });

        sonometers[s.id] = { ...s, marker, status: "UNKNOWN" };
    });
}
// ======================================================
// METAR
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON, updateStatusPanel } from "./helpers.js";
import { getRunwayFromWind, computeCrosswind } from "./runways.js";
import { updateHeatmap, sonometers } from "./sonometers.js";
import { drawRunway, drawCorridor, RUNWAYS } from "./runways.js";

/**
 * Charge le METAR depuis le proxy.
 */
export async function loadMetar() {
    const data = await fetchJSON(ENDPOINTS.metar);
    updateMetarUI(data);
    updateStatusPanel("METAR", data);
}

/**
 * Met à jour l’UI METAR + piste + sonomètres.
 * @param {object} data
 */
export function updateMetarUI(data) {
    const el = document.getElementById("metar");
    if (!el) return;

    if (!data || !data.raw) {
        el.innerText = "METAR indisponible";
        drawRunway("UNKNOWN");
        drawCorridor("UNKNOWN");
        return;
    }

    el.innerText = data.raw;

    const windDir = data.wind_direction?.value;
    const windSpeed = data.wind_speed?.value;

    const runway = getRunwayFromWind(windDir);
    const r = RUNWAYS[runway];

    drawRunway(runway, window.runwayLayer);
    drawCorridor(runway, window.corridorLayer);

    updateHeatmap(window.map);
}
import { ENDPOINTS } from "./config.js";
import { fetchJSON } from "./helpers.js";

/**
 * Charge le TAF.
 */
export async function loadTaf() {
    const data = await fetchJSON(ENDPOINTS.taf);
    updateTafUI(data);
}

/**
 * Met à jour l’UI TAF.
 */
export function updateTafUI(data) {
    const el = document.getElementById("taf");
    if (!el) return;

    if (data.fallback) {
        el.innerText = "TAF indisponible (fallback)";
        return;
    }

    el.innerText = data.raw || "TAF disponible";
}
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
import { initSonometers } from "./sonometers.js";

/**
 * Initialise la carte Leaflet.
 */
export function initMap() {
    const map = L.map("map", {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView([50.643, 5.443], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    window.runwayLayer = L.layerGroup().addTo(map);
    window.corridorLayer = L.layerGroup().addTo(map);

    initSonometers(map);

    const resetBtn = document.getElementById("reset-map");
    if (resetBtn) {
        resetBtn.onclick = () => map.setView([50.643, 5.443], 11);
    }

    return map;
}
/**
 * Initialise les interactions UI (sidebar + sono toggle).
 */
export function initUI() {
    const sonoHeader = document.getElementById("sono-header");
    const sonoPanel = document.getElementById("sono-panel");
    const sonoToggle = document.getElementById("sono-toggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");

    if (sonoHeader && sonoPanel && sonoToggle) {
        sonoHeader.onclick = () => {
            sonoPanel.classList.toggle("collapsed");
            const collapsed = sonoPanel.classList.contains("collapsed");
            sonoToggle.textContent = collapsed ? "⯈" : "⯆";
        };
    }

    if (sidebar && sidebarToggle) {
        sidebarToggle.onclick = () => {
            sidebar.classList.toggle("sidebar-collapsed");
        };
    }
}
import { initMap } from "./map.js";
import { initUI } from "./ui.js";
import { loadMetar } from "./metar.js";
import { loadTaf } from "./taf.js";
import { loadFids } from "./fids.js";

window.onload = () => {
    window.map = initMap();
    initUI();
    loadMetar();
    loadTaf();
    loadFids();
};
