const STORAGE_KEY = "tadeo-game-progress-v1";

const agendaItems = [
  "Alimentar a su perro",
  "Ir a la papelería por 5 cuadernos y una caja de colores",
  "Comprar un regalo para Eloísa",
  "Ayudar con la cena",
];

const discoveries = [
  {
    title: "La igualdad",
    text: "Las expresiones a ambos lados del signo igual tienen el mismo valor, aunque estén escritas de forma diferente.",
    example: "30 + 30 + 30 + 30 = 120",
  },
  {
    title: "La incógnita",
    text: "Una incógnita es una cantidad cuyo valor necesitamos encontrar. Podemos representarla con una letra o un símbolo.",
    example: "300 × △ = 900; por eso △ = 3",
  },
  {
    title: "La ecuación",
    text: "Una ecuación es una igualdad en la que aparece una cantidad desconocida. Resolverla es encontrar el valor que conserva la igualdad.",
    example: "5x + 45 = 195; por eso x = 30",
  },
  {
    title: "Modelar ingresos y gastos",
    text: "Cada término cuenta una parte de la historia: 4x son los ingresos iguales, −180 es el gasto y 300 es el dinero restante.",
    example: "4x − 180 = 300; por eso x = 120",
  },
  {
    title: "Dos expresiones equivalentes",
    text: "Podemos igualar dos expresiones para descubrir cuándo representan la misma cantidad.",
    example: "150x + 100 = 100x + 300; por eso x = 4",
  },
];

const symbols = ["x", "a", "?", "△", "□", "○", "★", "◆"];

const imageChoice = (name, value, image, label) => `
  <label class="choice-card">
    <input type="radio" name="${name}" value="${value}" />
    <span><img src="${image}" alt="" />${label}</span>
  </label>`;

const symbolChoice = (symbol) => `
  <label class="symbol-choice">
    <input type="radio" name="symbol" value="${symbol}" />
    <span>${symbol}</span>
  </label>`;

const normalizeEquation = (value) =>
  value
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("·", "")
    .replaceAll("*", "")
    .replaceAll("−", "-");

