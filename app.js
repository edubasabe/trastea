const STRINGS = 6;
const FRETS_VISIBLE = 5;

const form = document.querySelector("#chord-form");
const input = document.querySelector("#pattern-input");
const canvas = document.querySelector("#chord-canvas");
const errorMsg = document.querySelector("#error-msg");
const mappingList = document.querySelector("#mapping-list");
const presetButtons = document.querySelectorAll(".preset");

function normalizePattern(rawValue) {
  const raw = rawValue.trim();
  if (!raw) {
    throw new Error("Ingresa un patrón de 6 valores, por ejemplo: 2212xx");
  }

  const compactFormat = /^[0-9xX]{6}$/.test(raw);
  const tokens = compactFormat
    ? raw.split("")
    : raw.split(/[\s,/-]+/).filter(Boolean);

  if (tokens.length !== STRINGS) {
    throw new Error(
      "El patrón debe tener exactamente 6 valores (de cuerda 6 a cuerda 1).",
    );
  }

  return tokens.map((token) => {
    if (/^x$/i.test(token)) {
      return "x";
    }
    if (!/^\d+$/.test(token)) {
      throw new Error("Solo se permiten números o x.");
    }
    return Number(token);
  });
}

function toSpanishFretLabel(fretNumber) {
  const labels = {
    1: "1er",
    2: "2do",
    3: "3er",
    4: "4to",
    5: "5to",
    6: "6to",
    7: "7mo",
    8: "8vo",
    9: "9no",
    10: "10mo",
    11: "11vo",
    12: "12vo",
  };
  return labels[fretNumber] ?? `${fretNumber}º`;
}

function toSpanishStringLabel(stringNumber) {
  const labels = {
    1: "1ra",
    2: "2da",
    3: "3ra",
    4: "4ta",
    5: "5ta",
    6: "6ta",
  };
  return labels[stringNumber] ?? `${stringNumber}ta`;
}

function renderMapping(tokens) {
  mappingList.innerHTML = "";

  tokens.forEach((value, index) => {
    const stringNumber = STRINGS - index;
    const stringLabel = toSpanishStringLabel(stringNumber);
    const item = document.createElement("li");

    if (value === "x") {
      item.textContent = `${stringLabel} cuerda: no se toca (x).`;
    } else if (value === 0) {
      item.textContent = `${stringLabel} cuerda: al aire (0).`;
    } else {
      item.textContent = `${toSpanishFretLabel(value)} traste de la ${stringLabel} cuerda.`;
    }

    mappingList.appendChild(item);
  });
}

function getViewportFrets(tokens) {
  const fretted = tokens.filter((value) => Number.isInteger(value) && value > 0);
  if (fretted.length === 0) {
    return { startFret: 1, endFret: FRETS_VISIBLE };
  }

  const minFret = Math.min(...fretted);
  const maxFret = Math.max(...fretted);
  let startFret = minFret <= 1 ? 1 : minFret;

  if (maxFret > startFret + FRETS_VISIBLE - 1) {
    startFret = maxFret - FRETS_VISIBLE + 1;
  }

  return {
    startFret,
    endFret: startFret + FRETS_VISIBLE - 1,
  };
}

function prepareCanvasContext() {
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;

  canvas.width = Math.floor(cssWidth * ratio);
  canvas.height = Math.floor(cssHeight * ratio);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: cssWidth, height: cssHeight };
}

function drawMutedMark(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
}

function drawOpenMark(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFilledMark(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawChord(tokens) {
  const { ctx, width, height } = prepareCanvasContext();

  const boardLeft = 62;
  const boardRight = 32;
  const topMarkerY = 40;
  const boardTop = 78;
  const boardBottom = height - 30;
  const boardWidth = width - boardLeft - boardRight;
  const boardHeight = boardBottom - boardTop;
  const stringSpacing = boardWidth / (STRINGS - 1);
  const fretSpacing = boardHeight / FRETS_VISIBLE;
  const pointRadius = Math.min(18, stringSpacing * 0.31);
  const markRadius = Math.max(9, pointRadius * 0.58);

  const { startFret, endFret } = getViewportFrets(tokens);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fcf7ee";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#14110e";
  ctx.fillStyle = "#14110e";
  ctx.lineCap = "round";

  ctx.lineWidth = 4;
  for (let stringIndex = 0; stringIndex < STRINGS; stringIndex += 1) {
    const x = boardLeft + stringIndex * stringSpacing;
    ctx.beginPath();
    ctx.moveTo(x, boardTop);
    ctx.lineTo(x, boardBottom);
    ctx.stroke();
  }

  for (let fretLine = 0; fretLine <= FRETS_VISIBLE; fretLine += 1) {
    const y = boardTop + fretLine * fretSpacing;
    ctx.lineWidth = fretLine === 0 && startFret === 1 ? 12 : 4;
    ctx.beginPath();
    ctx.moveTo(boardLeft, y);
    ctx.lineTo(boardLeft + boardWidth, y);
    ctx.stroke();
  }

  if (startFret > 1) {
    ctx.fillStyle = "#9a5732";
    ctx.font = '700 24px "Bricolage Grotesque", sans-serif';
    ctx.fillText(`${startFret}fr`, boardLeft - 54, boardTop + fretSpacing * 0.45);
    ctx.fillStyle = "#14110e";
  }

  ctx.lineWidth = 4;
  tokens.forEach((value, index) => {
    const x = boardLeft + index * stringSpacing;

    if (value === "x") {
      drawMutedMark(ctx, x, topMarkerY, 16);
      return;
    }

    if (value === 0) {
      drawOpenMark(ctx, x, topMarkerY, markRadius);
      return;
    }

    if (value < startFret || value > endFret) {
      return;
    }

    const fretIndex = value - startFret;
    const y = boardTop + (fretIndex + 0.5) * fretSpacing;
    drawFilledMark(ctx, x, y, pointRadius);
  });
}

function renderFromInput(raw) {
  try {
    const tokens = normalizePattern(raw);
    errorMsg.textContent = "";
    renderMapping(tokens);
    drawChord(tokens);
  } catch (error) {
    errorMsg.textContent = error.message;
    mappingList.innerHTML = "";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderFromInput(input.value);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.pattern;
    renderFromInput(input.value);
  });
});

window.addEventListener("resize", () => {
  renderFromInput(input.value);
});

renderFromInput(input.value);
