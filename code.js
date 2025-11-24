const UI_WIDTH = 420;
const UI_HEIGHT = 600;
const LARGE_NODE_THRESHOLD = 4096;

const DEFAULT_OPTIONS = {
  format: "PNG",
  scale: 1,
  quality: 0.8,
  background: "transparent",
  dpi: 72,
  thumbnail: true
};

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });

let cachedSelectionSummary = null;

function summarizeSelection() {
  const selection = figma.currentPage.selection;
  if (!selection.length) {
    cachedSelectionSummary = null;
    figma.ui.postMessage({ type: "SELECTION_EMPTY" });
    return;
  }

  const target = selection[0];
  const bounds = target.absoluteBoundingBox || { width: target.width, height: target.height };
  const hasImageFill =
    "fills" in target && Array.isArray(target.fills)
      ? target.fills.some((fill) => fill.type === "IMAGE")
      : false;

  cachedSelectionSummary = {
    nodeId: target.id,
    name: target.name,
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    type: target.type,
    hasImageFill
  };

  figma.ui.postMessage({ type: "SELECTION_DATA", payload: cachedSelectionSummary });
}

figma.on("selectionchange", summarizeSelection);
summarizeSelection();

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "REQUEST_SELECTION":
        summarizeSelection();
        break;
      case "REQUEST_PREVIEW":
        await handlePreviewRequest(msg.payload);
        break;
      case "REQUEST_EXPORT":
        await handleExportRequest(msg.payload);
        break;
      default:
        console.warn("Unknown message type", msg.type);
    }
  } catch (error) {
    console.error("Plugin error:", error);
    figma.notify("오류가 발생했습니다. 콘솔을 확인하세요.");
    figma.ui.postMessage({ type: "PLUGIN_ERROR", message: String(error) });
  }
};

async function handlePreviewRequest(payload) {
  if (!cachedSelectionSummary) {
    figma.ui.postMessage({ type: "SELECTION_EMPTY" });
    return;
  }
  const node = figma.getNodeById(cachedSelectionSummary.nodeId);
  if (!node || !("exportAsync" in node)) {
    figma.ui.postMessage({ type: "UNSUPPORTED_NODE" });
    return;
  }

  const exportSettings = createExportSettings(payload);
  const arrayBuffer = await node.exportAsync(exportSettings);
  const uint8 = new Uint8Array(arrayBuffer);
  const base64 = figma.base64Encode(uint8);

  figma.ui.postMessage({
    type: "PREVIEW_RESPONSE",
    payload: {
      requestId: payload.requestId,
      base64,
      bytes: uint8.byteLength,
      format: exportSettings.format
    }
  });
}

async function handleExportRequest(payload) {
  if (!cachedSelectionSummary) {
    figma.ui.postMessage({ type: "SELECTION_EMPTY" });
    return;
  }
  const node = figma.getNodeById(cachedSelectionSummary.nodeId);
  if (!node || !("exportAsync" in node)) {
    figma.ui.postMessage({ type: "UNSUPPORTED_NODE" });
    return;
  }

  const exportSettings = createExportSettings(payload);
  const arrayBuffer = await node.exportAsync(exportSettings);
  const uint8 = new Uint8Array(arrayBuffer);
  const base64 = figma.base64Encode(uint8);
  const filename = buildFilename(cachedSelectionSummary.name, exportSettings, payload.quality);

  figma.ui.postMessage({
    type: "EXPORT_RESPONSE",
    payload: {
      base64,
      bytes: uint8.byteLength,
      filename
    }
  });
  figma.notify("Export 완료 – UI에서 다운로드 가능합니다.");
}

function createExportSettings(options = {}) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const format = merged.format.toLowerCase();
  const exportSettings = {
    format,
    constraint: { type: "SCALE", value: merged.scale || 1 },
    useAbsoluteBounds: true
  };

  if (format === "jpg" || format === "jpeg") {
    exportSettings.format = "JPG";
    exportSettings.jpgQuality = clamp(merged.quality, 0.01, 1);
    exportSettings.backgroundColor = normalizeBackground(merged.background);
  } else if (format === "png") {
    exportSettings.format = "PNG";
    exportSettings.backgroundColor =
      merged.background === "transparent" ? undefined : normalizeBackground(merged.background);
  } else if (format === "webp") {
    exportSettings.format = "WEBP";
    exportSettings.webpQuality = clamp(merged.quality, 0.01, 1);
  }
  return exportSettings;
}

function normalizeBackground(color) {
  if (!color || color === "transparent") {
    return undefined;
  }
  const cleaned = color.replace("#", "");
  const bigint = parseInt(cleaned.length === 3 ? expandHex(cleaned) : cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

function expandHex(shortHex) {
  return shortHex
    .split("")
    .map((char) => char + char)
    .join("");
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function buildFilename(name, exportSettings, quality) {
  const safeName = name.replace(/[^a-z0-9-_]/gi, "_").slice(0, 40) || "image";
  const format = (exportSettings.format || "png").toLowerCase();
  const scale = exportSettings.constraint?.value || 1;
  const qualityTag = quality ? `_${Math.round(quality * 100)}` : "";
  return `${safeName}_${scale}x${qualityTag}.${format}`;
}

figma.ui.postMessage({
  type: "PLUGIN_READY",
  payload: { largeSizeThreshold: LARGE_NODE_THRESHOLD }
});