const scenes = [
  {
    label: "Situación 1 · Habitación",
    title: "Organizando el tiempo",
    setup: "Tengo 120 minutos y cuatro actividades. Quiero dedicarles el mismo tiempo a todas. ¿Cómo puedo repartirlo?",
    background: "./assets/scenes/habitacion.png",
    character: "./assets/characters/tadeo-pensando.png",
    challengeTitle: "Reparte el tiempo de forma equitativa",
    intro: "Completa la cantidad que falta. Después piensa qué representa cada lado del signo igual.",
    equation: "□ + □ + □ + □ = 120",
    form: `
      <label class="field-group">
        <span class="field-label">¿Cuántos minutos puede dedicar Tadeo a cada actividad?</span>
        <input class="text-input" inputmode="numeric" name="minutes" placeholder="Escribe una cantidad" autocomplete="off" required />
      </label>`,
    validate(data) {
      if (data.get("minutes")?.trim() === "30") return { ok: true };
      return { ok: false, hint: "Pista: busca cuatro cantidades iguales que, al sumarse, den 120." };
    },
    success: "¡Exacto! Cuatro grupos de 30 minutos representan los mismos 120 minutos.",
  },
  {
    label: "Situación 2 · Patio",
    title: "Alimentando a su mascota",
    setup: "La bolsa contiene 900 g y mi perro come 300 g cada día. Necesito saber cuántos días durará y agendar la compra antes de que se termine.",
    background: "./assets/scenes/patio.png",
    character: "./assets/characters/perro.png",
    challengeTitle: "Representa una cantidad desconocida",
    intro: "Elige una representación para la incógnita y calcula cuánto durará el alimento.",
    equation: "300 × incógnita = 900",
    form: `
      <fieldset class="field-group">
        <legend>¿Qué símbolo quieres usar para el número de días?</legend>
        <div class="symbol-grid">${symbols.map(symbolChoice).join("")}</div>
      </fieldset>
      <label class="field-group">
        <span class="field-label">¿Para cuántos días alcanza la bolsa?</span>
        <input class="text-input" inputmode="numeric" name="days" placeholder="Número de días" autocomplete="off" required />
      </label>
      <label class="field-group">
        <span class="field-label">Si compra alimento un día antes, ¿en qué día debe anotarlo?</span>
        <input class="text-input" inputmode="numeric" name="buyDay" placeholder="Día de compra" autocomplete="off" required />
      </label>`,
    validate(data) {
      if (!data.get("symbol")) return { ok: false, hint: "Primero elige una letra o un símbolo para representar el número de días." };
      if (data.get("days")?.trim() !== "3") return { ok: false, hint: "Pista: ¿cuántos grupos de 300 g caben en 900 g?" };
      if (data.get("buyDay")?.trim() !== "2") return { ok: false, hint: "La bolsa dura 3 días. Tadeo quiere comprar otra un día antes de que se termine." };
      return { ok: true };
    },
    success: "¡Muy bien! La bolsa dura 3 días y Tadeo debe anotar la compra para el día 2.",
  },
  {
    label: "Situación 3 · Papelería",
    title: "En la papelería",
    setup: "Necesito 5 cuadernos iguales y una caja de colores de $45. Tengo $195 y quiero gastarlos exactamente.",
    background: "./assets/scenes/papeleria.png",
    character: "./assets/characters/encargado-papeleria.png",
    challengeTitle: "Construye y resuelve la ecuación",
    intro: "Usa x para el precio de un cuaderno. Luego elige la opción que mantiene verdadera la igualdad.",
    equation: "5 veces el precio + 45 = 195",
    form: `
      <label class="field-group">
        <span class="field-label">Escribe la ecuación de la compra</span>
        <input class="text-input" name="equation" placeholder="Ejemplo: 2x + 10 = 50" autocomplete="off" required />
      </label>
      <fieldset class="field-group">
        <legend>¿Qué cuaderno puede comprar?</legend>
        <div class="choice-grid">
          ${imageChoice("notebook", "30", "./assets/objects/cuaderno-a.png", "Cuaderno A · $30")}
          ${imageChoice("notebook", "35", "./assets/objects/cuaderno-b.png", "Cuaderno B · $35")}
          ${imageChoice("notebook", "40", "./assets/objects/cuaderno-c.png", "Cuaderno C · $40")}
        </div>
      </fieldset>`,
    validate(data) {
      const equation = normalizeEquation(data.get("equation") || "");
      if (!["5x+45=195", "45+5x=195"].includes(equation)) return { ok: false, hint: "Pista: representa cinco cuadernos de precio x y después suma los $45 de los colores." };
      if (data.get("notebook") !== "30") return { ok: false, hint: "Sustituye x por cada precio. ¿Con cuál obtienes exactamente $195?" };
      return { ok: true };
    },
    success: "¡Compra resuelta! 5(30) + 45 = 195, así que el cuaderno A es la opción correcta.",
  },
  {
    label: "Situación 4 · Tienda de regalos",
    title: "Registrando sus gastos",
    setup: "Después de comprar un regalo de $180 me quedan $300. Olvidé registrar cuatro ingresos iguales. ¿Cuánto fue cada uno?",
    background: "./assets/scenes/regalos.png",
    character: "./assets/characters/encargada-regalos.png",
    challengeTitle: "Reconstruye el registro de ahorros",
    intro: "Todos los regalos cuestan $180. Elige uno y representa los cuatro ingresos iguales con x.",
    equation: "4 ingresos iguales − $180 = $300",
    form: `
      <fieldset class="field-group">
        <legend>Elige el regalo para Eloísa</legend>
        <div class="choice-grid">
          ${imageChoice("gift", "peluche", "./assets/objects/regalo-peluche.png", "Peluche · $180")}
          ${imageChoice("gift", "caja", "./assets/objects/regalo-caja.png", "Caja sorpresa · $180")}
          ${imageChoice("gift", "lampara", "./assets/objects/regalo-lampara.png", "Lámpara · $180")}
        </div>
      </fieldset>
      <label class="field-group">
        <span class="field-label">Escribe la ecuación del registro</span>
        <input class="text-input" name="equation" placeholder="Usa x para cada ingreso" autocomplete="off" required />
      </label>
      <label class="field-group">
        <span class="field-label">¿De cuánto fue cada ingreso?</span>
        <input class="text-input" inputmode="numeric" name="income" placeholder="Cantidad en pesos" autocomplete="off" required />
      </label>`,
    validate(data) {
      if (!data.get("gift")) return { ok: false, hint: "Elige cualquiera de los tres regalos; todos cuestan lo mismo." };
      if (normalizeEquation(data.get("equation") || "") !== "4x-180=300") return { ok: false, hint: "Pista: cuatro ingresos iguales forman 4x; después resta el gasto de $180." };
      if (data.get("income")?.trim() !== "120") return { ok: false, hint: "Suma $180 a los $300 restantes y reparte el total entre los cuatro ingresos." };
      return { ok: true };
    },
    success: "¡Registro completo! Cada ingreso fue de $120: 4(120) − 180 = 300.",
  },
  {
    label: "Situación 5 · Cocina",
    title: "Ayudando con la cena",
    setup: "La receta 1 usa 150 g por porción y 100 g de guarnición. La receta 2 usa 100 g por porción y 300 g de guarnición.",
    background: "./assets/scenes/cocina.png",
    character: "./assets/characters/mama.png",
    challengeTitle: "¿Cuándo usan la misma cantidad?",
    intro: "Representa con x el número de porciones, iguala las dos recetas y elige cuál preparar.",
    equation: "Cantidad de la receta 1 = Cantidad de la receta 2",
    form: `
      <label class="field-group">
        <span class="field-label">Escribe la ecuación que compara las recetas</span>
        <input class="text-input" name="equation" placeholder="Expresión 1 = expresión 2" autocomplete="off" required />
      </label>
      <label class="field-group">
        <span class="field-label">¿Para cuántas porciones usan la misma cantidad?</span>
        <input class="text-input" inputmode="numeric" name="portions" placeholder="Número de porciones" autocomplete="off" required />
      </label>
      <fieldset class="field-group">
        <legend>¿Cuál receta quieres preparar?</legend>
        <div class="choice-grid">
          ${imageChoice("recipe", "1", "./assets/objects/receta-1.png", "Receta 1")}
          ${imageChoice("recipe", "2", "./assets/objects/receta-2.png", "Receta 2")}
        </div>
      </fieldset>`,
    validate(data) {
      const equation = normalizeEquation(data.get("equation") || "");
      const validEquations = ["150x+100=100x+300", "100x+300=150x+100"];
      if (!validEquations.includes(equation)) return { ok: false, hint: "Pista: suma a cada cantidad por porción la carne de su guarnición y relaciona ambas expresiones con =." };
      if (data.get("portions")?.trim() !== "4") return { ok: false, hint: "Prueba con 4: calcula por separado 150(4) + 100 y 100(4) + 300." };
      if (!data.get("recipe")) return { ok: false, hint: "Las dos recetas usan 700 g para 4 porciones. Puedes elegir cualquiera." };
      return { ok: true };
    },
    success: "¡Las expresiones coinciden! Para 4 porciones, ambas recetas necesitan 700 g de carne.",
  },
];

