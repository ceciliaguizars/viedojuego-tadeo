const navToggle = document.querySelector(".nav-toggle");
const teacherNav = document.querySelector("#teacher-nav");

if (navToggle && teacherNav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    teacherNav.classList.toggle("open", !expanded);
  });
}

const passwordToggle = document.querySelector("[data-toggle-password]");
if (passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const input = document.getElementById(passwordToggle.getAttribute("aria-controls"));
    if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    passwordToggle.textContent = showing ? "Mostrar" : "Ocultar";
  });
}

const feedback = document.querySelector("[data-copy-feedback]");
const announceCopy = (message) => {
  if (feedback) feedback.textContent = message;
};

const copyText = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

document.querySelectorAll("[data-code]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = button.dataset.code;
    const copied = await copyText(code);
    announceCopy(copied ? `Folio ${code} copiado.` : `No se pudo copiar. Folio: ${code}`);
  });
});

const copyCodesButton = document.querySelector("[data-copy-codes]");
if (copyCodesButton) {
  copyCodesButton.addEventListener("click", async () => {
    const codes = [...document.querySelectorAll("[data-code]:not(.used)")].map((item) => item.dataset.code);
    const copied = await copyText(codes.join("\n"));
    announceCopy(copied ? `${codes.length} folios disponibles copiados.` : "No se pudieron copiar los folios.");
  });
}

const printButton = document.querySelector("[data-print-codes]");
if (printButton) printButton.addEventListener("click", () => window.print());

const searchInput = document.querySelector("[data-result-search]");
const statusFilter = document.querySelector("[data-status-filter]");
const resultRows = [...document.querySelectorAll("[data-code-row]")];
const filterEmpty = document.querySelector("[data-filter-empty]");

const filterResults = () => {
  const query = (searchInput?.value || "").trim().toUpperCase();
  const selectedStatus = statusFilter?.value || "";
  let visible = 0;
  resultRows.forEach((row) => {
    const matchesCode = !query || row.dataset.codeRow.includes(query);
    const matchesStatus = !selectedStatus || row.dataset.status === selectedStatus;
    row.hidden = !(matchesCode && matchesStatus);
    if (!row.hidden) visible += 1;
  });
  if (filterEmpty) filterEmpty.hidden = visible > 0 || resultRows.length === 0;
};

searchInput?.addEventListener("input", filterResults);
statusFilter?.addEventListener("change", filterResults);
