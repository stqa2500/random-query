const data = window.RANDOM_TABLE_DATA;
const records = Array.isArray(data?.records) ? data.records : [];
const recordByQuantity = new Map(records.map((record) => [record.quantity, record]));
const minQuantity = data?.stats?.minQuantity ?? 4;
const maxQuantity = data?.stats?.maxQuantity ?? 400;

const elements = {
  form: document.querySelector("#queryForm"),
  input: document.querySelector("#quantityInput"),
  range: document.querySelector("#quantityRange"),
  output: document.querySelector("#currentQuantity"),
  prev: document.querySelector("#prevBtn"),
  next: document.querySelector("#nextBtn"),
  status: document.querySelector("#statusLine"),
  summaryQuantity: document.querySelector("#summaryQuantity"),
  drawCount: document.querySelector("#drawCount"),
  skipCount: document.querySelector("#skipCount"),
  sourceNote: document.querySelector("#sourceNote"),
  drawTitle: document.querySelector("#drawTitle"),
  skipTitle: document.querySelector("#skipTitle"),
  drawList: document.querySelector("#drawList"),
  skipList: document.querySelector("#skipList"),
  nearbyRows: document.querySelector("#nearbyRows"),
  copyLink: document.querySelector("#copyLinkBtn"),
  quickPicks: [...document.querySelectorAll("[data-quantity]")],
  copyButtons: [...document.querySelectorAll("[data-copy]")],
};

let currentRecord = null;
let toastTimer = null;

function formatList(numbers) {
  return numbers.join("、");
}

function clampQuantity(value) {
  return Math.min(maxQuantity, Math.max(minQuantity, value));
}

function normalizeQuantity(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.trunc(value);
}

function makeChip(number, quantity) {
  const chip = document.createElement("span");
  chip.className = "number-chip";
  chip.textContent = number;
  if (number > quantity) {
    chip.classList.add("over-limit");
    chip.title = "大於目前數量，依原表保留";
  }
  return chip;
}

function renderList(container, numbers, quantity) {
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const number of numbers) {
    fragment.append(makeChip(number, quantity));
  }
  container.append(fragment);
}

function getNearby(quantity) {
  const windowSize = 5;
  let start = quantity - 2;
  let end = quantity + 2;

  if (start < minQuantity) {
    end += minQuantity - start;
    start = minQuantity;
  }
  if (end > maxQuantity) {
    start -= end - maxQuantity;
    end = maxQuantity;
  }

  start = Math.max(minQuantity, start);
  end = Math.min(maxQuantity, end);

  const nearby = [];
  for (let item = start; item <= end && nearby.length < windowSize; item += 1) {
    const record = recordByQuantity.get(item);
    if (record) {
      nearby.push(record);
    }
  }
  return nearby;
}

function renderNearby(quantity) {
  const rows = getNearby(quantity);
  const fragment = document.createDocumentFragment();

  for (const record of rows) {
    const row = document.createElement("tr");
    if (record.quantity === quantity) {
      row.className = "is-current";
    }

    const quantityCell = document.createElement("td");
    quantityCell.className = "quantity-cell";
    quantityCell.textContent = record.quantity;

    const drawCell = document.createElement("td");
    drawCell.className = "list-cell";
    const drawText = document.createElement("span");
    drawText.textContent = formatList(record.draw);
    drawCell.append(drawText);

    const skipCell = document.createElement("td");
    skipCell.className = "list-cell";
    const skipText = document.createElement("span");
    skipText.textContent = formatList(record.skip);
    skipCell.append(skipText);

    row.append(quantityCell, drawCell, skipCell);
    fragment.append(row);
  }

  elements.nearbyRows.replaceChildren(fragment);
}

function renderRecord(record, message = "") {
  currentRecord = record;
  const { quantity, draw, skip } = record;
  const overLimitCount = [...draw, ...skip].filter((number) => number > quantity).length;

  elements.input.value = quantity;
  elements.range.value = quantity;
  elements.output.value = quantity;
  elements.summaryQuantity.textContent = quantity;
  elements.drawCount.textContent = `${draw.length} 個`;
  elements.skipCount.textContent = `${skip.length} 個`;
  elements.drawTitle.textContent = `數量 ${quantity}`;
  elements.skipTitle.textContent = `數量 ${quantity}`;
  elements.status.textContent = message;
  elements.sourceNote.textContent = overLimitCount
    ? `原表保留 ${overLimitCount} 個大於目前數量的號碼`
    : "與數量範圍相符";

  elements.prev.disabled = quantity <= minQuantity;
  elements.next.disabled = quantity >= maxQuantity;

  for (const button of elements.quickPicks) {
    button.classList.toggle("is-active", Number(button.dataset.quantity) === quantity);
  }

  renderList(elements.drawList, draw, quantity);
  renderList(elements.skipList, skip, quantity);
  renderNearby(quantity);
  syncUrl(quantity);
}

function setQuantity(rawValue, options = {}) {
  const requested = normalizeQuantity(rawValue);
  if (requested === null) {
    elements.status.textContent = `請輸入 ${minQuantity} 到 ${maxQuantity} 的整數`;
    return;
  }

  const quantity = clampQuantity(requested);
  const record = recordByQuantity.get(quantity);
  if (!record) {
    elements.status.textContent = "找不到這個數量";
    return;
  }

  let message = options.message ?? "";
  if (requested !== quantity) {
    message = `已改用最接近的 ${quantity}`;
  }
  renderRecord(record, message);
}

function syncUrl(quantity) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", quantity);
  window.history.replaceState({}, "", url);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.left = "-9999px";
    document.body.append(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
  }
  showToast(successMessage);
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.remove();
  }, 2200);
}

function init() {
  elements.input.min = minQuantity;
  elements.input.max = maxQuantity;
  elements.range.min = minQuantity;
  elements.range.max = maxQuantity;

  const initialFromUrl = new URLSearchParams(window.location.search).get("q");
  const initialQuantity = normalizeQuantity(initialFromUrl) ?? minQuantity;
  setQuantity(initialQuantity);

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    setQuantity(elements.input.value);
  });

  elements.input.addEventListener("input", () => {
    setQuantity(elements.input.value);
  });

  elements.input.addEventListener("blur", () => {
    setQuantity(elements.input.value);
  });

  elements.range.addEventListener("input", () => {
    setQuantity(elements.range.value);
  });

  elements.prev.addEventListener("click", () => {
    if (currentRecord) {
      setQuantity(currentRecord.quantity - 1);
    }
  });

  elements.next.addEventListener("click", () => {
    if (currentRecord) {
      setQuantity(currentRecord.quantity + 1);
    }
  });

  for (const button of elements.quickPicks) {
    button.addEventListener("click", () => {
      setQuantity(button.dataset.quantity);
    });
  }

  for (const button of elements.copyButtons) {
    button.addEventListener("click", () => {
      if (!currentRecord) {
        return;
      }
      const key = button.dataset.copy;
      const numbers = key === "draw" ? currentRecord.draw : currentRecord.skip;
      const label = key === "draw" ? "要抽" : "不要";
      copyText(formatList(numbers), `已複製${label}清單`);
    });
  }

  elements.copyLink.addEventListener("click", () => {
    copyText(window.location.href, "已複製目前查詢連結");
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

init();