const app = document.querySelector("#app");
const timeValue = document.querySelector("#time-value");
const progressBar = document.querySelector("#progress-bar");
const discoveryCount = document.querySelector("#discovery-count");
const agendaDialog = document.querySelector("#agenda-dialog");
const discoveriesDialog = document.querySelector("#discoveries-dialog");
const agendaList = document.querySelector("#agenda-list");
const discoveriesList = document.querySelector("#discoveries-list");
const toast = document.querySelector("#toast");

const defaultState = { started: false, currentScene: 0, completedScenes: [], unlocked: [] };

const loadState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return { ...defaultState };
    return {
      started: Boolean(saved.started),
      currentScene: Number.isInteger(saved.currentScene) ? Math.min(Math.max(saved.currentScene, 0), scenes.length) : 0,
      completedScenes: Array.isArray(saved.completedScenes) ? saved.completedScenes.filter((value) => Number.isInteger(value) && value >= 0 && value < scenes.length) : [],
      unlocked: Array.isArray(saved.unlocked) ? saved.unlocked.filter((value) => Number.isInteger(value) && value >= 0 && value < discoveries.length) : [],
    };
  } catch {
    return { ...defaultState };
  }
};

let state = loadState();
let toastTimer;

const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const agendaCompleted = () => state.completedScenes.filter((sceneIndex) => sceneIndex > 0).length;

const showToast = (message) => {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
};

const updateChrome = () => {
  const done = agendaCompleted();
  timeValue.textContent = String(Math.max(120 - done * 30, 0));
  discoveryCount.textContent = String(state.unlocked.length);
  progressBar.style.width = `${Math.round((state.completedScenes.length / scenes.length) * 100)}%`;

  agendaList.innerHTML = agendaItems
    .map((item, index) => `<li class="${index < done ? "done" : ""}"><span class="check" aria-hidden="true">${index < done ? "✓" : ""}</span><span>${item}</span></li>`)
    .join("");

  if (!state.unlocked.length) {
    discoveriesList.innerHTML = '<p class="empty-state">Completa el primer reto para desbloquear tu primera tarjeta.</p>';
  } else {
    discoveriesList.innerHTML = state.unlocked
      .map((index) => {
        const item = discoveries[index];
        return `<article class="discovery-card"><h3>${item.title}</h3><p>${item.text}</p><code>${item.example}</code></article>`;
      })
      .join("");
  }
};

const renderStart = () => {
  app.innerHTML = `
    <section class="screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">Una tarde · Cinco descubrimientos</span>
          <h1>El día de Tadeo</h1>
          <p>Hola, tengo 13 años y hoy hay varias cosas pendientes. Solo dispongo de 120 minutos. ¿Me ayudas a organizar mi tarde y resolver los retos?</p>
          <button class="primary-button" type="button" data-action="start">Abrir la agenda <span aria-hidden="true">→</span></button>
        </div>
        <div class="hero-character"><img src="./assets/characters/tadeo.png" alt="Tadeo, protagonista del juego" /></div>
      </div>
    </section>`;
};

