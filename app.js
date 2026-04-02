import { initMap } from "./js/map.js";
import "./js/runways.js";
import { loadMetar } from "./js/metar.js";
import { loadTaf } from "./js/taf.js";
import { loadFids } from "./js/fids.js";
import { initUI } from "./js/ui.js";
import { initHeatmapToggle, initHeatmapHistory } from "./js/sonometers.js";

window.onload = () => {
    window.map = initMap();
    initUI();
    initHeatmapToggle(window.map);
    initHeatmapHistory(window.map);
    loadMetar();
    loadTaf();
    loadFids();
};