const renderScene = () => {
  const sceneIndex = state.currentScene;
  const scene = scenes[sceneIndex];
  const solved = state.completedScenes.includes(sceneIndex);
  app.innerHTML = `
    <section class="story-screen">
      <div class="scene-visual" style="background-image: url('${scene.background}')">
        <img class="character-sprite" src="${scene.character}" alt="" />
        <div class="scene-caption">
          <span class="scene-label">${scene.label}</span>
          <h2>${scene.title}</h2>
          <p>${scene.setup}</p>
        </div>
      </div>
      <div class="challenge-panel">
        <div class="challenge-inner">
          <div class="step-indicator"><span>Reto ${sceneIndex + 1} de ${scenes.length}</span><span class="step-line"></span><span>Sin penalizaciones</span></div>
          <h3>${scene.challengeTitle}</h3>
          <p class="challenge-intro">${scene.intro}</p>
          <div class="equation-card">${scene.equation}</div>
          <form class="challenge-form" id="challenge-form" novalidate>
            ${scene.form}
            <p class="feedback ${solved ? "success" : ""}" id="feedback" role="status">${solved ? scene.success : ""}</p>
            <div class="form-actions">
              <button class="primary-button" type="submit" ${solved ? "disabled" : ""}>Comprobar</button>
              <button class="secondary-button" type="button" data-action="continue" ${solved ? "" : "hidden"}>Continuar <span aria-hidden="true">→</span></button>
            </div>
          </form>
          ${solved ? discoveryMarkup(sceneIndex) : ""}
        </div>
      </div>
    </section>`;
};

const discoveryMarkup = (index) => {
  const discovery = discoveries[index];
  return `<aside class="discovery-unlocked"><strong>✦ Descubrimiento desbloqueado: ${discovery.title}</strong><span>${discovery.text}</span></aside>`;
};

const renderFinish = () => {
  app.innerHTML = `
    <section class="screen finish-screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">Día completado</span>
          <h1>¡Todo listo!</h1>
          <p>Tadeo terminó lo que tenía pendiente. Después de cenar con su familia, guarda su agenda y se prepara para dormir.</p>
          <ul class="finish-list">${agendaItems.map((item) => `<li>${item}</li>`).join("")}</ul>
          <div class="form-actions">
            <button class="primary-button" type="button" data-action="discoveries">Ver mis descubrimientos</button>
            <button class="secondary-button" type="button" data-action="reset">Jugar de nuevo</button>
          </div>
        </div>
        <div class="hero-character"><img src="./assets/characters/tadeo-celebrando.png" alt="Tadeo celebra que completó su agenda" /></div>
      </div>
    </section>`;
};

const render = () => {
  updateChrome();
  if (!state.started) renderStart();
  else if (state.currentScene >= scenes.length) renderFinish();
  else renderScene();
  app.focus({ preventScroll: true });
};

const completeCurrentScene = () => {
  const sceneIndex = state.currentScene;
  if (!state.completedScenes.includes(sceneIndex)) state.completedScenes.push(sceneIndex);
  if (!state.unlocked.includes(sceneIndex)) state.unlocked.push(sceneIndex);
  saveState();
  updateChrome();

  const feedback = document.querySelector("#feedback");
  feedback.textContent = scenes[sceneIndex].success;
  feedback.classList.add("success");
  document.querySelectorAll("#challenge-form input, #challenge-form button[type='submit']").forEach((element) => { element.disabled = true; });
  document.querySelector("[data-action='continue']").hidden = false;
  document.querySelector(".challenge-inner").insertAdjacentHTML("beforeend", discoveryMarkup(sceneIndex));
  showToast(`Nuevo descubrimiento: ${discoveries[sceneIndex].title}`);
};

document.addEventListener("submit", (event) => {
  if (event.target.id !== "challenge-form") return;
  event.preventDefault();
  const result = scenes[state.currentScene].validate(new FormData(event.target));
  const feedback = document.querySelector("#feedback");
  if (!result.ok) {
    feedback.textContent = result.hint;
    feedback.classList.remove("success");
    return;
  }
  completeCurrentScene();
});

document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  if (action === "start") {
    state.started = true;
    saveState();
    agendaDialog.showModal();
    render();
  }

  if (action === "continue") {
    state.currentScene += 1;
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "discoveries") discoveriesDialog.showModal();

  if (action === "reset") {
    state = { ...defaultState, completedScenes: [], unlocked: [] };
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});

document.querySelector("#agenda-button").addEventListener("click", () => agendaDialog.showModal());
document.querySelector("#discoveries-button").addEventListener("click", () => discoveriesDialog.showModal());
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

render();
