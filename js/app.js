const LEGACY_SESSION_STORAGE_KEY = "tadeo-research-session-v1";
const PENDING_ATTEMPT_KEY = "tadeo-pending-attempt-v1";
const ACTIVITY_QUEUE_KEY = "tadeo-activity-queue-v1";
const SESSION_STORAGE_KEY = "tadeo-3situaciones-session-v1";
const OUTBOX_STORAGE_KEY = "tadeo-3situaciones-outbox-v1";
const FLOW_PROGRESS_KEY = "tadeo-3situaciones-progress-v1";
const EXPERIENCE_VERSION = "tadeo-3situaciones-1";
const SITUATION_ONE_PROGRESS_KEY = "tadeo-situation-one-progress-v1";
const SITUATION_TWO_PROGRESS_KEY = "tadeo-situation-two-progress-v1";
const SITUATION_THREE_PROGRESS_KEY = "tadeo-situation-three-progress-v1";
const SITUATION_FOUR_PROGRESS_KEY = "tadeo-situation-four-progress-v1";
const SITUATION_FIVE_PROGRESS_KEY = "tadeo-situation-five-progress-v1";

const EXPERIENCE_ROUTE = Object.freeze({
  version: EXPERIENCE_VERSION,
  introScreens: Object.freeze({
    home: 1,
    folio: 2,
    presentation: 3,
    initialAgenda: 4,
  }),
  situations: Object.freeze([
    Object.freeze({ id: 1, key: "organizando-tiempo", title: "Organizando el tiempo", screenCount: 6, activityIndex: null }),
    Object.freeze({ id: 2, key: "papeleria", title: "En la papelería", screenCount: 10, activityIndex: 0 }),
    Object.freeze({ id: 3, key: "dinero", title: "Registrando su dinero", screenCount: 8, activityIndex: 1 }),
  ]),
  closingScreens: Object.freeze(["completedAgenda", "closing", "finalization"]),
});

const buildExperienceFlow = (route) => {
  let nextScreen = route.introScreens.initialAgenda + 1;
  const situations = route.situations.map((situation) => {
    const startScreen = nextScreen;
    const endScreen = startScreen + situation.screenCount - 1;
    nextScreen = endScreen + 1;
    return Object.freeze({ ...situation, startScreen, endScreen });
  });
  const screens = { ...route.introScreens };
  route.closingScreens.forEach((name) => {
    screens[name] = nextScreen;
    nextScreen += 1;
  });
  return Object.freeze({
    version: route.version,
    totalScreens: nextScreen - 1,
    screens: Object.freeze(screens),
    situations: Object.freeze(situations),
  });
};

const EXPERIENCE_FLOW = buildExperienceFlow(EXPERIENCE_ROUTE);

const agendaItems = [
  "Ir a la papelería a comprar 5 cuadernos y un paquete de colores.",
  "Comprar un regalo para Eloísa.",
];

const initialAgendaIcons = [
  "./assets/objects/icono_papeleria.png",
  "./assets/objects/icono_regalo.png",
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

const unknownRepresentations = [
  { value: "x", image: "./assets/objects/incognita_x.png", label: "Letra x" },
  { value: "a", image: "./assets/objects/incognita_a.png", label: "Letra a" },
  { value: "?", image: "./assets/objects/incognita_interrogacion.png", label: "Signo de interrogación" },
  { value: "△", image: "./assets/objects/incognita_triangulo.png", label: "Triángulo" },
  { value: "□", image: "./assets/objects/incognita_rectangulo.png", label: "Rectángulo" },
  { value: "○", image: "./assets/objects/incognita_circulo.png", label: "Círculo" },
  { value: "★", image: "./assets/objects/incognita_estrella.png", label: "Estrella" },
  { value: "◆", image: "./assets/objects/incognita_rombo.png", label: "Rombo" },
];

const imageChoice = (name, value, image, label) => `
  <label class="choice-card">
    <input type="radio" name="${name}" value="${value}" />
    <span><img src="${image}" alt="" />${label}</span>
  </label>`;

const unknownRepresentationButton = (name, option, selectedValue = "", index = 0) => {
  const isSelected = option.value === selectedValue;
  const isTabStop = isSelected || (!selectedValue && index === 0);
  return `
  <button class="s2-symbol-button${isSelected ? " selected" : ""}" type="button" role="radio" aria-checked="${isSelected}" aria-label="${option.label}" tabindex="${isTabStop ? "0" : "-1"}" data-s2-symbol="${option.value}" data-symbol-name="${name}">
    <img src="${option.image}" alt="" />
  </button>`;
};

const answerChoice = (name, value, label) => `
  <label class="answer-choice">
    <input type="radio" name="${name}" value="${value}" />
    <span>${label}</span>
  </label>`;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const normalizeEquation = (value) =>
  value
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("·", "")
    .replaceAll("*", "")
    .replaceAll("×", "")
    .replaceAll("$", "")
    .replaceAll("−", "-");

const exactNumber = (data, name, expected) => data.get(name)?.trim() === String(expected);

const equationIs = (data, name, validEquations) =>
  validEquations.includes(normalizeEquation(data.get(name) || ""));

const scenes = [
  {
    label: "Situación 1 · Habitación",
    title: "Organizando el tiempo",
    setup: "Tengo 120 minutos y cuatro actividades. Quiero dedicarles el mismo tiempo a todas. ¿Cómo puedo repartirlo?",
    background: "./assets/scenes/habitacion.png",
    character: "./assets/characters/tadeo-pensando.png",
    steps: [
      {
        title: "Explora la situación",
        intro: "Identifica primero los datos que Tadeo encontró en su agenda.",
        equation: "Tiempo disponible ÷ actividades",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos minutos tiene Tadeo en total?</span>
            <input class="text-input" inputmode="numeric" name="total" placeholder="Minutos disponibles" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿Cuántas actividades debe realizar?</span>
            <input class="text-input" inputmode="numeric" name="activities" placeholder="Número de actividades" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!exactNumber(data, "total", 120)) return { ok: false, hint: "Revisa el reloj: Tadeo dispone de 120 minutos en total." };
          if (!exactNumber(data, "activities", 4)) return { ok: false, hint: "Cuenta las actividades anotadas en la agenda: son cuatro." };
          return { ok: true };
        },
        success: "Correcto: Tadeo tiene 120 minutos para realizar 4 actividades.",
      },
      {
        title: "Reparte el tiempo",
        intro: "Como todas las actividades deben durar lo mismo, reparte los 120 minutos en cuatro partes iguales.",
        equation: "□ + □ + □ + □ = 120",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos minutos puede dedicar a cada actividad?</span>
            <input class="text-input" inputmode="numeric" name="minutes" placeholder="Minutos por actividad" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (exactNumber(data, "minutes", 30)) return { ok: true };
          return { ok: false, hint: "Pista: busca cuatro cantidades iguales que, al sumarse, den 120." };
        },
        success: "Muy bien: cada actividad puede durar 30 minutos.",
      },
      {
        title: "Analiza la igualdad",
        intro: "Ahora explica qué representa cada lado y comprueba que la igualdad sea verdadera.",
        equation: "30 + 30 + 30 + 30 = 120",
        form: `
          <fieldset class="field-group">
            <legend>¿Qué representa el lado izquierdo?</legend>
            <div class="answer-grid">
              ${answerChoice("leftMeaning", "activities", "Las cuatro actividades de 30 minutos cada una")}
              ${answerChoice("leftMeaning", "oneActivity", "Una sola actividad de 120 minutos")}
              ${answerChoice("leftMeaning", "minutes", "Cuatro minutos en total")}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Qué representa el 120 del lado derecho?</legend>
            <div class="answer-grid">
              ${answerChoice("rightMeaning", "total", "El tiempo total disponible")}
              ${answerChoice("rightMeaning", "activity", "El tiempo de una actividad")}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Por qué se mantiene la igualdad?</legend>
            <div class="answer-grid">
              ${answerChoice("reason", "same", "Porque ambos lados representan 120 minutos")}
              ${answerChoice("reason", "different", "Porque cada lado debe tener un valor diferente")}
            </div>
          </fieldset>`,
        validate(data) {
          if (data.get("leftMeaning") !== "activities") return { ok: false, hint: "El lado izquierdo reúne cuatro bloques iguales de tiempo, uno por actividad." };
          if (data.get("rightMeaning") !== "total") return { ok: false, hint: "El número a la derecha representa todos los minutos disponibles." };
          if (data.get("reason") !== "same") return { ok: false, hint: "Suma los cuatro 30: los dos lados deben representar la misma cantidad." };
          return { ok: true };
        },
        success: "¡Exacto! Ambos lados representan los mismos 120 minutos.",
      },
    ],
    success: "¡Exacto! Cuatro grupos de 30 minutos representan los mismos 120 minutos.",
  },
  {
    label: "Situación 2 · Patio",
    title: "Alimentando a su mascota",
    setup: "La bolsa contiene 900 g y mi perro come 300 g cada día. Necesito saber cuántos días durará y agendar la compra antes de que se termine.",
    background: "./assets/scenes/patio.png",
    character: "./assets/characters/perro.png",
    steps: [
      {
        title: "Piensa en la situación",
        intro: "Distingue las cantidades conocidas de lo que Tadeo necesita averiguar.",
        equation: "900 g en total · 300 g cada día",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos contiene la bolsa?</span>
            <input class="text-input" inputmode="numeric" name="totalFood" placeholder="Gramos en total" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos come el perro cada día?</span>
            <input class="text-input" inputmode="numeric" name="dailyFood" placeholder="Gramos por día" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Qué necesita averiguar Tadeo?</legend>
            <div class="answer-grid">
              ${answerChoice("unknown", "days", "El número de días que durará la bolsa")}
              ${answerChoice("unknown", "dog", "El peso de su perro")}
              ${answerChoice("unknown", "price", "El precio de la bolsa")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "totalFood", 900)) return { ok: false, hint: "La bolsa nueva contiene 900 gramos." };
          if (!exactNumber(data, "dailyFood", 300)) return { ok: false, hint: "Las indicaciones señalan 300 gramos de alimento al día." };
          if (data.get("unknown") !== "days") return { ok: false, hint: "Tadeo ya conoce los gramos; necesita descubrir cuántos días durarán." };
          return { ok: true };
        },
        success: "Bien: conocemos 900 g en total y 300 g diarios; faltan por conocer los días.",
      },
      {
        title: "Representa lo que sucede",
        intro: "Calcula cuántos grupos de 300 g caben en la bolsa y escribe la suma repetida.",
        equation: "300 g + 300 g + … = 900 g",
        form: `
          <label class="field-group">
            <span class="field-label">¿Para cuántos días alcanza la bolsa?</span>
            <input class="text-input" inputmode="numeric" name="days" placeholder="Número de días" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">Escribe la igualdad como una suma repetida</span>
            <input class="text-input" name="repeatedSum" placeholder="Ejemplo: 100 + 100 = 200" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!exactNumber(data, "days", 3)) return { ok: false, hint: "Pista: ¿cuántos grupos de 300 g caben en 900 g?" };
          if (!equationIs(data, "repeatedSum", ["300+300+300=900", "900=300+300+300"])) return { ok: false, hint: "Escribe tres veces 300 a un lado y el total de 900 al otro." };
          return { ok: true };
        },
        success: "Correcto: 300 + 300 + 300 = 900, así que la bolsa dura 3 días.",
      },
      {
        title: "Representa la incógnita",
        intro: "Antes de calcular, el número de días era desconocido. Elige cómo representarlo.",
        equation: "300 × incógnita = 900",
        form: `
          <fieldset class="field-group">
            <legend>¿Qué símbolo quieres usar para el número de días?</legend>
            <input type="hidden" name="symbol" />
            <div class="s2-symbol-grid" role="radiogroup">${unknownRepresentations.map((option) => unknownRepresentationButton("symbol", option)).join("")}</div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Qué significa el símbolo que elegiste?</legend>
            <div class="answer-grid">
              ${answerChoice("symbolMeaning", "days", "La cantidad de días que dura el alimento")}
              ${answerChoice("symbolMeaning", "grams", "Los 900 gramos de la bolsa")}
              ${answerChoice("symbolMeaning", "daily", "Los 300 gramos de cada porción")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!data.get("symbol")) return { ok: false, hint: "Elige una letra o un símbolo para la cantidad desconocida." };
          if (data.get("symbolMeaning") !== "days") return { ok: false, hint: "El símbolo sustituye la cantidad que al principio no conocíamos: los días." };
          return { ok: true };
        },
        success: "Muy bien: cualquier letra o símbolo puede representar el número desconocido de días.",
      },
      {
        title: "Actualiza la agenda",
        intro: "La bolsa dura 3 días. Tadeo quiere comprar otra un día antes de que se termine.",
        equation: "3 días − 1 día = □",
        form: `
          <label class="field-group">
            <span class="field-label">¿En qué día debe anotar la compra de alimento?</span>
            <input class="text-input" inputmode="numeric" name="buyDay" placeholder="Día de compra" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (exactNumber(data, "buyDay", 2)) return { ok: true };
          return { ok: false, hint: "Resta un día a los 3 días que dura la bolsa." };
        },
        success: "¡Agenda actualizada! Tadeo comprará alimento el día 2.",
      },
    ],
    success: "¡Muy bien! La bolsa dura 3 días y Tadeo debe anotar la compra para el día 2.",
  },
  {
    label: "Situación 3 · Papelería",
    title: "En la papelería",
    setup: "Necesito 5 cuadernos iguales y una caja de colores de $45. Tengo $195 y quiero gastarlos exactamente.",
    background: "./assets/scenes/papeleria.png",
    character: "./assets/characters/encargado-papeleria.png",
    steps: [
      {
        title: "Analiza la compra",
        intro: "Reconoce los datos conocidos y la cantidad que todavía falta.",
        equation: "5 cuadernos + colores de $45 = $195",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos cuadernos necesita comprar?</span>
            <input class="text-input" inputmode="numeric" name="notebookCount" placeholder="Cantidad de cuadernos" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿Cuánto cuestan los colores?</span>
            <input class="text-input" inputmode="numeric" name="colorsPrice" placeholder="Precio en pesos" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Cuál es la incógnita?</legend>
            <div class="answer-grid">
              ${answerChoice("unknown", "notebookPrice", "El precio de cada cuaderno")}
              ${answerChoice("unknown", "colors", "El precio de los colores")}
              ${answerChoice("unknown", "budget", "El dinero disponible")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "notebookCount", 5)) return { ok: false, hint: "La lista de la hermana de Tadeo pide 5 cuadernos iguales." };
          if (!exactNumber(data, "colorsPrice", 45)) return { ok: false, hint: "La caja de colores tiene un precio conocido de $45." };
          if (data.get("unknown") !== "notebookPrice") return { ok: false, hint: "Ya conocemos el costo de los colores y el presupuesto; falta elegir el precio de cada cuaderno." };
          return { ok: true };
        },
        success: "Correcto: x representará el precio de cada uno de los 5 cuadernos.",
      },
      {
        title: "Construye la ecuación",
        intro: "Usa x para el precio de un cuaderno y escribe primero el costo de los cinco cuadernos.",
        equation: "5 veces el precio + 45 = 195",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cómo representas el costo de los cinco cuadernos?</span>
            <input class="text-input" name="notebooksExpression" placeholder="Expresión con x" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">Escribe la ecuación de la compra completa</span>
            <input class="text-input" name="equation" placeholder="Ejemplo: 2x + 10 = 50" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!equationIs(data, "notebooksExpression", ["5x", "x+x+x+x+x"])) return { ok: false, hint: "Cinco cuadernos del mismo precio se representan como x + x + x + x + x, o de forma breve como 5x." };
          if (!equationIs(data, "equation", ["5x+45=195", "45+5x=195", "195=5x+45", "195=45+5x"])) return { ok: false, hint: "Suma los $45 de los colores al costo de los cinco cuadernos e iguálalo con $195." };
          return { ok: true };
        },
        success: "Excelente: 5x + 45 = 195 representa toda la compra.",
      },
      {
        title: "Resuelve la ecuación",
        intro: "Prueba los precios disponibles y elige el que permite gastar exactamente $195.",
        equation: "5x + 45 = 195",
        form: `
          <fieldset class="field-group">
            <legend>¿Qué cuaderno puede comprar?</legend>
            <div class="choice-grid">
              ${imageChoice("notebook", "30", "./assets/objects/cuaderno-a.png", "Cuaderno A · $30")}
              ${imageChoice("notebook", "35", "./assets/objects/cuaderno-b.png", "Cuaderno B · $35")}
              ${imageChoice("notebook", "40", "./assets/objects/cuaderno-c.png", "Cuaderno C · $40")}
            </div>
          </fieldset>
          <label class="field-group">
            <span class="field-label">¿Cuánto vale x?</span>
            <input class="text-input" inputmode="numeric" name="price" placeholder="Precio de un cuaderno" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (data.get("notebook") !== "30") return { ok: false, hint: "Sustituye x por cada precio. ¿Con cuál obtienes exactamente $195?" };
          if (!exactNumber(data, "price", 30)) return { ok: false, hint: "Resta primero $45 a $195 y reparte el resultado entre los 5 cuadernos." };
          return { ok: true };
        },
        success: "Bien resuelto: x = 30, así que corresponde el cuaderno A.",
      },
      {
        title: "Comprueba tu solución",
        intro: "Sustituye x por 30 y verifica el costo de toda la compra.",
        equation: "5(30) + 45 = □",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuál es el costo total?</span>
            <input class="text-input" inputmode="numeric" name="total" placeholder="Total en pesos" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Se mantiene la igualdad con el presupuesto?</legend>
            <div class="answer-grid">
              ${answerChoice("isEqual", "yes", "Sí, 195 = 195")}
              ${answerChoice("isEqual", "no", "No, los resultados son diferentes")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "total", 195)) return { ok: false, hint: "Calcula 5 × 30 y después suma los $45 de los colores." };
          if (data.get("isEqual") !== "yes") return { ok: false, hint: "El costo calculado y el dinero disponible son $195; por eso la igualdad sí se mantiene." };
          return { ok: true };
        },
        success: "¡Compra comprobada! 5(30) + 45 = 195.",
      },
    ],
    success: "¡Compra resuelta! 5(30) + 45 = 195, así que el cuaderno A es la opción correcta.",
  },
  {
    label: "Situación 4 · Tienda de regalos",
    title: "Registrando sus gastos",
    setup: "Después de comprar un regalo de $180 me quedan $300. Olvidé registrar cuatro ingresos iguales. ¿Cuánto fue cada uno?",
    background: "./assets/scenes/regalos.png",
    character: "./assets/characters/encargada-regalos.png",
    steps: [
      {
        title: "Elige y analiza",
        intro: "Los tres regalos cuestan $180. Elige el que prefieras e identifica lo que Tadeo necesita averiguar.",
        equation: "4 ingresos iguales − regalo = $300",
        form: `
          <fieldset class="field-group">
            <legend>Elige el regalo para Eloísa</legend>
            <div class="choice-grid">
              ${imageChoice("gift", "peluche", "./assets/objects/regalo-peluche.png", "Peluche · $180")}
              ${imageChoice("gift", "caja", "./assets/objects/regalo-caja.png", "Caja sorpresa · $180")}
              ${imageChoice("gift", "lampara", "./assets/objects/regalo-lampara.png", "Lámpara · $180")}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Cuál es la incógnita?</legend>
            <div class="answer-grid">
              ${answerChoice("unknown", "income", "La cantidad de cada uno de los cuatro ingresos")}
              ${answerChoice("unknown", "gift", "El precio del regalo")}
              ${answerChoice("unknown", "remaining", "El dinero restante")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!data.get("gift")) return { ok: false, hint: "Elige cualquiera de los tres regalos; todos cuestan lo mismo." };
          if (data.get("unknown") !== "income") return { ok: false, hint: "Ya conocemos el gasto y el dinero restante; falta saber de cuánto fue cada ingreso." };
          return { ok: true };
        },
        success: "Buena elección. Ahora descubriremos la cantidad de cada ingreso.",
      },
      {
        title: "Representa la situación",
        intro: "Usa x para cada ingreso. Los cuatro ingresos forman el dinero anterior a la compra.",
        equation: "4 ingresos iguales − $180 = $300",
        form: `
          <label class="field-group">
            <span class="field-label">Escribe la ecuación del registro</span>
            <input class="text-input" name="equation" placeholder="Usa x para cada ingreso" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!equationIs(data, "equation", ["4x-180=300", "300=4x-180"])) return { ok: false, hint: "Cuatro ingresos iguales forman 4x; después resta el gasto de $180 y obtén los $300 restantes." };
          return { ok: true };
        },
        success: "Correcto: 4x − 180 = 300 modela el registro de ahorros.",
      },
      {
        title: "Interpreta cada término",
        intro: "Relaciona cada parte de la ecuación con la historia de Tadeo.",
        equation: "4x − 180 = 300",
        form: `
          <fieldset class="field-group">
            <legend>¿Qué representa 4x?</legend>
            <div class="answer-grid">
              ${answerChoice("fourX", "incomes", "La suma de los cuatro ingresos iguales")}
              ${answerChoice("fourX", "gifts", "El costo de cuatro regalos")}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Qué representa −180?</legend>
            <div class="answer-grid">
              ${answerChoice("expense", "gift", "El dinero gastado en el regalo")}
              ${answerChoice("expense", "income", "Un ingreso adicional")}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>¿Qué representa 300?</legend>
            <div class="answer-grid">
              ${answerChoice("remaining", "money", "El dinero que quedó después de la compra")}
              ${answerChoice("remaining", "price", "El precio original del regalo")}
            </div>
          </fieldset>`,
        validate(data) {
          if (data.get("fourX") !== "incomes") return { ok: false, hint: "Como x es un ingreso, 4x reúne los cuatro ingresos iguales." };
          if (data.get("expense") !== "gift") return { ok: false, hint: "El signo menos indica el dinero que salió para pagar el regalo." };
          if (data.get("remaining") !== "money") return { ok: false, hint: "Los $300 son el resultado después de restar el gasto." };
          return { ok: true };
        },
        success: "Muy bien: cada término de la ecuación cuenta una parte de la historia.",
      },
      {
        title: "Resuelve la ecuación",
        intro: "Recupera primero el dinero que había antes del gasto y repártelo entre los cuatro ingresos.",
        equation: "4x = 300 + 180",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuánto dinero había antes de comprar el regalo?</span>
            <input class="text-input" inputmode="numeric" name="beforeExpense" placeholder="Total de los ingresos" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿De cuánto fue cada ingreso?</span>
            <input class="text-input" inputmode="numeric" name="income" placeholder="Cantidad en pesos" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!exactNumber(data, "beforeExpense", 480)) return { ok: false, hint: "Suma el gasto de $180 a los $300 que quedaron." };
          if (!exactNumber(data, "income", 120)) return { ok: false, hint: "Reparte los $480 entre los cuatro ingresos iguales." };
          return { ok: true };
        },
        success: "Correcto: los ingresos sumaban $480 y cada uno fue de $120.",
      },
      {
        title: "Comprueba e interpreta",
        intro: "Sustituye x por 120 para comprobar el dinero restante.",
        equation: "4(120) − 180 = □",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuánto queda después de pagar el regalo?</span>
            <input class="text-input" inputmode="numeric" name="checkTotal" placeholder="Dinero restante" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿La comprobación mantiene la igualdad?</legend>
            <div class="answer-grid">
              ${answerChoice("isEqual", "yes", "Sí, el resultado es $300")}
              ${answerChoice("isEqual", "no", "No, el resultado no coincide")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "checkTotal", 300)) return { ok: false, hint: "Multiplica 4 × 120 y resta los $180 del regalo." };
          if (data.get("isEqual") !== "yes") return { ok: false, hint: "El resultado calculado es el mismo dinero restante de la historia: $300." };
          return { ok: true };
        },
        success: "¡Registro completo! 4(120) − 180 = 300.",
      },
    ],
    success: "¡Registro completo! Cada ingreso fue de $120: 4(120) − 180 = 300.",
  },
  {
    label: "Situación 5 · Cocina",
    title: "Ayudando con la cena",
    setup: "La receta 1 usa 150 g por porción y 100 g de guarnición. La receta 2 usa 100 g por porción y 300 g de guarnición.",
    background: "./assets/scenes/cocina.png",
    character: "./assets/characters/mama.png",
    steps: [
      {
        title: "Analiza las recetas",
        intro: "Reconoce las cantidades conocidas y lo que Tadeo necesita encontrar.",
        equation: "Carne por porción + carne para guarnición",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos por porción usa la receta 1?</span>
            <input class="text-input" inputmode="numeric" name="recipeOne" placeholder="Gramos por porción" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos por porción usa la receta 2?</span>
            <input class="text-input" inputmode="numeric" name="recipeTwo" placeholder="Gramos por porción" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Qué representa x?</legend>
            <div class="answer-grid">
              ${answerChoice("unknown", "portions", "El número de porciones")}
              ${answerChoice("unknown", "grams", "Los gramos de guarnición")}
              ${answerChoice("unknown", "recipes", "El número de recetas")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "recipeOne", 150)) return { ok: false, hint: "La receta 1 utiliza 150 g de carne por porción." };
          if (!exactNumber(data, "recipeTwo", 100)) return { ok: false, hint: "La receta 2 utiliza 100 g de carne por porción." };
          if (data.get("unknown") !== "portions") return { ok: false, hint: "Buscamos para cuántas porciones coinciden los totales; esa cantidad es x." };
          return { ok: true };
        },
        success: "Correcto: x representa el número de porciones que vamos a comparar.",
      },
      {
        title: "Representa cada receta",
        intro: "Multiplica la carne por porción por x y suma la cantidad fija de la guarnición.",
        equation: "Total = carne de las porciones + guarnición",
        form: `
          <label class="field-group">
            <span class="field-label">Escribe el total de la receta 1</span>
            <input class="text-input" name="expressionOne" placeholder="Expresión con x" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">Escribe el total de la receta 2</span>
            <input class="text-input" name="expressionTwo" placeholder="Expresión con x" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (!equationIs(data, "expressionOne", ["150x+100", "100+150x"])) return { ok: false, hint: "Para la receta 1 son 150 g por cada una de x porciones, más 100 g de guarnición." };
          if (!equationIs(data, "expressionTwo", ["100x+300", "300+100x"])) return { ok: false, hint: "Para la receta 2 son 100 g por cada una de x porciones, más 300 g de guarnición." };
          return { ok: true };
        },
        success: "Bien: los totales son 150x + 100 y 100x + 300.",
      },
      {
        title: "Compara los totales",
        intro: "Relaciona las expresiones para representar el momento en que usan la misma cantidad de carne.",
        equation: "Cantidad de la receta 1 = Cantidad de la receta 2",
        form: `
          <label class="field-group">
            <span class="field-label">Escribe la ecuación que compara las recetas</span>
            <input class="text-input" name="equation" placeholder="Expresión 1 = expresión 2" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Qué indica el signo = en esta ecuación?</legend>
            <div class="answer-grid">
              ${answerChoice("equalMeaning", "same", "Que las dos expresiones tienen el mismo valor")}
              ${answerChoice("equalMeaning", "result", "Que ya conocemos el resultado de x")}
              ${answerChoice("equalMeaning", "add", "Que debemos sumar las dos recetas")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!equationIs(data, "equation", ["150x+100=100x+300", "100x+300=150x+100"])) return { ok: false, hint: "Coloca un total a cada lado del signo igual." };
          if (data.get("equalMeaning") !== "same") return { ok: false, hint: "El signo igual indica que ambos lados representan la misma cantidad total." };
          return { ok: true };
        },
        success: "Exacto: la ecuación busca cuándo las dos expresiones son equivalentes.",
      },
      {
        title: "Resuelve la ecuación",
        intro: "Encuentra el valor de x que hace verdadera la igualdad.",
        equation: "150x + 100 = 100x + 300",
        form: `
          <label class="field-group">
            <span class="field-label">¿Para cuántas porciones usan la misma cantidad?</span>
            <input class="text-input" inputmode="numeric" name="portions" placeholder="Número de porciones" autocomplete="off" required />
          </label>`,
        validate(data) {
          if (exactNumber(data, "portions", 4)) return { ok: true };
          return { ok: false, hint: "Resta 100x en ambos lados y después resta 100: quedará 50x = 200." };
        },
        success: "Correcto: x = 4 porciones.",
      },
      {
        title: "Comprueba y elige",
        intro: "Calcula los dos totales con 4 porciones. Si coinciden, puedes elegir libremente qué preparar.",
        equation: "150(4) + 100 = 100(4) + 300",
        form: `
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos usa en total la receta 1?</span>
            <input class="text-input" inputmode="numeric" name="totalOne" placeholder="Total en gramos" autocomplete="off" required />
          </label>
          <label class="field-group">
            <span class="field-label">¿Cuántos gramos usa en total la receta 2?</span>
            <input class="text-input" inputmode="numeric" name="totalTwo" placeholder="Total en gramos" autocomplete="off" required />
          </label>
          <fieldset class="field-group">
            <legend>¿Cuál receta quieres preparar?</legend>
            <div class="choice-grid">
              ${imageChoice("recipe", "1", "./assets/objects/receta-1.png", "Receta 1")}
              ${imageChoice("recipe", "2", "./assets/objects/receta-2.png", "Receta 2")}
            </div>
          </fieldset>`,
        validate(data) {
          if (!exactNumber(data, "totalOne", 700)) return { ok: false, hint: "Para la receta 1 calcula 150 × 4 + 100." };
          if (!exactNumber(data, "totalTwo", 700)) return { ok: false, hint: "Para la receta 2 calcula 100 × 4 + 300." };
          if (!data.get("recipe")) return { ok: false, hint: "Las dos recetas usan 700 g; puedes elegir cualquiera." };
          return { ok: true };
        },
        success: "¡Las expresiones coinciden! Ambas recetas necesitan 700 g para 4 porciones.",
      },
    ],
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
const requestedSituation = Number(new URLSearchParams(window.location.search).get("situacion"));
const reviewSituation = EXPERIENCE_FLOW.situations.some(({ id }) => id === requestedSituation)
  ? requestedSituation
  : null;
const isReviewMode = reviewSituation !== null;
// Archivo de compatibilidad: los renderizadores y handlers históricos que aparecen
// más adelante permanecen acoplados a `tadeo-final-1`. El render activo nunca los
// invoca, pero se conservan para no destruir la reproducción/auditoría histórica.
// Ninguna revisión nueva debe entrar en esas trayectorias.
const situationOneReviewRequested = false;
const situationThreeReviewRequested = false;
const situationFourReviewRequested = false;
const situationFiveReviewRequested = false;

const defaultState = { currentScene: 0, currentStep: 0, completedScenes: [], unlocked: [], metrics: null };
let state = { ...defaultState };
let researchSession = loadJson(SESSION_STORAGE_KEY, null);
let introPhase = researchSession?.introPhase || (researchSession ? "game" : "home");
let outbox = loadJson(OUTBOX_STORAGE_KEY, []);
const createDefaultFlowProgress = () => ({
  currentScreen: EXPERIENCE_FLOW.situations[0].startScreen,
  completedSituations: [],
  completedActivities: [],
  situationData: {
    1: {
      answers: {},
      objectiveAttempts: {},
      savedOpenStages: [],
    },
    2: {
      answers: {},
      objectiveAttempts: {},
      savedOpenStages: [],
      notebooksAssigned: false,
      colorsAdded: false,
      strategySaved: false,
      activityCompleted: false,
    },
    3: {
      answers: {},
      objectiveAttempts: {},
      savedOpenStages: [],
      giftPurchased: false,
      quantitiesBuilt: false,
      expenseAdded: false,
      equationCompleted: false,
      strategySaved: false,
      registerCompleted: false,
    },
  },
});
const defaultFlowProgress = createDefaultFlowProgress();
let flowProgress = createDefaultFlowProgress();
let situationOneProgress = { stage: 0, answers: {} };
let hasSituationOneProgress = false;
let situationTwoProgress = { stage: 0, answers: {} };
let situationThreeProgress = { stage: 0, answers: {}, objectiveAttempts: {} };
let hasSituationThreeProgress = false;
let situationFourProgress = { stage: 0, answers: {}, objectiveAttempts: {}, selectedGift: "" };
let hasSituationFourProgress = false;
let situationFiveProgress = { stage: 0, answers: {}, objectiveAttempts: {}, selectedRecipe: "" };
let hasSituationFiveProgress = false;
const defaultFinalFlow = {
  screen: EXPERIENCE_FLOW.situations.at(-1).endScreen,
  completionEventId: null,
  completionStatus: "idle",
  completionError: "",
};
let finalFlow = {
  ...defaultFinalFlow,
  ...(researchSession?.finalFlow && typeof researchSession.finalFlow === "object"
    ? researchSession.finalFlow
    : {}),
};
let activeStartedAt = null;
let outboxSending = false;
let outboxFlushPromise = null;
let toastTimer;

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const loadFlowProgress = () => {
  const allProgress = loadJson(FLOW_PROGRESS_KEY, {});
  const saved = researchSession?.id ? allProgress[researchSession.id] : null;
  const savedSituationOne = saved?.situationData?.[1];
  const savedSituationTwo = saved?.situationData?.[2];
  const savedSituationThree = saved?.situationData?.[3];
  flowProgress = {
    currentScreen: Math.min(
      EXPERIENCE_FLOW.totalScreens,
      Math.max(EXPERIENCE_FLOW.situations[0].startScreen, Number(saved?.currentScreen) || defaultFlowProgress.currentScreen),
    ),
    completedSituations: Array.isArray(saved?.completedSituations) ? saved.completedSituations : [],
    completedActivities: Array.isArray(saved?.completedActivities) ? saved.completedActivities : [],
    situationData: {
      1: {
        answers: savedSituationOne?.answers && typeof savedSituationOne.answers === "object"
          ? savedSituationOne.answers
          : {},
        objectiveAttempts: savedSituationOne?.objectiveAttempts && typeof savedSituationOne.objectiveAttempts === "object"
          ? savedSituationOne.objectiveAttempts
          : {},
        savedOpenStages: Array.isArray(savedSituationOne?.savedOpenStages)
          ? savedSituationOne.savedOpenStages
          : [],
      },
      2: {
        answers: savedSituationTwo?.answers && typeof savedSituationTwo.answers === "object"
          ? savedSituationTwo.answers
          : {},
        objectiveAttempts: savedSituationTwo?.objectiveAttempts && typeof savedSituationTwo.objectiveAttempts === "object"
          ? savedSituationTwo.objectiveAttempts
          : {},
        savedOpenStages: Array.isArray(savedSituationTwo?.savedOpenStages)
          ? savedSituationTwo.savedOpenStages
          : [],
        notebooksAssigned: Boolean(savedSituationTwo?.notebooksAssigned),
        colorsAdded: Boolean(savedSituationTwo?.colorsAdded),
        strategySaved: Boolean(savedSituationTwo?.strategySaved),
        activityCompleted: Boolean(savedSituationTwo?.activityCompleted),
      },
      3: {
        answers: savedSituationThree?.answers && typeof savedSituationThree.answers === "object"
          ? savedSituationThree.answers
          : {},
        objectiveAttempts: savedSituationThree?.objectiveAttempts && typeof savedSituationThree.objectiveAttempts === "object"
          ? savedSituationThree.objectiveAttempts
          : {},
        savedOpenStages: Array.isArray(savedSituationThree?.savedOpenStages)
          ? savedSituationThree.savedOpenStages
          : [],
        giftPurchased: Boolean(savedSituationThree?.giftPurchased),
        quantitiesBuilt: Boolean(savedSituationThree?.quantitiesBuilt),
        expenseAdded: Boolean(savedSituationThree?.expenseAdded),
        equationCompleted: Boolean(savedSituationThree?.equationCompleted),
        strategySaved: Boolean(savedSituationThree?.strategySaved),
        registerCompleted: Boolean(savedSituationThree?.registerCompleted),
      },
    },
  };
};

const saveFlowProgress = () => {
  if (!researchSession?.id || isReviewMode) return;
  const allProgress = loadJson(FLOW_PROGRESS_KEY, {});
  allProgress[researchSession.id] = flowProgress;
  localStorage.setItem(FLOW_PROGRESS_KEY, JSON.stringify(allProgress));
  queueProgressSnapshot();
};

const saveResearchSession = () => {
  if (!researchSession || isReviewMode) return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(researchSession));
};
const saveOutbox = () => localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));

const saveFinalFlow = () => {
  if (!researchSession || isReviewMode) return;
  researchSession.finalFlow = { ...finalFlow };
  saveResearchSession();
};

const loadSituationOneProgress = () => {
  const allProgress = loadJson(SITUATION_ONE_PROGRESS_KEY, {});
  const saved = researchSession?.id ? allProgress[researchSession.id] : null;
  hasSituationOneProgress = Boolean(saved);
  const minimumStage = state.currentScene > 0 ? 5 : state.currentStep === 2 ? 3 : state.currentStep === 1 ? 2 : 0;
  situationOneProgress = {
    stage: Math.min(7, Math.max(Number(saved?.stage) || 0, minimumStage)),
    answers: saved?.answers && typeof saved.answers === "object" ? saved.answers : {},
  };
};

const saveSituationOneProgress = () => {
  if (!researchSession?.id) return;
  const allProgress = loadJson(SITUATION_ONE_PROGRESS_KEY, {});
  allProgress[researchSession.id] = situationOneProgress;
  localStorage.setItem(SITUATION_ONE_PROGRESS_KEY, JSON.stringify(allProgress));
  hasSituationOneProgress = true;
  queueProgressSnapshot();
};

const loadSituationTwoProgress = () => {
  const allProgress = loadJson(SITUATION_TWO_PROGRESS_KEY, {});
  const saved = researchSession?.id ? allProgress[researchSession.id] : null;
  const minimumStage = state.currentScene > 1
    ? 8
    : state.currentScene === 1
      ? [0, 2, 3, 6][state.currentStep] || 0
      : 0;
  situationTwoProgress = {
    stage: Math.min(8, Math.max(Number(saved?.stage) || 0, minimumStage)),
    answers: saved?.answers && typeof saved.answers === "object" ? saved.answers : {},
  };
};

const saveSituationTwoProgress = () => {
  if (!researchSession?.id) return;
  const allProgress = loadJson(SITUATION_TWO_PROGRESS_KEY, {});
  allProgress[researchSession.id] = situationTwoProgress;
  localStorage.setItem(SITUATION_TWO_PROGRESS_KEY, JSON.stringify(allProgress));
  queueProgressSnapshot();
};

const situationThreeProgressId = () => {
  if (!researchSession?.id) return null;
  return `${researchSession.id}:${situationThreeReviewRequested ? "review" : "story"}`;
};

const loadSituationThreeProgress = () => {
  const allProgress = loadJson(SITUATION_THREE_PROGRESS_KEY, {});
  const progressId = situationThreeProgressId();
  const saved = progressId ? allProgress[progressId] : null;
  hasSituationThreeProgress = Boolean(saved);
  situationThreeProgress = {
    stage: Math.min(9, Math.max(0, Number(saved?.stage) || 0)),
    answers: saved?.answers && typeof saved.answers === "object" ? saved.answers : {},
    objectiveAttempts: saved?.objectiveAttempts && typeof saved.objectiveAttempts === "object"
      ? saved.objectiveAttempts
      : {},
  };
};

const saveSituationThreeProgress = () => {
  const progressId = situationThreeProgressId();
  if (!progressId) return;
  const allProgress = loadJson(SITUATION_THREE_PROGRESS_KEY, {});
  allProgress[progressId] = situationThreeProgress;
  localStorage.setItem(SITUATION_THREE_PROGRESS_KEY, JSON.stringify(allProgress));
  hasSituationThreeProgress = true;
  queueProgressSnapshot();
};

const situationFourProgressId = () => {
  if (!researchSession?.id) return null;
  return `${researchSession.id}:${situationFourReviewRequested ? "review" : "story"}`;
};

const loadSituationFourProgress = () => {
  const allProgress = loadJson(SITUATION_FOUR_PROGRESS_KEY, {});
  const progressId = situationFourProgressId();
  const saved = progressId ? allProgress[progressId] : null;
  hasSituationFourProgress = Boolean(saved);
  const answers = saved?.answers && typeof saved.answers === "object" ? saved.answers : {};
  situationFourProgress = {
    stage: Math.min(10, Math.max(0, Number(saved?.stage) || 0)),
    answers,
    objectiveAttempts: saved?.objectiveAttempts && typeof saved.objectiveAttempts === "object"
      ? saved.objectiveAttempts
      : {},
    selectedGift: String(saved?.selectedGift || answers.s4_regalo_elegido || ""),
  };
};

const saveSituationFourProgress = () => {
  const progressId = situationFourProgressId();
  if (!progressId) return;
  const allProgress = loadJson(SITUATION_FOUR_PROGRESS_KEY, {});
  allProgress[progressId] = situationFourProgress;
  localStorage.setItem(SITUATION_FOUR_PROGRESS_KEY, JSON.stringify(allProgress));
  hasSituationFourProgress = true;
  queueProgressSnapshot();
};

const resetSituationFourProgress = () => {
  situationFourProgress = {
    stage: 0,
    answers: {},
    objectiveAttempts: {},
    selectedGift: "",
  };
  saveSituationFourProgress();
};

const situationFiveProgressId = () => {
  if (!researchSession?.id) return null;
  return `${researchSession.id}:${situationFiveReviewRequested ? "review" : "story"}`;
};

const loadSituationFiveProgress = () => {
  const allProgress = loadJson(SITUATION_FIVE_PROGRESS_KEY, {});
  const progressId = situationFiveProgressId();
  const saved = progressId ? allProgress[progressId] : null;
  hasSituationFiveProgress = Boolean(saved);
  const answers = saved?.answers && typeof saved.answers === "object" ? saved.answers : {};
  situationFiveProgress = {
    stage: Math.min(11, Math.max(0, Number(saved?.stage) || 0)),
    answers,
    objectiveAttempts: saved?.objectiveAttempts && typeof saved.objectiveAttempts === "object"
      ? saved.objectiveAttempts
      : {},
    selectedRecipe: String(saved?.selectedRecipe || answers.s5_receta_elegida || ""),
  };
};

const saveSituationFiveProgress = () => {
  const progressId = situationFiveProgressId();
  if (!progressId) return;
  const allProgress = loadJson(SITUATION_FIVE_PROGRESS_KEY, {});
  allProgress[progressId] = situationFiveProgress;
  localStorage.setItem(SITUATION_FIVE_PROGRESS_KEY, JSON.stringify(allProgress));
  hasSituationFiveProgress = true;
  queueProgressSnapshot();
};

const ensureSituationFiveProgress = () => {
  if (!hasSituationFiveProgress) saveSituationFiveProgress();
};

const resetSituationFiveProgress = () => {
  situationFiveProgress = {
    stage: 0,
    answers: {},
    objectiveAttempts: {},
    selectedRecipe: "",
  };
  saveSituationFiveProgress();
};

const setIntroPhase = (phase) => {
  introPhase = phase;
  if (researchSession) {
    researchSession.introPhase = phase;
    if (phase === "game") {
      const resumedSituation = situationForScreen(currentScreenForProgress());
      state.currentScene = resumedSituation ? resumedSituation.id - 1 : 0;
      state.completedScenes = [...flowProgress.completedSituations];
      state.unlocked = [...flowProgress.completedSituations];
    }
    saveResearchSession();
    queueProgressSnapshot();
  }
};

const situationForScreen = (screen) => EXPERIENCE_FLOW.situations.find(
  ({ startScreen, endScreen }) => screen >= startScreen && screen <= endScreen,
) || null;

const applyServerState = (serverState) => {
  if (serverState.experience_version === EXPERIENCE_VERSION) {
    const currentScreen = Number(serverState.current_screen) || 1;
    if (currentScreen >= EXPERIENCE_FLOW.situations[0].startScreen) {
      flowProgress.currentScreen = Math.min(EXPERIENCE_FLOW.totalScreens, currentScreen);
    }
    if (!isReviewMode && currentScreen >= EXPERIENCE_FLOW.screens.closing) {
      finalFlow.screen = Math.min(EXPERIENCE_FLOW.screens.finalization, currentScreen);
    }
    if (!isReviewMode && serverState.completed_at) {
      finalFlow.screen = EXPERIENCE_FLOW.screens.finalization;
      finalFlow.completionStatus = "completed";
      finalFlow.completionError = "";
    }
    const currentSituation = situationForScreen(currentScreen);
    state = {
      currentScene: currentSituation ? currentSituation.id - 1 : 0,
      currentStep: 0,
      completedScenes: [...flowProgress.completedSituations],
      unlocked: [...flowProgress.completedSituations],
      metrics: null,
    };
    return;
  }
  // Las claves de almacenamiento nuevas impiden que una sesión histórica se
  // interprete con esta interfaz. El backend conserva esas sesiones por versión.
  flowProgress = createDefaultFlowProgress();
};

const apiRequest = async (path, options = {}, token = researchSession?.token) => {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa la red y vuelve a intentarlo.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || "El servidor no pudo completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return data;
};

const currentScreenForProgress = () => {
  if (introPhase === "home") return EXPERIENCE_FLOW.screens.home;
  if (introPhase === "access") return EXPERIENCE_FLOW.screens.folio;
  if (introPhase === "presentation") return EXPERIENCE_FLOW.screens.presentation;
  if (introPhase === "agenda") return EXPERIENCE_FLOW.screens.initialAgenda;
  if (!isReviewMode && finalFlow.screen >= EXPERIENCE_FLOW.screens.closing) {
    return Math.min(EXPERIENCE_FLOW.screens.finalization, finalFlow.screen);
  }
  return flowProgress.currentScreen;
};

const progressSnapshot = () => ({
  intro_phase: introPhase,
  experience_version: EXPERIENCE_FLOW.version,
  flow_progress: JSON.parse(JSON.stringify(flowProgress)),
  final_flow: {
    current_screen: finalFlow.screen,
    completion_event_id: finalFlow.completionEventId,
    completion_status: finalFlow.completionStatus,
    completion_error: finalFlow.completionError,
  },
});

const persistProgressCaches = () => {
  if (!researchSession?.id || isReviewMode) return;
  const allProgress = loadJson(FLOW_PROGRESS_KEY, {});
  allProgress[researchSession.id] = flowProgress;
  localStorage.setItem(FLOW_PROGRESS_KEY, JSON.stringify(allProgress));
};

const applyProgressSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object" || !Object.keys(snapshot).length) return;
  introPhase = typeof snapshot.intro_phase === "string" ? snapshot.intro_phase : introPhase;
  const restored = (name, fallback) => snapshot[name] && typeof snapshot[name] === "object"
    ? snapshot[name]
    : fallback;
  const restoredFlow = restored("flow_progress", null);
  if (restoredFlow) {
    const restoredSituationOne = restoredFlow.situationData?.[1];
    const restoredSituationTwo = restoredFlow.situationData?.[2];
    const restoredSituationThree = restoredFlow.situationData?.[3];
    flowProgress = {
      currentScreen: Math.min(
        EXPERIENCE_FLOW.totalScreens,
        Math.max(EXPERIENCE_FLOW.situations[0].startScreen, Number(restoredFlow.currentScreen) || defaultFlowProgress.currentScreen),
      ),
      completedSituations: Array.isArray(restoredFlow.completedSituations) ? restoredFlow.completedSituations : [],
      completedActivities: Array.isArray(restoredFlow.completedActivities) ? restoredFlow.completedActivities : [],
      situationData: {
        1: {
          answers: restoredSituationOne?.answers && typeof restoredSituationOne.answers === "object"
            ? restoredSituationOne.answers
            : {},
          objectiveAttempts: restoredSituationOne?.objectiveAttempts && typeof restoredSituationOne.objectiveAttempts === "object"
            ? restoredSituationOne.objectiveAttempts
            : {},
          savedOpenStages: Array.isArray(restoredSituationOne?.savedOpenStages)
            ? restoredSituationOne.savedOpenStages
            : [],
        },
        2: {
          answers: restoredSituationTwo?.answers && typeof restoredSituationTwo.answers === "object"
            ? restoredSituationTwo.answers
            : {},
          objectiveAttempts: restoredSituationTwo?.objectiveAttempts && typeof restoredSituationTwo.objectiveAttempts === "object"
            ? restoredSituationTwo.objectiveAttempts
            : {},
          savedOpenStages: Array.isArray(restoredSituationTwo?.savedOpenStages)
            ? restoredSituationTwo.savedOpenStages
            : [],
          notebooksAssigned: Boolean(restoredSituationTwo?.notebooksAssigned),
          colorsAdded: Boolean(restoredSituationTwo?.colorsAdded),
          strategySaved: Boolean(restoredSituationTwo?.strategySaved),
          activityCompleted: Boolean(restoredSituationTwo?.activityCompleted),
        },
        3: {
          answers: restoredSituationThree?.answers && typeof restoredSituationThree.answers === "object"
            ? restoredSituationThree.answers
            : {},
          objectiveAttempts: restoredSituationThree?.objectiveAttempts && typeof restoredSituationThree.objectiveAttempts === "object"
            ? restoredSituationThree.objectiveAttempts
            : {},
          savedOpenStages: Array.isArray(restoredSituationThree?.savedOpenStages)
            ? restoredSituationThree.savedOpenStages
            : [],
          giftPurchased: Boolean(restoredSituationThree?.giftPurchased),
          quantitiesBuilt: Boolean(restoredSituationThree?.quantitiesBuilt),
          expenseAdded: Boolean(restoredSituationThree?.expenseAdded),
          equationCompleted: Boolean(restoredSituationThree?.equationCompleted),
          strategySaved: Boolean(restoredSituationThree?.strategySaved),
          registerCompleted: Boolean(restoredSituationThree?.registerCompleted),
        },
      },
    };
  }
  const restoredFinalFlow = restored("final_flow", null);
  if (!isReviewMode && restoredFinalFlow) {
    finalFlow = {
      screen: Math.min(
        EXPERIENCE_FLOW.screens.finalization,
        Math.max(EXPERIENCE_FLOW.situations.at(-1).endScreen, Number(restoredFinalFlow.current_screen) || EXPERIENCE_FLOW.situations.at(-1).endScreen),
      ),
      completionEventId: restoredFinalFlow.completion_event_id || null,
      completionStatus: String(restoredFinalFlow.completion_status || "idle"),
      completionError: String(restoredFinalFlow.completion_error || ""),
    };
  }
  const recoveredSituation = situationForScreen(currentScreenForProgress());
  state.currentScene = recoveredSituation ? recoveredSituation.id - 1 : 0;
  state.completedScenes = [...flowProgress.completedSituations];
  state.unlocked = [...flowProgress.completedSituations];
  researchSession.introPhase = introPhase;
  researchSession.finalFlow = { ...finalFlow };
  saveResearchSession();
  persistProgressCaches();
};

const enqueueOutbox = (type, path, method, payload) => {
  if (!researchSession?.id || isReviewMode || researchSession.completedAt) return null;
  const item = {
    queueId: crypto.randomUUID(),
    type,
    sessionId: researchSession.id,
    token: researchSession.token,
    path,
    method,
    payload,
  };
  outbox.push(item);
  saveOutbox();
  flushOutbox();
  return item;
};

const queueProgressSnapshot = () => {
  if (!researchSession?.id || isReviewMode || researchSession.completedAt) return;
  const nextRevision = (Number(researchSession.progressRevision) || 0) + 1;
  researchSession.progressRevision = nextRevision;
  saveResearchSession();
  outbox = outbox.filter(
    (item) => !(item.type === "progress" && item.sessionId === researchSession.id),
  );
  const payload = {
    current_screen: currentScreenForProgress(),
    progress_revision: nextRevision,
    progress_snapshot: JSON.parse(JSON.stringify(progressSnapshot())),
  };
  enqueueOutbox(
    "progress",
    `/api/v2/sessions/${researchSession.id}/progress`,
    "PUT",
    payload,
  );
};

const objectiveFieldIds = new Set([
  "s1_tiempo_total", "s1_numero_actividades", "s1_tiempo_por_actividad",
  "s1_igualdad_valor_1", "s1_igualdad_valor_2",
  "s1_explora_a", "s1_explora_b", "s1_explora_c", "s1_misma_cantidad",
  "s2_signo_relacion", "s2_valor_x", "s2_cuaderno_elegido", "s2_comprobacion_igualdad",
  "s3_valor_lado_derecho", "s3_comprobacion_igualdad",
  "s2_dias_alimento", "s2_dia_comprar_alimento",
  "s3_valor_x", "s3_cuaderno_elegido", "s3_se_mantiene_igualdad",
  "s4_valor_x", "s4_se_mantiene_igualdad",
  "s4_registro_ingreso1", "s4_registro_ingreso2", "s4_registro_ingreso3", "s4_registro_ingreso4",
  "s5_signo_relacion", "s5_valor_x", "s5_resultado_receta1", "s5_resultado_receta2",
  "s5_misma_cantidad", "s5_gramos_cada_receta", "s5_porciones_final",
]);

const numericObjectiveFieldIds = new Set([
  "s1_tiempo_total", "s1_numero_actividades", "s1_tiempo_por_actividad",
  "s1_igualdad_valor_1", "s1_igualdad_valor_2",
  "s1_explora_a", "s1_explora_b", "s1_explora_c",
  "s2_valor_x", "s3_valor_lado_derecho",
  "s2_dias_alimento", "s2_dia_comprar_alimento", "s3_valor_x", "s4_valor_x",
  "s4_registro_ingreso1", "s4_registro_ingreso2", "s4_registro_ingreso3", "s4_registro_ingreso4",
  "s5_valor_x", "s5_resultado_receta1", "s5_resultado_receta2", "s5_gramos_cada_receta",
  "s5_porciones_final",
]);

const narrativeChoiceFieldIds = new Set([
  "s2_simbolo_elegido",
  "s3_regalo_elegido",
  "s2_representacion_incognita",
  "s3_representacion_incognita",
  "s4_regalo_elegido",
  "s5_receta_elegida",
]);

const mathFieldId = (fieldId) => [
  "igualdad", "ecuacion", "representacion_breve", "cinco_cuadernos", "cuatro_cantidades", "cuatro_ingresos",
  "procedimiento", "sustitucion", "receta1_porciones", "receta1_total", "receta2_total",
].some((part) => fieldId.includes(part)) && !fieldId.includes("explicacion");

const fieldTypeFor = (fieldId) => {
  if (objectiveFieldIds.has(fieldId)) {
    return numericObjectiveFieldIds.has(fieldId) ? "objective_numeric" : "objective_choice";
  }
  if (narrativeChoiceFieldIds.has(fieldId)) return "narrative_choice";
  if (mathFieldId(fieldId)) return "math_expression";
  return "open_text";
};

const queueResponseSubmission = ({
  situation,
  screen,
  activityId,
  answers,
  validationResult = null,
  fieldValidation = {},
}) => {
  if (!answers || !Object.keys(answers).length || isReviewMode) return;
  const values = Object.entries(answers).map(([fieldId, value], orderIndex) => ({
    field_id: fieldId,
    field_type: fieldTypeFor(fieldId),
    literal_value: String(value ?? ""),
    order_index: orderIndex,
    validation_result: Object.hasOwn(fieldValidation, fieldId) ? fieldValidation[fieldId] : null,
  }));
  const eventId = crypto.randomUUID();
  enqueueOutbox(
    "response",
    `/api/v2/sessions/${researchSession.id}/responses`,
    "POST",
    {
      event_id: eventId,
      situation,
      screen,
      activity_id: activityId,
      validation_result: validationResult,
      client_created_at: new Date().toISOString(),
      order_index: screen,
      values,
    },
  );
};

const pendingCompletionItem = () => outbox.find(
  (item) => item.type === "complete" && item.sessionId === researchSession?.id,
);

const ensureCompletionEventId = () => {
  const queuedCompletionId = pendingCompletionItem()?.payload?.completion_event_id;
  if (queuedCompletionId) finalFlow.completionEventId = queuedCompletionId;
  if (!finalFlow.completionEventId) finalFlow.completionEventId = crypto.randomUUID();
  saveFinalFlow();
  return finalFlow.completionEventId;
};

const queueSessionCompletion = (completionEventId) => {
  const existing = pendingCompletionItem();
  if (existing) return existing;
  return enqueueOutbox(
    "complete",
    `/api/v2/sessions/${researchSession.id}/complete`,
    "POST",
    { completion_event_id: completionEventId },
  );
};

const flushOutbox = async () => {
  if (isReviewMode || !outbox.length) return { ok: true, error: null };
  if (outboxFlushPromise) return outboxFlushPromise;
  outboxSending = true;
  outboxFlushPromise = (async () => {
    try {
      while (outbox.length) {
        const item = outbox[0];
        const result = await apiRequest(item.path, {
          method: item.method,
          body: JSON.stringify(item.payload),
          keepalive: item.type === "activity",
        }, item.token);
        if (item.type === "complete" && result.state?.completed_at) {
          researchSession.completedAt = result.state.completed_at;
          finalFlow.screen = EXPERIENCE_FLOW.screens.finalization;
          finalFlow.completionEventId = item.payload.completion_event_id;
          finalFlow.completionStatus = "completed";
          finalFlow.completionError = "";
          activeStartedAt = null;
          saveFinalFlow();
        }
        outbox = outbox.filter((queued) => queued.queueId !== item.queueId);
        saveOutbox();
      }
      return { ok: true, error: null };
    } catch (error) {
      // La outbox se conserva completa y reintenta con el mismo event_id o revisión.
      return { ok: false, error };
    } finally {
      outboxSending = false;
      outboxFlushPromise = null;
    }
  })();
  return outboxFlushPromise;
};

const agendaCompleted = () => flowProgress.completedActivities.length;

const showToast = (message) => {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
};

const updateChrome = () => {
  const done = agendaCompleted();
  const visibleDiscoveries = [];
  timeValue.textContent = "60";
  discoveryCount.textContent = String(visibleDiscoveries.length);
  const storyProgress = (currentScreenForProgress() - 1) / (EXPERIENCE_FLOW.totalScreens - 1);
  progressBar.style.width = `${Math.round(Math.min(Math.max(storyProgress, 0), 1) * 100)}%`;
  agendaList.innerHTML = agendaItems
    .map((item, index) => `<li class="${index < done ? "done" : ""}"><span class="check" aria-hidden="true">${index < done ? "✓" : ""}</span><span>${item}</span></li>`)
    .join("");

  if (!visibleDiscoveries.length) {
    discoveriesList.innerHTML = '<p class="empty-state">Completa el primer reto para desbloquear tu primera tarjeta.</p>';
  } else {
    discoveriesList.innerHTML = visibleDiscoveries.map((index) => {
      const item = discoveries[index];
      return `<article class="discovery-card"><h3>${item.title}</h3><p>${item.text}</p><code>${item.example}</code></article>`;
    }).join("");
  }
};

const renderHome = () => {
  app.innerHTML = `
    <section class="screen intro-screen welcome-screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="welcome-card">
        <h1>El día de Tadeo</h1>
        <p>Un videojuego para explorar situaciones matemáticas</p>
        <button class="primary-button" type="button" data-action="show-access">INICIAR</button>
      </div>
    </section>`;
};

const renderAccess = (error = "") => {
  app.innerHTML = `
    <section class="screen intro-screen access-screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="access-panel">
        <div class="access-copy">
          <h1>Ingresa tu folio</h1>
          <form id="participant-access-form" class="access-form">
            <label class="field-group"><span class="field-label">Folio de participante</span>
              <input class="text-input code-input" name="code" maxlength="8" autocomplete="off" autocapitalize="characters" required placeholder="Ej. 7KMP4R2A" />
            </label>
            <p class="feedback" id="access-feedback" role="alert"></p>
            <button class="primary-button" type="submit">CONTINUAR</button>
          </form>
        </div>
      </div>
    </section>`;
  if (error) document.querySelector("#access-feedback").textContent = error;
};

const renderPresentation = () => {
  app.innerHTML = `
    <section class="screen intro-screen presentation-screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="hero-card presentation-card">
        <div class="hero-copy dialogue-copy">
          <p>¡Hola! Soy Tadeo. Hoy tengo varias cosas que hacer y necesito organizarme para poder terminar todo.</p>
          <p>Para no olvidar nada, voy registrando mis actividades en mi agenda. Vamos a revisar qué tengo pendiente para hoy.</p>
          <button class="primary-button" type="button" data-action="view-initial-agenda">VER AGENDA</button>
        </div>
        <div class="hero-character"><img src="./assets/characters/tadeo.png" alt="Tadeo en su habitación" /></div>
      </div>
    </section>`;
};

const renderInitialAgenda = () => {
  const items = agendaItems
    .map((item, index) => `<li><img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" /><span>${item}</span></li>`)
    .join("");
  app.innerHTML = `
    <section class="screen intro-screen initial-agenda-screen s1-game-stage s1-agenda-stage" style="background-image: url('./assets/scenes/habitacion.png')">
      <img class="s1-stage-character s1-agenda-character" src="./assets/characters/tadeo.png" alt="Tadeo revisa su agenda" />
      <div class="s1-interface-panel s1-agenda-panel">
        <span class="s1-panel-kicker">Agenda</span>
        <p class="s1-dialogue-line">Tengo varias cosas por hacer hoy. Será mejor comenzar organizando mi tiempo.</p>
        <div class="s1-agenda-content">
          <h1>La agenda de Tadeo</h1>
          <div class="two-activity-agenda" aria-label="Agenda de Tadeo con dos actividades">
            <div class="two-activity-agenda-heading"><span aria-hidden="true">★</span><strong>Plan de la tarde</strong><span aria-hidden="true">★</span></div>
            <ol class="two-activity-agenda-list">${items}</ol>
          </div>
          <div class="form-actions">
            <button class="primary-button" type="button" data-action="start-game">COMENZAR</button>
          </div>
        </div>
      </div>
    </section>`;
};

const renderLoading = () => {
  app.innerHTML = '<section class="screen loading-screen"><div class="loading-card"><strong>Cargando tu sesión…</strong><span>Estamos recuperando tu progreso.</span></div></section>';
};

const situationOneForms = [
  "",
  `
    <label class="field-group">
      <span class="field-label">a) ¿Cuánto tiempo tiene Tadeo en total?</span>
      <input class="text-input" name="s1_explora_a" autocomplete="off" required />
    </label>
    <label class="field-group">
      <span class="field-label">b) ¿Cuántas actividades tiene que realizar?</span>
      <input class="text-input" name="s1_explora_b" autocomplete="off" required />
    </label>
    <label class="field-group">
      <span class="field-label">c) Si quiere dedicar el mismo tiempo a cada actividad, ¿cuánto tiempo puede dedicar a cada una?</span>
      <input class="text-input" name="s1_explora_c" autocomplete="off" required />
    </label>`,
  `
    <p class="field-label">a) Completa los espacios.</p>
    <div class="equality-builder" aria-label="Completa la igualdad">
      <input class="text-input" name="s1_igualdad_1" aria-label="Primer número" autocomplete="off" required />
      <span aria-hidden="true">+</span>
      <input class="text-input" name="s1_igualdad_2" aria-label="Segundo número" autocomplete="off" required />
      <span aria-hidden="true">+</span>
      <input class="text-input" name="s1_igualdad_3" aria-label="Tercer número" autocomplete="off" required />
      <span aria-hidden="true">+</span>
      <input class="text-input" name="s1_igualdad_4" aria-label="Cuarto número" autocomplete="off" required />
      <span aria-hidden="true">= 120</span>
    </div>`,
  `
    <label class="field-group">
      <span class="field-label">b) ¿Qué representa cada número que escribiste del lado izquierdo?</span>
      <textarea class="text-input open-response" name="s1_significado_izquierda" required></textarea>
    </label>
    <label class="field-group">
      <span class="field-label">c) ¿Qué representa el número 120 que aparece del lado derecho?</span>
      <textarea class="text-input open-response" name="s1_significado_derecha" required></textarea>
    </label>`,
  `
    <fieldset class="field-group">
      <legend>d) ¿La suma del lado izquierdo da la misma cantidad que el número del lado derecho?</legend>
      <div class="answer-grid two-options">
        <label class="answer-choice"><input type="radio" name="s1_misma_cantidad" value="Sí" required /><span>Sí</span></label>
        <label class="answer-choice"><input type="radio" name="s1_misma_cantidad" value="No" required /><span>No</span></label>
      </div>
    </fieldset>
    <label class="field-group">
      <span class="field-label">e) Explica por qué.</span>
      <textarea class="text-input open-response" name="s1_justificacion" required></textarea>
    </label>`,
];

const situationOneStages = [
  {
    title: "Situación 1. Organizando el tiempo",
    intro: "Tadeo tiene cuatro actividades pendientes y dispone de 120 minutos para realizarlas. Quiere dedicar el mismo tiempo a cada actividad.",
    question: "¿Cuántos minutos puede dedicar a cada una?",
  },
  { title: "Explora", intro: "Responde las siguientes preguntas." },
  { title: "Representación de la igualdad", intro: "Completa la representación con cuatro números." },
  { title: "Significados", intro: "Explica con tus propias palabras qué significa cada lado." },
  { title: "Comparación y justificación", intro: "Compara ambos lados de la igualdad y explica tu respuesta." },
];

const situationOneHud = (stageIndex) => {
  const dots = Array.from(
    { length: 7 },
    (_, index) => `<span class="s1-hud-dot ${index < stageIndex ? "done" : ""} ${index === stageIndex ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud" aria-label="Situación 1, estado ${stageIndex + 1} de 7">
      <span class="s1-hud-title">Situación 1</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const situationOneCompletedEquation = () => {
  const values = [1, 2, 3, 4].map((index) => situationOneProgress.answers[`s1_igualdad_${index}`]);
  if (values.some((value) => value === undefined)) return "";
  const safeValues = values.map(escapeHtml);
  const accessibleEquation = escapeHtml(`${values.join(" + ")} = 120`);
  return `
    <div class="s1-recalled-equation" role="img" aria-label="La suma que completaste: ${accessibleEquation}">
      <span class="s1-recalled-value">${safeValues[0]}</span><span aria-hidden="true">+</span>
      <span class="s1-recalled-value">${safeValues[1]}</span><span aria-hidden="true">+</span>
      <span class="s1-recalled-value">${safeValues[2]}</span><span aria-hidden="true">+</span>
      <span class="s1-recalled-value">${safeValues[3]}</span><span aria-hidden="true">= 120</span>
    </div>`;
};

const renderSituationOneAgenda = () => {
  const items = agendaItems
    .map((item, index) => `<li><img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" /><span>${item}</span></li>`)
    .join("");
  app.innerHTML = `
    <section class="screen situation-one-screen s1-game-stage s1-agenda-stage" style="background-image: url('./assets/scenes/habitacion.png')">
      ${situationOneHud(6)}
      <img class="s1-stage-character s1-agenda-character" src="./assets/characters/tadeo.png" alt="Tadeo revisa su agenda" />
      <div class="s1-interface-panel s1-agenda-panel">
        <span class="s1-panel-kicker">Agenda</span>
        <p class="s1-dialogue-line">Ya organicé mi tiempo. Ahora puedo comenzar con la primera actividad.</p>
        <div class="s1-agenda-content">
          <h1>La agenda de Tadeo</h1>
          <div class="s1-agenda-book">
            <img src="./assets/objects/Agenda%20abierta%204%20actividades.png" alt="Agenda abierta de Tadeo" />
            <ol class="s1-agenda-book-list">${items}</ol>
          </div>
          <p class="next-activity"><strong>Siguiente actividad:</strong> Alimentar a su perro.</p>
          <div class="form-actions">
            <button class="primary-button" type="button" data-action="start-s2">Continuar con la primera actividad <span aria-hidden="true">→</span></button>
            <button class="primary-button" type="button" data-action="s1-restart">Revisar de nuevo la Situación 1</button>
          </div>
        </div>
      </div>
    </section>`;
};

const renderSituationOneDiscovery = () => {
  app.innerHTML = `
    <section class="screen situation-one-screen s1-game-stage s1-discovery-stage" style="background-image: url('./assets/scenes/habitacion.png')">
      ${situationOneHud(5)}
      <img class="s1-stage-character s1-discovery-character" src="./assets/characters/tadeo-celebrando.png" alt="" />
      <div class="s1-interface-panel s1-discovery-panel">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Situación 1 · Habitación</span>
          <span class="s1-panel-scene">Organizando el tiempo</span>
        </div>
        <p class="s1-situation-context">Tadeo terminó de construir y analizar su representación.</p>
        <span class="s1-discovery-label">✦ Mi descubrimiento</span>
        <h3>La igualdad</h3>
        <aside class="discovery-unlocked">
          <p class="challenge-intro">Una igualdad expresa que las expresiones que aparecen a ambos lados del signo “=” tienen el mismo valor.</p>
          <div class="equation-card">30 + 30 + 30 + 30 = 120</div>
        </aside>
        <button class="primary-button" type="button" data-action="s1-show-agenda">Ver agenda <span aria-hidden="true">→</span></button>
      </div>
    </section>`;
};

const renderSituationOne = () => {
  const stageIndex = situationOneProgress.stage;
  progressBar.style.width = `${Math.round(((stageIndex + 1) / 7) * 100)}%`;
  if (stageIndex === 6) {
    renderSituationOneAgenda();
    return;
  }
  if (stageIndex === 5) {
    renderSituationOneDiscovery();
    return;
  }
  const stage = situationOneStages[stageIndex];
  const contextContent = stageIndex === 0
    ? `<p class="central-question">${stage.question}</p><button class="primary-button" type="button" data-action="s1-start">Continuar <span aria-hidden="true">→</span></button>`
    : `<form class="challenge-form" id="challenge-form" data-s1-stage="${stageIndex}" novalidate>
        ${situationOneForms[stageIndex]}
        <p class="feedback" id="feedback" role="status"></p>
        <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
      </form>`;
  app.innerHTML = `
    <section class="screen situation-one-screen s1-game-stage" style="background-image: url('./assets/scenes/habitacion.png')">
      ${situationOneHud(stageIndex)}
      <img class="s1-stage-character s1-thinking-character" src="./assets/characters/tadeo-pensando.png" alt="" />
      <div class="s1-interface-panel s1-question-panel">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Situación 1 · Habitación</span>
          <span class="s1-panel-scene">Organizando el tiempo</span>
        </div>
        <p class="s1-situation-context">Tadeo tiene cuatro actividades pendientes y dispone de 120 minutos para realizarlas.</p>
        <h3>${stage.title}</h3><p class="challenge-intro">${stage.intro}</p>
        ${stageIndex === 3 ? situationOneCompletedEquation() : ""}
        ${contextContent}
      </div>
    </section>`;
};

const situationTwoHud = (stageIndex) => {
  const dots = Array.from(
    { length: 9 },
    (_, index) => `<span class="s1-hud-dot ${index < stageIndex ? "done" : ""} ${index === stageIndex ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud s2-hud" aria-label="Situación 2, pantalla ${stageIndex + 12} de 20">
      <span class="s1-hud-title">Situación 2</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const situationTwoObjects = (stageIndex) => {
  const isNarrative = stageIndex === 0;
  const isCelebration = stageIndex === 6 || stageIndex === 8;
  const bagImage = stageIndex >= 2
    ? "./assets/objects/bolsa_alimento_casi_vacia.png"
    : "./assets/objects/bolsa_alimento_abierta.png";
  return `
    <div class="s2-scene-objects ${isNarrative ? "s2-feeding-sequence" : ""}" aria-label="Tadeo está en el patio con su perro, la bolsa de alimento y el plato">
      <img class="s2-tadeo" src="./assets/characters/${isCelebration ? "tadeo-celebrando.png" : "tadeo.png"}" alt="" />
      <img class="s2-dog" src="./assets/characters/perro.png" alt="" />
      ${isNarrative ? `
        <img class="s2-food-bag s2-food-bag-closed" src="./assets/objects/bolsa-alimento.png" alt="" />
        <img class="s2-food-bag s2-food-bag-open" src="./assets/objects/bolsa_alimento_abierta.png" alt="" />
        <img class="s2-food-portion" src="./assets/objects/porcion_croquetas.png" alt="" />
        <img class="s2-food-bowl s2-food-bowl-empty" src="./assets/objects/plato_vacio.png" alt="" />
        <img class="s2-food-bowl s2-food-bowl-full" src="./assets/objects/plato-lleno.png" alt="" />
      ` : `
        <img class="s2-food-bag" src="${bagImage}" alt="" />
        <img class="s2-food-bowl" src="./assets/objects/plato-lleno.png" alt="" />
      `}
    </div>`;
};

const situationTwoPanel = (stageIndex, content, panelClass = "") => `
  <section class="screen situation-two-screen s1-game-stage s2-game-stage" data-s2-stage="${stageIndex}" style="background-image: url('./assets/scenes/patio.png')">
    ${situationTwoHud(stageIndex)}
    ${situationTwoObjects(stageIndex)}
    <div class="s1-interface-panel s2-interface-panel ${panelClass}">
      <div class="s1-panel-heading">
        <span class="s1-panel-kicker">Pantalla ${stageIndex + 12} · Situación 2</span>
        <span class="s1-panel-scene">El patio</span>
      </div>
      ${content}
    </div>
  </section>`;

const selectedUnknownRepresentation = () => unknownRepresentations.find(
  (option) => option.value === situationTwoProgress.answers.s2_representacion_incognita,
);

const situationTwoSavedAnswer = (name) => escapeHtml(situationTwoProgress.answers[name] || "");

const renderSituationTwoNarrative = () => {
  app.innerHTML = situationTwoPanel(0, `
    <p class="s1-situation-context">Primera actividad de la agenda · Alimentar a su perro</p>
    <h3>Hora de alimentar a su perro</h3>
    <p class="challenge-intro">Tadeo sale al patio con su perro. Abre una bolsa nueva que contiene <strong>900 g de alimento</strong> y sirve en el plato la porción del día: <strong>300 g</strong>.</p>
    <div class="s2-story-facts" aria-label="Datos de la historia">
      <span><img src="./assets/objects/bolsa_alimento_abierta.png" alt="" />Bolsa nueva<br /><strong>900 g</strong></span>
      <span><img src="./assets/objects/porcion_croquetas.png" alt="" />Porción del día<br /><strong>300 g</strong></span>
    </div>
    <p class="s2-dialogue">“Quiero saber cuánto tiempo podré alimentar a mi perro antes de comprar otra bolsa.”</p>
    <button class="primary-button" type="button" data-action="s2-next">Explorar la situación <span aria-hidden="true">→</span></button>
  `, "s2-narrative-panel");
};

const renderSituationTwoExploration = () => {
  app.innerHTML = situationTwoPanel(1, `
    <p class="s1-situation-context">Primero reconoce los datos y la pregunta de la historia.</p>
    <h3>Explora</h3>
    <form class="challenge-form" id="challenge-form" data-s2-stage="1" novalidate>
      <label class="field-group">
        <span class="field-label">a) ¿Qué información conoces y consideras útil para resolver la situación?</span>
        <textarea class="text-input open-response" name="s2_informacion_conocida" required>${situationTwoSavedAnswer("s2_informacion_conocida")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">b) ¿Qué necesitas averiguar?</span>
        <textarea class="text-input open-response" name="s2_que_averiguar" required>${situationTwoSavedAnswer("s2_que_averiguar")}</textarea>
      </label>
      <p class="helper-text s2-open-note">No hay una sola forma de responder. Escribe tus ideas con tus propias palabras.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationTwoDaysAndEquality = () => {
  app.innerHTML = situationTwoPanel(2, `
    <p class="s1-situation-context">La bolsa contiene 900 g y cada porción diaria es de 300 g.</p>
    <h3>Días e igualdad</h3>
    <form class="challenge-form" id="challenge-form" data-s2-stage="2" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cuántos días puede alimentar Tadeo a su perro con la cantidad disponible?</span>
        <input class="text-input" inputmode="numeric" name="s2_dias_alimento" value="${situationTwoSavedAnswer("s2_dias_alimento")}" autocomplete="off" required />
      </label>
      <label class="field-group">
        <span class="field-label">Representa mediante una igualdad la situación.</span>
        <textarea class="text-input open-response s2-equation-response" name="s2_igualdad" aria-describedby="s2-equality-help" autocomplete="off" required>${situationTwoSavedAnswer("s2_igualdad")}</textarea>
      </label>
      <p class="helper-text s2-open-note" id="s2-equality-help">Construye tu propia igualdad. Conservaremos exactamente lo que escribas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationTwoUnknown = () => {
  app.innerHTML = situationTwoPanel(3, `
    <p class="s1-situation-context">Piensa en lo que sabías antes de resolver el problema.</p>
    <h3>Cantidad desconocida</h3>
    <form class="challenge-form" id="challenge-form" data-s2-stage="3" novalidate>
      <label class="field-group">
        <span class="field-label">¿Qué cantidad de esta situación no conocíamos al inicio?</span>
        <textarea class="text-input open-response" name="s2_cantidad_desconocida" required>${situationTwoSavedAnswer("s2_cantidad_desconocida")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Explícalo con tus propias palabras.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationTwoRepresentation = () => {
  const selectedValue = situationTwoProgress.answers.s2_representacion_incognita || "";
  const options = unknownRepresentations
    .map((option, index) => unknownRepresentationButton("s2_representacion_incognita", option, selectedValue, index))
    .join("");
  app.innerHTML = situationTwoPanel(4, `
    <p class="s1-situation-context">Puedes elegir libremente una letra o un símbolo.</p>
    <h3>Elige una representación</h3>
    <form class="challenge-form" id="challenge-form" data-s2-stage="4" novalidate>
      <fieldset class="field-group">
        <legend>¿Cómo quieres representar la cantidad que no conocíamos?</legend>
        <input type="hidden" name="s2_representacion_incognita" value="${escapeHtml(selectedValue)}" />
        <div class="s2-symbol-grid" role="radiogroup" aria-label="Representaciones posibles para la cantidad desconocida">${options}</div>
      </fieldset>
      <p class="helper-text s2-open-note">Ninguna opción es mejor que otra. Puedes cambiar tu elección antes de continuar.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar elección <span aria-hidden="true">→</span></button>
    </form>`, "s2-selector-panel");
};

const renderSituationTwoMeaning = () => {
  const selected = selectedUnknownRepresentation();
  const selectedMarkup = selected
    ? `<div class="s2-selected-symbol"><span>Tu representación</span><img src="${selected.image}" alt="${selected.label}" /></div>`
    : "";
  app.innerHTML = situationTwoPanel(5, `
    <p class="s1-situation-context">Relaciona tu elección con la historia de Tadeo y su perro.</p>
    <h3>¿Qué significa tu representación?</h3>
    ${selectedMarkup}
    <form class="challenge-form" id="challenge-form" data-s2-stage="5" novalidate>
      <label class="field-group">
        <span class="field-label">¿Qué significa en esta situación el símbolo o letra que elegiste?</span>
        <textarea class="text-input open-response" name="s2_significado_representacion" required>${situationTwoSavedAnswer("s2_significado_representacion")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe tu explicación con tus propias palabras.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationTwoDiscovery = () => {
  const selected = selectedUnknownRepresentation();
  const connection = selected
    ? `<span class="s2-discovery-symbol"><img src="${selected.image}" alt="${selected.label}" />Así representaste la cantidad que no conocías al inicio.</span>`
    : "";
  app.innerHTML = situationTwoPanel(6, `
    <p class="s1-situation-context">Ahora podemos ponerle nombre a la idea que acabas de usar.</p>
    <span class="s1-discovery-label">✦ Mi descubrimiento</span>
    <h3>La incógnita</h3>
    <aside class="discovery-unlocked s2-discovery-card">
      <img class="s2-discovery-card-art" src="./assets/objects/tarjeta_descubrimiento.png" alt="" />
      <div class="s2-discovery-card-copy">
        ${connection}
        <p class="challenge-intro">Una <strong>incógnita</strong> es una cantidad cuyo valor no conocemos y que podemos representar mediante una letra o símbolo.</p>
        <p>Lo importante es explicar con claridad qué cantidad representa. No tiene que ser siempre la letra x.</p>
      </div>
    </aside>
    <button class="primary-button" type="button" data-action="s2-next">Continuar <span aria-hidden="true">→</span></button>
  `, "s1-discovery-panel");
};

const renderSituationTwoPurchase = () => {
  app.innerHTML = situationTwoPanel(7, `
    <p class="s1-situation-context">La bolsa alcanzará para ${escapeHtml(situationTwoProgress.answers.s2_dias_alimento || "3")} días.</p>
    <h3>Compra futura</h3>
    <p class="challenge-intro">Tadeo quiere comprar más alimento <strong>un día antes de que se termine</strong>, para que su perro nunca se quede sin comida.</p>
    <form class="challenge-form" id="challenge-form" data-s2-stage="7" novalidate>
      <label class="field-group">
        <span class="field-label">¿En qué día debe agendar la compra de alimento?</span>
        <input class="text-input" inputmode="numeric" name="s2_dia_comprar_alimento" value="${situationTwoSavedAnswer("s2_dia_comprar_alimento")}" autocomplete="off" required />
      </label>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Registrar compra futura <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationTwoAgenda = () => {
  const items = agendaItems.map((item, index) => `
    <li class="${index === 0 ? "s2-agenda-done" : "s2-agenda-pending"}">
      <img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" />
      <span class="s2-agenda-task">${item}<small class="s2-agenda-status">${index === 0 ? "✓ Completada" : "Pendiente"}</small></span>
    </li>`).join("");
  app.innerHTML = situationTwoPanel(8, `
    <span class="s1-panel-kicker">Agenda actualizada</span>
    <p class="s1-dialogue-line">¡Listo! Alimenté a mi perro y también anoté cuándo comprar más alimento.</p>
    <h1>La agenda de Tadeo</h1>
    <div class="s1-agenda-book s2-final-agenda">
      <img src="./assets/objects/Agenda%20abierta%204%20actividades.png" alt="Agenda abierta de Tadeo con la primera actividad completada" />
      <ol class="s1-agenda-book-list">${items}</ol>
    </div>
    <aside class="s2-reminder">
      <img src="./assets/objects/bolsa_alimento_casi_vacia.png" alt="" />
      <p><strong>Pendiente futuro</strong>Comprar alimento para el perro el día ${escapeHtml(situationTwoProgress.answers.s2_dia_comprar_alimento || "2")}.</p>
    </aside>
    <p class="next-activity"><strong>Siguiente actividad:</strong> Ir a la papelería.</p>
    <button class="primary-button" type="button" data-action="start-s3">CONTINUAR <span aria-hidden="true">→</span></button>
  `, "s1-agenda-panel s2-agenda-panel");
};

const renderSituationTwo = () => {
  const stageIndex = situationTwoProgress.stage;
  progressBar.style.width = `${Math.round(((stageIndex + 1) / 9) * 100)}%`;
  const renderers = [
    renderSituationTwoNarrative,
    renderSituationTwoExploration,
    renderSituationTwoDaysAndEquality,
    renderSituationTwoUnknown,
    renderSituationTwoRepresentation,
    renderSituationTwoMeaning,
    renderSituationTwoDiscovery,
    renderSituationTwoPurchase,
    renderSituationTwoAgenda,
  ];
  renderers[stageIndex]();
};

const situationThreeHud = (stageIndex) => {
  const dots = Array.from(
    { length: 10 },
    (_, index) => `<span class="s1-hud-dot ${index < stageIndex ? "done" : ""} ${index === stageIndex ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud s3-hud" aria-label="Situación 3, pantalla ${stageIndex + 21} de 30">
      <span class="s1-hud-title">Situación 3</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const situationThreeObjects = (stageIndex) => `
  <div class="s3-scene-objects" aria-hidden="true">
    <img class="s3-tadeo" src="./assets/characters/${stageIndex === 9 ? "tadeo-celebrando.png" : "tadeo.png"}" alt="" />
    <img class="s3-clerk" src="./assets/characters/encargado-papeleria.png" alt="" />
    <div class="s3-product-row">
      <figure><img src="./assets/objects/cuaderno-a.png" alt="" /><figcaption>A · $30</figcaption></figure>
      <figure><img src="./assets/objects/cuaderno-b.png" alt="" /><figcaption>B · $35</figcaption></figure>
      <figure><img src="./assets/objects/cuaderno-c.png" alt="" /><figcaption>C · $40</figcaption></figure>
      <figure><img src="./assets/objects/colores.png" alt="" /><figcaption>Colores · $45</figcaption></figure>
    </div>
  </div>`;

const situationThreePanel = (stageIndex, content, panelClass = "") => `
  <section class="screen situation-three-screen s1-game-stage s3-game-stage" data-s3-stage="${stageIndex}" style="background-image: url('./assets/scenes/papeleria.png')">
    ${situationThreeHud(stageIndex)}
    ${situationThreeObjects(stageIndex)}
    <div class="s1-interface-panel s3-interface-panel ${panelClass}">
      <div class="s3-panel-utility">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Pantalla ${stageIndex + 21} · Situación 3</span>
          <span class="s1-panel-scene">La papelería</span>
        </div>
        <button class="secondary-button s3-home-button" type="button" data-action="s3-return-home">Regresar al inicio</button>
      </div>
      ${content}
    </div>
  </section>`;

const situationThreeSavedAnswer = (name) => escapeHtml(situationThreeProgress.answers[name] || "");

const selectedSituationThreeRepresentation = () => unknownRepresentations.find(
  (option) => option.value === situationThreeProgress.answers.s3_representacion_incognita,
);

const situationThreeSelectedRepresentationMarkup = () => {
  const selected = selectedSituationThreeRepresentation();
  if (!selected) return "";
  return `<div class="s2-selected-symbol s3-selected-symbol"><span>Tu representación</span><img src="${selected.image}" alt="${selected.label}" /></div>`;
};

const situationThreeAttemptList = (name) => {
  const attempts = situationThreeProgress.objectiveAttempts[name];
  return Array.isArray(attempts) ? attempts : [];
};

const situationThreeAttemptFeedback = (name, firstHint, secondHint) => {
  const attempts = situationThreeAttemptList(name);
  if (!attempts.length || attempts.some((attempt) => attempt.correct)) return "";
  const message = attempts.length >= 2 ? secondHint : firstHint;
  return `<p class="feedback" id="feedback" role="status">${message}</p>`;
};

const renderSituationThreeNarrative = () => {
  app.innerHTML = situationThreePanel(0, `
    <p class="s1-situation-context">Segunda actividad de la agenda · Ir a la papelería</p>
    <h3>Una compra exacta</h3>
    <p class="challenge-intro">Tadeo entra a la papelería. Necesita comprar <strong>5 cuadernos iguales</strong> y <strong>una caja de colores que cuesta $45</strong>. Tiene <strong>$195</strong> y debe gastarlos exactamente.</p>
    <div class="s3-story-facts" aria-label="Opciones disponibles">
      <span><img src="./assets/objects/cuaderno-a.png" alt="" /><strong>Cuaderno A</strong>$30 cada uno</span>
      <span><img src="./assets/objects/cuaderno-b.png" alt="" /><strong>Cuaderno B</strong>$35 cada uno</span>
      <span><img src="./assets/objects/cuaderno-c.png" alt="" /><strong>Cuaderno C</strong>$40 cada uno</span>
      <span><img src="./assets/objects/colores.png" alt="" /><strong>Caja de colores</strong>$45</span>
    </div>
    <p class="s2-dialogue">“Necesito descubrir qué precio debe tener cada cuaderno para que el dinero alcance exactamente.”</p>
    <button class="primary-button" type="button" data-action="s3-next">Explorar la compra <span aria-hidden="true">→</span></button>
  `, "s3-narrative-panel");
};

const renderSituationThreeExploration = () => {
  app.innerHTML = situationThreePanel(1, `
    <p class="s1-situation-context">Observa la compra y distingue lo que ya sabes de lo que necesitas averiguar.</p>
    <h3>Explora</h3>
    <aside class="s3-purchase-summary" aria-label="Recordatorio de la situación">
      <p>Tadeo necesita <strong>5 cuadernos iguales</strong> y una <strong>caja de colores de $45</strong>. Tiene <strong>$195</strong> para gastar exactamente.</p>
      <div class="s3-summary-options">
        <span><strong>A</strong> $30</span>
        <span><strong>B</strong> $35</span>
        <span><strong>C</strong> $40</span>
      </div>
    </aside>
    <form class="challenge-form" id="challenge-form" data-s3-stage="1" novalidate>
      <label class="field-group">
        <span class="field-label">a) ¿Qué cantidades conoces en esta situación?</span>
        <textarea class="text-input open-response" name="s3_cantidades_conocidas" required>${situationThreeSavedAnswer("s3_cantidades_conocidas")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">b) ¿Qué cantidad necesitas encontrar?</span>
        <textarea class="text-input open-response" name="s3_cantidad_encontrar" required>${situationThreeSavedAnswer("s3_cantidad_encontrar")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">c) ¿Cuál es la cantidad desconocida?</span>
        <textarea class="text-input open-response" name="s3_incognita" required>${situationThreeSavedAnswer("s3_incognita")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe tus ideas con tus propias palabras. No hay una única forma de expresarlas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationThreeRepresentation = () => {
  const selectedValue = situationThreeProgress.answers.s3_representacion_incognita || "";
  const options = unknownRepresentations
    .map((option, index) => unknownRepresentationButton("s3_representacion_incognita", option, selectedValue, index))
    .join("");
  app.innerHTML = situationThreePanel(2, `
    <p class="s1-situation-context">El precio de cada cuaderno todavía es desconocido. Puedes representarlo con una letra o un símbolo.</p>
    <h3>Elige una representación</h3>
    <form class="challenge-form" id="challenge-form" data-s3-stage="2" novalidate>
      <fieldset class="field-group">
        <legend>¿Cómo quieres representar el precio desconocido de un cuaderno?</legend>
        <input type="hidden" name="s3_representacion_incognita" value="${escapeHtml(selectedValue)}" />
        <div class="s2-symbol-grid" role="radiogroup" aria-label="Representaciones posibles para el precio desconocido">${options}</div>
      </fieldset>
      <p class="helper-text s2-open-note">Cualquiera de estas representaciones es válida. Puedes cambiarla antes de continuar.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar elección <span aria-hidden="true">→</span></button>
    </form>`, "s2-selector-panel");
};

const renderSituationThreeFiveNotebooks = () => {
  app.innerHTML = situationThreePanel(3, `
    <p class="s1-situation-context">Los cinco cuadernos deben ser iguales y tener el mismo precio desconocido.</p>
    <h3>Representa los cinco cuadernos</h3>
    ${situationThreeSelectedRepresentationMarkup()}
    <form class="challenge-form" id="challenge-form" data-s3-stage="3" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cómo representarías el costo de los cinco cuadernos iguales?</span>
        <textarea class="text-input open-response s3-math-response" name="s3_cinco_cuadernos" autocomplete="off" required>${situationThreeSavedAnswer("s3_cinco_cuadernos")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Construye tu propia representación. Conservaremos exactamente lo que escribas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationThreeEquality = () => {
  app.innerHTML = situationThreePanel(4, `
    <p class="s1-situation-context">Ahora reúne el costo de los cinco cuadernos, los $45 de los colores y los $195 disponibles.</p>
    <h3>Construye la igualdad</h3>
    <div class="s3-data-chips" aria-label="Datos para construir la igualdad">
      <span>5 cuadernos iguales</span><span>Colores: $45</span><span>Total: $195</span>
    </div>
    <form class="challenge-form" id="challenge-form" data-s3-stage="4" novalidate>
      <label class="field-group">
        <span class="field-label">Escribe una igualdad que represente la compra completa.</span>
        <textarea class="text-input open-response s3-math-response" name="s3_igualdad_compra" autocomplete="off" required>${situationThreeSavedAnswer("s3_igualdad_compra")}</textarea>
      </label>
      <p class="helper-text s2-open-note">La igualdad debe ser tu construcción. No tiene que seguir una única escritura.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationThreeBriefRepresentation = () => {
  app.innerHTML = situationThreePanel(5, `
    <p class="s1-situation-context">Los cinco cuadernos tienen el mismo precio, por eso aparece una misma cantidad varias veces.</p>
    <h3>De la suma a la multiplicación</h3>
    <div class="s3-repeated-sum" role="img" aria-label="a más a más a más a más a puede representarse como cinco a">
      <span>a + a + a + a + a</span><span aria-hidden="true">→</span><strong>5a</strong>
    </div>
    <p class="challenge-intro">Una suma en la que se repite la misma cantidad puede expresarse de manera más breve mediante una multiplicación. Relaciona esta idea con los cinco cuadernos iguales.</p>
    <form class="challenge-form" id="challenge-form" data-s3-stage="5" novalidate>
      <label class="field-group">
        <span class="field-label">Escribe una representación breve de la situación.</span>
        <textarea class="text-input open-response s3-math-response" name="s3_representacion_breve" autocomplete="off" required>${situationThreeSavedAnswer("s3_representacion_breve")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe tu propia representación; todavía no necesitas resolverla.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>`);
};

const renderSituationThreeDiscovery = () => {
  app.innerHTML = situationThreePanel(6, `
    <p class="s1-situation-context">Ya construiste una igualdad para relacionar la cantidad desconocida con el total de la compra.</p>
    <span class="s1-discovery-label">✦ Mi descubrimiento</span>
    <h3>La ecuación</h3>
    <aside class="discovery-unlocked s2-discovery-card">
      <img class="s2-discovery-card-art" src="./assets/objects/tarjeta_descubrimiento.png" alt="" />
      <div class="s2-discovery-card-copy">
        <p class="challenge-intro">Una <strong>ecuación</strong> es una igualdad en la que aparece una cantidad desconocida.</p>
        <div class="equation-card">5x + 45 = 195</div>
        <p>En esta ecuación, <strong>x</strong> representa el precio desconocido de un cuaderno.</p>
      </div>
    </aside>
    <button class="primary-button" type="button" data-action="s3-next">Resolver la ecuación <span aria-hidden="true">→</span></button>
  `, "s1-discovery-panel s3-discovery-panel");
};

const renderSituationThreeSolve = () => {
  const attempts = situationThreeAttemptList("s3_resolver");
  const exhausted = attempts.length >= 2 && !attempts.some((attempt) => attempt.correct);
  const feedback = situationThreeAttemptFeedback(
    "s3_resolver",
    "Primer intento guardado. Pista: retira primero los $45 de los colores y reparte lo que queda entre los cinco cuadernos.",
    "Tus dos intentos quedaron guardados. El valor y el cuaderno elegidos no permiten usar exactamente $195. Puedes continuar para revisar la sustitución.",
  );
  app.innerHTML = situationThreePanel(7, `
    <p class="s1-situation-context">Usa la ecuación que acabas de reconocer para encontrar el precio de un cuaderno.</p>
    <h3>Resuelve y elige</h3>
    <div class="equation-card">5x + 45 = 195</div>
    <form class="challenge-form" id="challenge-form" data-s3-stage="7" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cuánto vale x?</span>
        <input class="text-input" inputmode="numeric" name="s3_valor_x" value="${situationThreeSavedAnswer("s3_valor_x")}" autocomplete="off" required />
      </label>
      <fieldset class="field-group">
        <legend>Elige el cuaderno que corresponde al valor obtenido.</legend>
        <div class="choice-grid s3-notebook-choices">
          <label class="choice-card"><input type="radio" name="s3_cuaderno_elegido" value="A" ${situationThreeProgress.answers.s3_cuaderno_elegido === "A" ? "checked" : ""} /><span><img src="./assets/objects/cuaderno-a.png" alt="" />Cuaderno A · $30</span></label>
          <label class="choice-card"><input type="radio" name="s3_cuaderno_elegido" value="B" ${situationThreeProgress.answers.s3_cuaderno_elegido === "B" ? "checked" : ""} /><span><img src="./assets/objects/cuaderno-b.png" alt="" />Cuaderno B · $35</span></label>
          <label class="choice-card"><input type="radio" name="s3_cuaderno_elegido" value="C" ${situationThreeProgress.answers.s3_cuaderno_elegido === "C" ? "checked" : ""} /><span><img src="./assets/objects/cuaderno-c.png" alt="" />Cuaderno C · $40</span></label>
        </div>
      </fieldset>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${exhausted
        ? '<button class="primary-button" type="button" data-action="s3-continue-after-attempts">Continuar con mi respuesta <span aria-hidden="true">→</span></button>'
        : `<button class="primary-button" type="submit">${attempts.length ? "Segundo intento" : "Comprobar y continuar"} <span aria-hidden="true">→</span></button>`}
    </form>`);
};

const renderSituationThreeCheck = () => {
  const attempts = situationThreeAttemptList("s3_comprobacion");
  const exhausted = attempts.length >= 2 && !attempts.some((attempt) => attempt.correct);
  const feedback = situationThreeAttemptFeedback(
    "s3_comprobacion",
    "Primer intento guardado. Pista: calcula el lado izquierdo de tu sustitución y compáralo con $195.",
    "Tus dos intentos quedaron guardados. Puedes continuar; tu sustitución y tu respuesta se conservan exactamente como las escribiste.",
  );
  app.innerHTML = situationThreePanel(8, `
    <p class="s1-situation-context">Sustituye el valor que encontraste y comprueba si ambos lados conservan el mismo valor.</p>
    <h3>Sustituye y comprueba</h3>
    <div class="equation-card">5x + 45 = 195</div>
    <form class="challenge-form" id="challenge-form" data-s3-stage="8" novalidate>
      <label class="field-group">
        <span class="field-label">Sustituye el valor encontrado en la ecuación.</span>
        <textarea class="text-input open-response s3-math-response" name="s3_sustitucion" autocomplete="off" required>${situationThreeSavedAnswer("s3_sustitucion")}</textarea>
      </label>
      <fieldset class="field-group">
        <legend>¿Se mantiene la igualdad?</legend>
        <div class="answer-grid two-options">
          <label class="answer-choice"><input type="radio" name="s3_se_mantiene_igualdad" value="Sí" ${situationThreeProgress.answers.s3_se_mantiene_igualdad === "Sí" ? "checked" : ""} /><span>Sí</span></label>
          <label class="answer-choice"><input type="radio" name="s3_se_mantiene_igualdad" value="No" ${situationThreeProgress.answers.s3_se_mantiene_igualdad === "No" ? "checked" : ""} /><span>No</span></label>
        </div>
      </fieldset>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${exhausted
        ? '<button class="primary-button" type="button" data-action="s3-continue-after-attempts">Continuar con mi respuesta <span aria-hidden="true">→</span></button>'
        : `<button class="primary-button" type="submit">${attempts.length ? "Segundo intento" : "Comprobar y continuar"} <span aria-hidden="true">→</span></button>`}
    </form>`);
};

const renderSituationThreeAgenda = () => {
  const items = agendaItems.map((item, index) => `
    <li class="${index < 2 ? "s2-agenda-done" : "s2-agenda-pending"}">
      <img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" />
      <span class="s2-agenda-task">${item}<small class="s2-agenda-status">${index < 2 ? "✓ Completada" : "Pendiente"}</small></span>
    </li>`).join("");
  const reminderDay = escapeHtml(situationTwoProgress.answers.s2_dia_comprar_alimento || "2");
  app.innerHTML = situationThreePanel(9, `
    <span class="s1-panel-kicker">Agenda actualizada</span>
    <p class="s1-dialogue-line">¡Listo! Tadeo encontró el cuaderno que necesitaba y terminó su compra en la papelería.</p>
    <h1>La agenda de Tadeo</h1>
    <div class="s1-agenda-book s2-final-agenda">
      <img src="./assets/objects/Agenda%20abierta%204%20actividades.png" alt="Agenda abierta de Tadeo con las dos primeras actividades completadas" />
      <ol class="s1-agenda-book-list">${items}</ol>
    </div>
    <aside class="s2-reminder">
      <img src="./assets/objects/bolsa_alimento_casi_vacia.png" alt="" />
      <p><strong>Pendiente futuro</strong>Comprar alimento para el perro el día ${reminderDay}.</p>
    </aside>
    <p class="next-activity"><strong>Siguiente actividad:</strong> Comprar un regalo para Eloísa.</p>
    ${situationThreeReviewRequested ? "" : '<button class="primary-button" type="button" data-action="start-s4">CONTINUAR <span aria-hidden="true">→</span></button>'}
  `, "s1-agenda-panel s2-agenda-panel s3-agenda-panel");
};

const renderSituationThree = () => {
  const stageIndex = situationThreeProgress.stage;
  progressBar.style.width = `${Math.round(((stageIndex + 1) / 10) * 100)}%`;
  const renderers = [
    renderSituationThreeNarrative,
    renderSituationThreeExploration,
    renderSituationThreeRepresentation,
    renderSituationThreeFiveNotebooks,
    renderSituationThreeEquality,
    renderSituationThreeBriefRepresentation,
    renderSituationThreeDiscovery,
    renderSituationThreeSolve,
    renderSituationThreeCheck,
    renderSituationThreeAgenda,
  ];
  renderers[stageIndex]();
};

const situationFourGifts = [
  { value: "peluche", label: "Peluche", image: "./assets/objects/regalo-peluche.png" },
  { value: "caja", label: "Caja sorpresa", image: "./assets/objects/regalo-caja.png" },
  { value: "lampara", label: "Lámpara", image: "./assets/objects/regalo-lampara.png" },
];

const situationFourHud = (stageIndex) => {
  const dots = Array.from(
    { length: 11 },
    (_, index) => `<span class="s1-hud-dot ${index < stageIndex ? "done" : ""} ${index === stageIndex ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud s4-hud" aria-label="Situación 4, pantalla ${stageIndex + 31} de 41">
      <span class="s1-hud-title">Situación 4</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const situationFourObjects = (stageIndex) => {
  if (stageIndex === 0) {
    return `
      <div class="s4-scene-objects" aria-hidden="true">
        <img class="s4-tadeo" src="./assets/characters/tadeo.png" alt="" />
        <img class="s4-clerk" src="./assets/characters/encargada-regalos.png" alt="" />
      </div>`;
  }
  return `
    <div class="s4-scene-objects" aria-hidden="true">
      <img class="s4-tadeo ${stageIndex === 10 ? "s4-tadeo-finished" : ""}" src="./assets/characters/${stageIndex === 10 ? "tadeo-celebrando.png" : "tadeo-pensando.png"}" alt="" />
    </div>`;
};

const situationFourPanel = (stageIndex, content, panelClass = "") => {
  const atStore = stageIndex === 0;
  const background = atStore ? "./assets/scenes/regalos.png" : "./assets/scenes/habitacion.png";
  return `
    <section class="screen situation-four-screen s1-game-stage s4-game-stage ${atStore ? "s4-store-stage" : "s4-home-stage"}" data-s4-screen="${stageIndex}" style="background-image: url('${background}')">
      ${situationFourHud(stageIndex)}
      ${situationFourObjects(stageIndex)}
      <div class="s1-interface-panel s4-interface-panel ${panelClass}">
        <div class="s3-panel-utility">
          <div class="s1-panel-heading">
            <span class="s1-panel-kicker">Pantalla ${stageIndex + 31} · Situación 4</span>
            <span class="s1-panel-scene">${atStore ? "Tienda de regalos" : "Habitación de Tadeo"}</span>
          </div>
          <button class="secondary-button s3-home-button" type="button" data-action="s4-return-home">Regresar al inicio</button>
        </div>
        ${content}
      </div>
    </section>`;
};

const situationFourSavedAnswer = (name) => escapeHtml(situationFourProgress.answers[name] || "");

const selectedSituationFourGift = () => situationFourGifts.find(
  (gift) => gift.value === (situationFourProgress.selectedGift || situationFourProgress.answers.s4_regalo_elegido),
);

const situationFourGiftReminder = () => {
  const gift = selectedSituationFourGift();
  if (!gift) return "el regalo que eligió";
  return `<span class="s4-inline-gift"><img src="${gift.image}" alt="" />${gift.label}</span>`;
};

const situationFourAttemptList = (name) => {
  const attempts = situationFourProgress.objectiveAttempts[name];
  return Array.isArray(attempts) ? attempts : [];
};

const situationFourAttemptFeedback = (name, firstHint, secondHint) => {
  const attempts = situationFourAttemptList(name);
  if (!attempts.length || attempts.some((attempt) => attempt.correct)) return "";
  return `<p class="feedback" id="feedback" role="status">${attempts.length >= 2 ? secondHint : firstHint}</p>`;
};

const situationFourObjectiveControls = (name, firstLabel = "Comprobar y continuar") => {
  const attempts = situationFourAttemptList(name);
  const exhausted = attempts.length >= 2 && !attempts.some((attempt) => attempt.correct);
  if (exhausted) {
    return '<button class="primary-button" type="button" data-action="s4-continue-after-attempts">Continuar con mis respuestas <span aria-hidden="true">→</span></button>';
  }
  return `<button class="primary-button" type="submit">${attempts.length ? "Segundo intento" : firstLabel} <span aria-hidden="true">→</span></button>`;
};

const renderSituationFourGift = () => {
  const selected = situationFourProgress.selectedGift || situationFourProgress.answers.s4_regalo_elegido || "";
  const choices = situationFourGifts.map((gift) => `
    <label class="choice-card s4-gift-choice">
      <input type="radio" name="s4_regalo_elegido" value="${gift.value}" ${selected === gift.value ? "checked" : ""} />
      <span><img src="${gift.image}" alt="" /><strong>${gift.label}</strong><small>$180</small></span>
    </label>`).join("");
  app.innerHTML = situationFourPanel(0, `
    <p class="s1-situation-context">Tercera actividad de la agenda · Comprar un regalo para Eloísa</p>
    <h3>Elige un regalo</h3>
    <p class="challenge-intro">Tadeo llegó a la tienda. Puede escoger el regalo que más le guste para Eloísa. <strong>Todos cuestan $180.</strong></p>
    <form class="challenge-form" id="challenge-form" data-s4-stage="0" novalidate>
      <fieldset class="field-group">
        <legend>¿Cuál regalo quieres que compre Tadeo?</legend>
        <div class="choice-grid s4-gift-grid">${choices}</div>
      </fieldset>
      <p class="helper-text s2-open-note">No hay una elección correcta o incorrecta. Elige el que prefieras.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Comprar por $180 <span aria-hidden="true">→</span></button>
    </form>
  `, "s4-store-panel");
};

const renderSituationFourReturn = () => {
  app.innerHTML = situationFourPanel(1, `
    <p class="s1-situation-context">Después de comprar ${situationFourGiftReminder()}, Tadeo regresa a casa.</p>
    <h3>Un registro incompleto</h3>
    <div class="s4-record-introduction">
      <img src="./assets/objects/registro-ahorros.png" alt="Registro de ahorros de Tadeo" />
      <div>
        <p>Al revisar su registro de ahorros, Tadeo descubre que olvidó anotar sus últimos <strong>4 ingresos</strong>.</p>
        <p>Los cuatro ingresos fueron de la <strong>misma cantidad</strong>. Después gastó <strong>$180</strong> en el regalo y le quedaron <strong>$300</strong>.</p>
      </div>
    </div>
    <p class="s2-dialogue">“Necesito descubrir cuánto fue cada ingreso para completar mi registro.”</p>
    <button class="primary-button" type="button" data-action="s4-next">Revisar los datos <span aria-hidden="true">→</span></button>
  `, "s4-narrative-panel");
};

const renderSituationFourExploration = () => {
  app.innerHTML = situationFourPanel(2, `
    <p class="s1-situation-context">Distingue la información que Tadeo conoce de aquello que necesita averiguar.</p>
    <h3>Explora el registro</h3>
    <aside class="s4-story-summary" aria-label="Resumen de la situación">
      <span>4 ingresos iguales</span><span>Regalo: $180</span><span>Saldo: $300</span>
    </aside>
    <form class="challenge-form" id="challenge-form" data-s4-stage="2" novalidate>
      <label class="field-group">
        <span class="field-label">a) ¿Qué cantidades conoces en esta situación?</span>
        <textarea class="text-input open-response" name="s4_cantidades_conocidas" required>${situationFourSavedAnswer("s4_cantidades_conocidas")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">b) ¿Qué cantidad necesita encontrar Tadeo?</span>
        <textarea class="text-input open-response" name="s4_cantidad_encontrar" required>${situationFourSavedAnswer("s4_cantidad_encontrar")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">c) ¿Cuál es la cantidad desconocida?</span>
        <textarea class="text-input open-response" name="s4_incognita" required>${situationFourSavedAnswer("s4_incognita")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe tus ideas con tus propias palabras. Conservaremos literalmente tus respuestas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFourFourIncomes = () => {
  app.innerHTML = situationFourPanel(3, `
    <p class="s1-situation-context">En el registro faltan cuatro ingresos. Cada uno fue de la misma cantidad, que todavía no conocemos.</p>
    <h3>Representa los cuatro ingresos</h3>
    <div class="s4-income-slots" aria-label="Cuatro ingresos iguales de cantidad desconocida">
      <span>Ingreso 1<strong>?</strong></span><span>Ingreso 2<strong>?</strong></span><span>Ingreso 3<strong>?</strong></span><span>Ingreso 4<strong>?</strong></span>
    </div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="3" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cómo representarías juntos los cuatro ingresos iguales?</span>
        <textarea class="text-input open-response s3-math-response" name="s4_cuatro_ingresos" autocomplete="off" required>${situationFourSavedAnswer("s4_cuatro_ingresos")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Construye tu propia representación. Guardaremos exactamente lo que escribas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar representación <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFourEquation = () => {
  app.innerHTML = situationFourPanel(4, `
    <p class="s1-situation-context">Relaciona los cuatro ingresos iguales con el dinero que salió y el saldo que quedó.</p>
    <h3>Construye la ecuación</h3>
    <div class="s3-data-chips s4-data-chips" aria-label="Datos para construir la ecuación">
      <span>4 ingresos iguales</span><span>Gasto: $180</span><span>Saldo restante: $300</span>
    </div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="4" novalidate>
      <label class="field-group">
        <span class="field-label">Escribe una ecuación que represente lo ocurrido en el registro.</span>
        <textarea class="text-input open-response s3-math-response" name="s4_ecuacion" autocomplete="off" required>${situationFourSavedAnswer("s4_ecuacion")}</textarea>
      </label>
      <p class="helper-text s2-open-note">La ecuación debe ser tu construcción. No tiene que seguir una única forma de escritura.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar ecuación <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFourMeanings = () => {
  app.innerHTML = situationFourPanel(5, `
    <p class="s1-situation-context">Ahora compara tu construcción con una forma algebraica de representar el registro.</p>
    <h3>¿Qué representa cada parte?</h3>
    <div class="equation-card">4x − 180 = 300</div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="5" novalidate>
      <label class="field-group">
        <span class="field-label">¿Qué representa 4x en esta situación?</span>
        <textarea class="text-input open-response" name="s4_significado_4x" required>${situationFourSavedAnswer("s4_significado_4x")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué representa −180?</span>
        <textarea class="text-input open-response" name="s4_significado_menos180" required>${situationFourSavedAnswer("s4_significado_menos180")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué representa 300?</span>
        <textarea class="text-input open-response" name="s4_significado_300" required>${situationFourSavedAnswer("s4_significado_300")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Explica cada parte con tus propias palabras. Estas respuestas no se califican automáticamente.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar explicaciones <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFourSolve = () => {
  const feedback = situationFourAttemptFeedback(
    "s4_valor_x",
    "Primer intento guardado. Pista: piensa cómo deshacer primero el gasto y después cómo repartir el total entre los cuatro ingresos.",
    "Tus dos intentos quedaron guardados. Puedes continuar con el valor que obtuviste; no reemplazaremos tu respuesta.",
  );
  app.innerHTML = situationFourPanel(6, `
    <p class="s1-situation-context">Resuelve la ecuación y registra el camino que seguiste.</p>
    <h3>Resuelve</h3>
    <div class="equation-card">4x − 180 = 300</div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="6" novalidate>
      <label class="field-group">
        <span class="field-label">Escribe tu procedimiento.</span>
        <textarea class="text-input open-response s3-math-response" name="s4_procedimiento" autocomplete="off" required>${situationFourSavedAnswer("s4_procedimiento")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué valor obtuviste para x?</span>
        <input class="text-input" inputmode="numeric" name="s4_valor_x" value="${situationFourSavedAnswer("s4_valor_x")}" autocomplete="off" required />
      </label>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFourObjectiveControls("s4_valor_x")}
    </form>
  `);
};

const renderSituationFourExplanation = () => {
  app.innerHTML = situationFourPanel(7, `
    <p class="s1-situation-context">Ya registraste tus operaciones. Ahora explica por qué las realizaste.</p>
    <h3>Explica tu procedimiento</h3>
    <div class="equation-card">4x − 180 = 300</div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="7" novalidate>
      <label class="field-group">
        <span class="field-label">Con tus propias palabras, ¿cómo resolviste la ecuación?</span>
        <textarea class="text-input open-response" name="s4_explicacion_procedimiento" required>${situationFourSavedAnswer("s4_explicacion_procedimiento")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Tu explicación es una producción personal y se conservará literalmente.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar explicación <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFourCheck = () => {
  const feedback = situationFourAttemptFeedback(
    "s4_se_mantiene_igualdad",
    "Primer intento guardado. Pista: calcula el lado izquierdo con el valor que encontraste y compáralo con 300.",
    "Tus dos intentos quedaron guardados. Puedes continuar con tu comprobación e interpretación tal como las escribiste.",
  );
  app.innerHTML = situationFourPanel(8, `
    <p class="s1-situation-context">Sustituye el valor encontrado, comprueba la igualdad y vuelve a la historia de Tadeo.</p>
    <h3>Sustituye, comprueba e interpreta</h3>
    <div class="equation-card">4x − 180 = 300</div>
    <form class="challenge-form" id="challenge-form" data-s4-stage="8" novalidate>
      <label class="field-group">
        <span class="field-label">Sustituye el valor que encontraste en la ecuación.</span>
        <textarea class="text-input open-response s3-math-response" name="s4_sustitucion" autocomplete="off" required>${situationFourSavedAnswer("s4_sustitucion")}</textarea>
      </label>
      <fieldset class="field-group">
        <legend>¿Se mantiene la igualdad?</legend>
        <div class="answer-grid two-options">
          <label class="answer-choice"><input type="radio" name="s4_se_mantiene_igualdad" value="Sí" ${situationFourProgress.answers.s4_se_mantiene_igualdad === "Sí" ? "checked" : ""} /><span>Sí</span></label>
          <label class="answer-choice"><input type="radio" name="s4_se_mantiene_igualdad" value="No" ${situationFourProgress.answers.s4_se_mantiene_igualdad === "No" ? "checked" : ""} /><span>No</span></label>
        </div>
      </fieldset>
      <label class="field-group">
        <span class="field-label">¿Qué representa el valor encontrado dentro de esta situación?</span>
        <textarea class="text-input open-response" name="s4_interpretacion_resultado" required>${situationFourSavedAnswer("s4_interpretacion_resultado")}</textarea>
      </label>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFourObjectiveControls("s4_se_mantiene_igualdad")}
    </form>
  `);
};

const situationFourRegisterField = (index) => `
  <label class="s4-register-row">
    <span>Ingreso ${index}</span>
    <span class="s4-register-amount"><span aria-hidden="true">$</span><input inputmode="numeric" name="s4_registro_ingreso${index}" value="${situationFourSavedAnswer(`s4_registro_ingreso${index}`)}" aria-label="Cantidad del ingreso ${index}" autocomplete="off" required /></span>
  </label>`;

const renderSituationFourRegister = () => {
  const feedback = situationFourAttemptFeedback(
    "s4_registro",
    "Primer intento guardado. Pista: usa el valor que obtuviste para completar cada uno de los cuatro ingresos iguales.",
    "Tus dos intentos quedaron guardados. Puedes continuar; los valores del registro no serán sustituidos por otros.",
  );
  app.innerHTML = situationFourPanel(9, `
    <p class="s1-situation-context">Aplica el resultado para completar los movimientos que faltan en el registro de Tadeo.</p>
    <h3>Actualiza el registro de ahorros</h3>
    <form class="challenge-form" id="challenge-form" data-s4-stage="9" novalidate>
      <div class="s4-savings-register">
        <img src="./assets/objects/registro-ahorros.png" alt="" />
        <div class="s4-register-balance" aria-label="Saldo restante de 300 pesos">Saldo: $300</div>
        <div class="s4-register-entries">
          ${[1, 2, 3, 4].map((index) => situationFourRegisterField(index)).join("")}
          <div class="s4-register-row s4-register-expense"><span>Regalo</span><strong>−$180</strong></div>
        </div>
      </div>
      <p class="helper-text s2-open-note">Completa únicamente los cuatro ingresos. El gasto y el saldo ya están registrados.</p>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFourObjectiveControls("s4_registro", "Comprobar registro")}
    </form>
  `, "s4-register-panel");
};

const renderSituationFourAgenda = () => {
  const items = agendaItems.map((item, index) => `
    <li class="${index < 3 ? "s2-agenda-done" : "s2-agenda-pending"}">
      <img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" />
      <span class="s2-agenda-task">${item}<small class="s2-agenda-status">${index < 3 ? "✓ Completada" : "Pendiente"}</small></span>
    </li>`).join("");
  const reminderDay = escapeHtml(situationTwoProgress.answers.s2_dia_comprar_alimento || "2");
  app.innerHTML = situationFourPanel(10, `
    <span class="s1-panel-kicker">Agenda actualizada</span>
    <p class="s1-dialogue-line">¡Listo! Tadeo compró el regalo para Eloísa y completó su registro de ahorros.</p>
    <h1>La agenda de Tadeo</h1>
    <div class="s1-agenda-book s2-final-agenda">
      <img src="./assets/objects/Agenda%20abierta%204%20actividades.png" alt="Agenda abierta de Tadeo con las tres primeras actividades completadas" />
      <ol class="s1-agenda-book-list">${items}</ol>
    </div>
    <aside class="s2-reminder">
      <img src="./assets/objects/bolsa_alimento_casi_vacia.png" alt="" />
      <p><strong>Pendiente futuro</strong>Comprar alimento para el perro el día ${reminderDay}.</p>
    </aside>
    <p class="next-activity"><strong>Siguiente actividad:</strong> Ayudar con la cena.</p>
    ${situationFourReviewRequested ? "" : '<button class="primary-button" type="button" data-action="start-s5">CONTINUAR <span aria-hidden="true">→</span></button>'}
  `, "s1-agenda-panel s2-agenda-panel s4-agenda-panel");
};

const renderSituationFour = () => {
  const stageIndex = situationFourProgress.stage;
  progressBar.style.width = `${Math.round(((stageIndex + 1) / 11) * 100)}%`;
  const renderers = [
    renderSituationFourGift,
    renderSituationFourReturn,
    renderSituationFourExploration,
    renderSituationFourFourIncomes,
    renderSituationFourEquation,
    renderSituationFourMeanings,
    renderSituationFourSolve,
    renderSituationFourExplanation,
    renderSituationFourCheck,
    renderSituationFourRegister,
    renderSituationFourAgenda,
  ];
  renderers[stageIndex]();
};

const situationFiveRecipes = [
  { value: "1", label: "Receta 1", image: "./assets/objects/receta-1.png" },
  { value: "2", label: "Receta 2", image: "./assets/objects/receta-2.png" },
];

const situationFiveHud = (stageIndex) => {
  const dots = Array.from(
    { length: 12 },
    (_, index) => `<span class="s1-hud-dot ${index < stageIndex ? "done" : ""} ${index === stageIndex ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud s5-hud" aria-label="Situación 5, pantalla ${stageIndex + 42} de 53">
      <span class="s1-hud-title">Situación 5</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const situationFiveObjects = (stageIndex) => {
  const isFinalNarrative = stageIndex === 10;
  const isAgenda = stageIndex === 11;
  const selectedRecipe = situationFiveProgress.selectedRecipe || situationFiveProgress.answers.s5_receta_elegida || "1";
  const selected = situationFiveRecipes.find((recipe) => recipe.value === selectedRecipe) || situationFiveRecipes[0];
  return `
    <div class="s5-scene-objects ${isFinalNarrative ? "s5-preparation-scene" : ""}" aria-hidden="true">
      <img class="s5-tadeo" src="./assets/characters/${isAgenda ? "tadeo-celebrando.png" : "tadeo.png"}" alt="" />
      <img class="s5-mama" src="./assets/characters/mama.png" alt="" />
      ${stageIndex === 0 ? `
        <img class="s5-scene-recipe s5-scene-recipe-one" src="./assets/objects/receta-1.png" alt="" />
        <img class="s5-scene-recipe s5-scene-recipe-two" src="./assets/objects/receta-2.png" alt="" />
        <img class="s5-scene-ingredient s5-scene-meat" src="./assets/objects/porcion_carne.png" alt="" />
        <img class="s5-scene-ingredient s5-scene-side" src="./assets/objects/guarnicion_carne.png" alt="" />
      ` : ""}
      ${isFinalNarrative ? `
        <img class="s5-selected-recipe-prop" src="${selected.image}" alt="" />
        <img class="s5-preparation-meat" src="./assets/objects/porcion_carne.png" alt="" />
        <img class="s5-preparation-side" src="./assets/objects/guarnicion_carne.png" alt="" />
      ` : ""}
    </div>`;
};

const situationFivePanel = (stageIndex, content, panelClass = "") => `
  <section class="screen situation-five-screen s1-game-stage s5-game-stage" data-s5-screen="${stageIndex}" style="background-image: url('./assets/scenes/cocina.png')">
    ${situationFiveHud(stageIndex)}
    ${situationFiveObjects(stageIndex)}
    <div class="s1-interface-panel s5-interface-panel ${panelClass}">
      <div class="s3-panel-utility">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Pantalla ${stageIndex + 42} · Situación 5</span>
          <span class="s1-panel-scene">La cocina</span>
        </div>
        <button class="secondary-button s3-home-button" type="button" data-action="s5-return-home">Regresar al inicio</button>
      </div>
      ${content}
    </div>
  </section>`;

const finalFlowHud = (screen) => {
  const dots = Array.from(
    { length: 14 },
    (_, index) => `<span class="s1-hud-dot ${index < screen - 42 ? "done" : ""} ${index === screen - 42 ? "current" : ""}" aria-hidden="true"></span>`,
  ).join("");
  return `
    <div class="s1-hud s5-hud" aria-label="Cierre, pantalla ${screen} de 55">
      <span class="s1-hud-title">Cierre</span>
      <span class="s1-hud-dots">${dots}</span>
    </div>`;
};

const finalFlowPanel = (screen, content, panelClass = "") => `
  <section class="screen situation-five-screen s1-game-stage s5-game-stage" data-final-screen="${screen}" style="background-image: url('./assets/scenes/cocina.png')">
    ${finalFlowHud(screen)}
    ${situationFiveObjects(11)}
    <div class="s1-interface-panel s5-interface-panel ${panelClass}">
      <div class="s3-panel-utility">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Pantalla ${screen} · Cierre del recorrido</span>
          <span class="s1-panel-scene">La cocina</span>
        </div>
      </div>
      ${content}
    </div>
  </section>`;

const situationFiveSavedAnswer = (name) => escapeHtml(situationFiveProgress.answers[name] || "");

const situationFiveAttemptList = (name) => {
  const attempts = situationFiveProgress.objectiveAttempts[name];
  return Array.isArray(attempts) ? attempts : [];
};

const situationFiveAttemptFeedback = (name, firstHint, secondHint) => {
  const attempts = situationFiveAttemptList(name);
  if (!attempts.length || attempts.some((attempt) => attempt.correct)) return "";
  return `<p class="feedback" id="feedback" role="status">${attempts.length >= 2 ? secondHint : firstHint}</p>`;
};

const situationFiveObjectiveControls = (name, firstLabel = "Comprobar y continuar") => {
  const attempts = situationFiveAttemptList(name);
  const exhausted = attempts.length >= 2 && !attempts.some((attempt) => attempt.correct);
  if (exhausted) {
    return '<button class="primary-button" type="button" data-action="s5-continue-after-attempts">Continuar con mis respuestas <span aria-hidden="true">→</span></button>';
  }
  return `<button class="primary-button" type="submit">${attempts.length ? "Segundo intento" : firstLabel} <span aria-hidden="true">→</span></button>`;
};

const renderSituationFiveNarrative = () => {
  app.innerHTML = situationFivePanel(0, `
    <p class="s1-situation-context">Última actividad de la agenda · Ayudar con la cena</p>
    <h3>Dos formas de preparar la cena</h3>
    <p class="challenge-intro">Tadeo entra a la cocina para ayudar a su mamá. Antes de comenzar, comparan dos formas de preparar una receta.</p>
    <div class="s5-recipe-facts" aria-label="Datos de las dos recetas">
      <article class="s5-recipe-fact s5-recipe-fact-one">
        <img src="./assets/objects/receta-1.png" alt="" />
        <div><strong>Receta 1</strong><span>150 g por porción</span><span>+ 100 g adicionales</span></div>
      </article>
      <article class="s5-recipe-fact s5-recipe-fact-two">
        <img src="./assets/objects/receta-2.png" alt="" />
        <div><strong>Receta 2</strong><span>100 g por porción</span><span>+ 300 g adicionales</span></div>
      </article>
    </div>
    <p class="central-question">¿Para cuántas porciones ambas recetas requieren la misma cantidad total?</p>
    <button class="primary-button" type="button" data-action="s5-next">Explorar las recetas <span aria-hidden="true">→</span></button>
  `, "s5-narrative-panel");
};

const renderSituationFiveExploration = () => {
  app.innerHTML = situationFivePanel(1, `
    <p class="s1-situation-context">Observa los datos de ambas recetas y distingue lo que conoces de lo que necesitas averiguar.</p>
    <h3>Explora la situación</h3>
    <div class="s5-data-recap" aria-label="Recordatorio de los datos de las recetas">
      <article><strong>Receta 1</strong><span>150 g por porción</span><span>+ 100 g adicionales</span></article>
      <article><strong>Receta 2</strong><span>100 g por porción</span><span>+ 300 g adicionales</span></article>
    </div>
    <p class="s5-recap-question">¿Para cuántas porciones ambas recetas requieren la misma cantidad total?</p>
    <form class="challenge-form" id="challenge-form" data-s5-stage="1" novalidate>
      <label class="field-group">
        <span class="field-label">a) ¿Qué cantidades conoces en esta situación?</span>
        <textarea class="text-input open-response" name="s5_cantidades_conocidas" required>${situationFiveSavedAnswer("s5_cantidades_conocidas")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">b) ¿Qué cantidad debes encontrar?</span>
        <textarea class="text-input open-response" name="s5_cantidad_encontrar" required>${situationFiveSavedAnswer("s5_cantidad_encontrar")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">c) ¿Cuál es la cantidad desconocida o incógnita?</span>
        <textarea class="text-input open-response" name="s5_incognita" required>${situationFiveSavedAnswer("s5_incognita")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe con tus propias palabras. Conservaremos literalmente tus respuestas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar y continuar <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFiveRecipeOne = () => {
  app.innerHTML = situationFivePanel(2, `
    <p class="s1-situation-context">La receta 1 utiliza 150 g de carne por cada porción y después incorpora 100 g adicionales.</p>
    <h3>Construye la receta 1</h3>
    <div class="s5-ingredient-reminder" aria-label="Datos de la receta 1">
      <span><img src="./assets/objects/porcion_carne.png" alt="" />150 g por porción</span>
      <span><img src="./assets/objects/guarnicion_carne.png" alt="" />100 g adicionales</span>
    </div>
    <form class="challenge-form" id="challenge-form" data-s5-stage="2" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cómo representarías la cantidad de carne correspondiente a las porciones?</span>
        <textarea class="text-input open-response s3-math-response" name="s5_receta1_porciones" autocomplete="off" required>${situationFiveSavedAnswer("s5_receta1_porciones")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">Ahora incorpora los 100 g adicionales. ¿Cómo representarías el total de la receta 1?</span>
        <textarea class="text-input open-response s3-math-response" name="s5_receta1_total" autocomplete="off" required>${situationFiveSavedAnswer("s5_receta1_total")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Construye tus propias expresiones. Guardaremos exactamente lo que escribas.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar expresiones <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFiveRecipeTwo = () => {
  app.innerHTML = situationFivePanel(3, `
    <p class="s1-situation-context">La receta 2 utiliza 100 g de carne por cada porción y 300 g adicionales.</p>
    <h3>Construye la receta 2</h3>
    <div class="s5-ingredient-reminder" aria-label="Datos de la receta 2">
      <span><img src="./assets/objects/porcion_carne.png" alt="" />100 g por porción</span>
      <span><img src="./assets/objects/guarnicion_carne.png" alt="" />300 g adicionales</span>
    </div>
    <form class="challenge-form" id="challenge-form" data-s5-stage="3" novalidate>
      <label class="field-group">
        <span class="field-label">¿Cómo representarías la cantidad total de la receta 2?</span>
        <textarea class="text-input open-response s3-math-response" name="s5_receta2_total" autocomplete="off" required>${situationFiveSavedAnswer("s5_receta2_total")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Escribe tu propia expresión. No será reemplazada por una respuesta modelo.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar expresión <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFiveRelation = () => {
  const feedback = situationFiveAttemptFeedback(
    "s5_signo_relacion",
    "Primer intento guardado. Pista: piensa qué debe indicar el signo cuando las dos cantidades totales representan el mismo valor.",
    "Tus dos intentos quedaron guardados. Puedes continuar con el signo que elegiste; no cambiaremos tu respuesta.",
  );
  const selected = situationFiveProgress.answers.s5_signo_relacion || "";
  app.innerHTML = situationFivePanel(4, `
    <p class="s1-situation-context">Compara las expresiones que construiste sin cambiar su escritura.</p>
    <h3>Relaciona las dos recetas</h3>
    <div class="s5-student-expressions" aria-label="Expresiones construidas por el estudiante">
      <article><span>Tu receta 1</span><strong>${situationFiveSavedAnswer("s5_receta1_total")}</strong></article>
      <article><span>Tu receta 2</span><strong>${situationFiveSavedAnswer("s5_receta2_total")}</strong></article>
    </div>
    <form class="challenge-form" id="challenge-form" data-s5-stage="4" novalidate>
      <fieldset class="field-group">
        <legend>¿Qué signo debe relacionar las expresiones cuando representan la misma cantidad total?</legend>
        <div class="answer-grid s5-sign-grid">
          ${["=", "<", ">"].map((sign) => `<label class="answer-choice s5-sign-choice"><input type="radio" name="s5_signo_relacion" value="${sign}" ${selected === sign ? "checked" : ""} /><span>${sign}</span></label>`).join("")}
        </div>
      </fieldset>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFiveObjectiveControls("s5_signo_relacion")}
    </form>
  `);
};

const renderSituationFiveEquation = () => {
  const builtEquation = situationFiveProgress.answers.s5_ecuacion_construida || "";
  app.innerHTML = situationFivePanel(5, `
    <p class="s1-situation-context">Usa exactamente tus expresiones y el signo que elegiste para formar una relación completa.</p>
    <h3>Construye la ecuación</h3>
    <div class="s5-equation-parts" aria-label="Elementos disponibles para construir la relación">
      <span>${situationFiveSavedAnswer("s5_receta1_total")}</span>
      <b>${situationFiveSavedAnswer("s5_signo_relacion")}</b>
      <span>${situationFiveSavedAnswer("s5_receta2_total")}</span>
    </div>
    ${builtEquation
      ? `<div class="s5-built-equation"><span>Tu relación construida</span><strong>${escapeHtml(builtEquation)}</strong></div>`
      : '<button class="primary-button s5-build-button" type="button" data-action="s5-build-equation">Formar relación con mis expresiones</button>'}
    <form class="challenge-form" id="challenge-form" data-s5-stage="5" novalidate>
      <input type="hidden" name="s5_sustitucion_expresiones" value="${situationFiveSavedAnswer("s5_sustitucion_expresiones")}" />
      <input type="hidden" name="s5_ecuacion_construida" value="${situationFiveSavedAnswer("s5_ecuacion_construida")}" />
      <label class="field-group">
        <span class="field-label">¿Qué significa el signo = en esta situación?</span>
        <textarea class="text-input open-response" name="s5_significado_igual" required>${situationFiveSavedAnswer("s5_significado_igual")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Explica con tus propias palabras. Tu relación y tu explicación se conservarán literalmente.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Guardar relación y explicación <span aria-hidden="true">→</span></button>
    </form>
  `);
};

const renderSituationFiveSolve = () => {
  const feedback = situationFiveAttemptFeedback(
    "s5_valor_x",
    "Primer intento guardado. Pista: reúne en un lado los términos que contienen x y en el otro las cantidades conocidas.",
    "Tus dos intentos quedaron guardados. Puedes continuar con el valor que obtuviste; no reemplazaremos tu respuesta.",
  );
  app.innerHTML = situationFivePanel(6, `
    <p class="s1-situation-context">Ahora resuelve la relación y registra el camino que seguiste.</p>
    <h3>Resuelve y explica</h3>
    <div class="equation-card">150x + 100 = 100x + 300</div>
    <form class="challenge-form" id="challenge-form" data-s5-stage="6" novalidate>
      <label class="field-group">
        <span class="field-label">Escribe tu procedimiento.</span>
        <textarea class="text-input open-response s3-math-response" name="s5_procedimiento" autocomplete="off" required>${situationFiveSavedAnswer("s5_procedimiento")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué valor obtuviste para x?</span>
        <input class="text-input" name="s5_valor_x" value="${situationFiveSavedAnswer("s5_valor_x")}" autocomplete="off" required />
      </label>
      <label class="field-group">
        <span class="field-label">Explica con tus propias palabras cómo resolviste la ecuación.</span>
        <textarea class="text-input open-response" name="s5_explicacion_procedimiento" required>${situationFiveSavedAnswer("s5_explicacion_procedimiento")}</textarea>
      </label>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFiveObjectiveControls("s5_valor_x")}
    </form>
  `);
};

const renderSituationFiveCheck = () => {
  const feedback = situationFiveAttemptFeedback(
    "s5_comprobacion",
    "Primer intento guardado. Pista: calcula por separado cada expresión usando el valor de x que escribiste y después compara los resultados.",
    "Tus dos intentos quedaron guardados. Puedes continuar con tus sustituciones y resultados tal como los escribiste.",
  );
  const sameAmount = situationFiveProgress.answers.s5_misma_cantidad || "";
  app.innerHTML = situationFivePanel(7, `
    <p class="s1-situation-context">Comprueba las dos recetas usando el valor que realmente encontraste: <strong>x = ${situationFiveSavedAnswer("s5_valor_x")}</strong>.</p>
    <h3>Sustituye y compara</h3>
    <div class="s5-equations-reference" aria-label="Expresiones de las recetas para realizar la sustitución">
      <article><span>Receta 1</span><strong>150x + 100</strong></article>
      <article><span>Receta 2</span><strong>100x + 300</strong></article>
    </div>
    <form class="challenge-form" id="challenge-form" data-s5-stage="7" novalidate>
      <div class="s5-substitution-grid">
        <fieldset class="s5-substitution-card">
          <legend>Receta 1</legend>
          <label class="field-group"><span class="field-label">Sustituye tu valor de x.</span><textarea class="text-input open-response s3-math-response" name="s5_sustitucion_receta1_x" required>${situationFiveSavedAnswer("s5_sustitucion_receta1_x")}</textarea></label>
          <label class="field-group"><span class="field-label">¿Qué resultado obtuviste?</span><input class="text-input" name="s5_resultado_receta1" value="${situationFiveSavedAnswer("s5_resultado_receta1")}" required /></label>
        </fieldset>
        <fieldset class="s5-substitution-card">
          <legend>Receta 2</legend>
          <label class="field-group"><span class="field-label">Sustituye tu valor de x.</span><textarea class="text-input open-response s3-math-response" name="s5_sustitucion_receta2_x" required>${situationFiveSavedAnswer("s5_sustitucion_receta2_x")}</textarea></label>
          <label class="field-group"><span class="field-label">¿Qué resultado obtuviste?</span><input class="text-input" name="s5_resultado_receta2" value="${situationFiveSavedAnswer("s5_resultado_receta2")}" required /></label>
        </fieldset>
      </div>
      <fieldset class="field-group">
        <legend>¿Ambas recetas requieren la misma cantidad?</legend>
        <div class="answer-grid two-options">
          <label class="answer-choice"><input type="radio" name="s5_misma_cantidad" value="Sí" ${sameAmount === "Sí" ? "checked" : ""} /><span>Sí</span></label>
          <label class="answer-choice"><input type="radio" name="s5_misma_cantidad" value="No" ${sameAmount === "No" ? "checked" : ""} /><span>No</span></label>
        </div>
      </fieldset>
      <label class="field-group">
        <span class="field-label">¿Cuántos gramos requiere cada receta?</span>
        <input class="text-input" name="s5_gramos_cada_receta" value="${situationFiveSavedAnswer("s5_gramos_cada_receta")}" required />
      </label>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFiveObjectiveControls("s5_comprobacion")}
    </form>
  `, "s5-check-panel");
};

const renderSituationFivePortions = () => {
  const feedback = situationFiveAttemptFeedback(
    "s5_porciones_final",
    "Primer intento guardado. Pista: vuelve al significado de x dentro de la historia de las recetas.",
    "Tus dos intentos quedaron guardados. Puedes continuar con tu interpretación tal como la escribiste.",
  );
  app.innerHTML = situationFivePanel(8, `
    <p class="s1-situation-context">Vuelve a la pregunta con la que comenzó la situación.</p>
    <h3>Interpreta el resultado</h3>
    <form class="challenge-form" id="challenge-form" data-s5-stage="8" novalidate>
      <label class="field-group">
        <span class="field-label">¿Para cuántas porciones ambas recetas requieren la misma cantidad total?</span>
        <textarea class="text-input open-response" name="s5_porciones_final" required>${situationFiveSavedAnswer("s5_porciones_final")}</textarea>
      </label>
      <p class="helper-text s2-open-note">Responde dentro del contexto de las porciones, no solamente con una operación.</p>
      ${feedback || '<p class="feedback" id="feedback" role="status"></p>'}
      ${situationFiveObjectiveControls("s5_porciones_final")}
    </form>
  `);
};

const renderSituationFiveChoice = () => {
  const selected = situationFiveProgress.selectedRecipe || situationFiveProgress.answers.s5_receta_elegida || "";
  const choices = situationFiveRecipes.map((recipe) => `
    <label class="choice-card s5-recipe-choice">
      <input type="radio" name="s5_receta_elegida" value="${recipe.value}" ${selected === recipe.value ? "checked" : ""} />
      <span><img src="${recipe.image}" alt="" /><strong>${recipe.label}</strong></span>
    </label>`).join("");
  app.innerHTML = situationFivePanel(9, `
    <p class="s1-situation-context">Después de comparar las cantidades, Tadeo puede elegir libremente qué receta preparar.</p>
    <h3>Elige una receta</h3>
    <form class="challenge-form" id="challenge-form" data-s5-stage="9" novalidate>
      <fieldset class="field-group">
        <legend>¿Cuál de las dos recetas quieres que preparen Tadeo y su mamá?</legend>
        <div class="choice-grid s5-recipe-choice-grid">${choices}</div>
      </fieldset>
      <p class="helper-text s2-open-note">No hay una elección correcta o incorrecta. La solución matemática no cambia.</p>
      <p class="feedback" id="feedback" role="status"></p>
      <button class="primary-button" type="submit">Preparar la receta elegida <span aria-hidden="true">→</span></button>
    </form>
  `, "s5-choice-panel");
};

const renderSituationFivePreparation = () => {
  const selectedRecipe = situationFiveProgress.selectedRecipe || situationFiveProgress.answers.s5_receta_elegida || "1";
  const selected = situationFiveRecipes.find((recipe) => recipe.value === selectedRecipe) || situationFiveRecipes[0];
  app.innerHTML = situationFivePanel(10, `
    <p class="s1-situation-context">Preparación de la cena</p>
    <h3>Tadeo ayuda con ${selected.label.toLowerCase()}</h3>
    <div class="s5-preparation-story">
      <img src="${selected.image}" alt="${selected.label}" />
      <div>
        <p>Tadeo coloca la tarjeta de <strong>${selected.label}</strong> sobre la mesa. Su mamá prepara los ingredientes y él ayuda a organizar la carne y la guarnición.</p>
        <p>Juntos terminan de preparar la cena que eligieron.</p>
      </div>
    </div>
    <p class="s2-dialogue">“¡Listo! Ya ayudé con la última actividad de mi agenda.”</p>
    <button class="primary-button" type="button" data-action="s5-next">Ver agenda final <span aria-hidden="true">→</span></button>
  `, "s5-preparation-panel");
};

const renderSituationFiveAgenda = () => {
  const items = agendaItems.map((item, index) => `
    <li class="s2-agenda-done">
      <img class="initial-agenda-icon" src="${initialAgendaIcons[index]}" alt="" />
      <span class="s2-agenda-task">${item}<small class="s2-agenda-status">✓ Completada</small></span>
    </li>`).join("");
  const reminderDay = escapeHtml(situationTwoProgress.answers.s2_dia_comprar_alimento || "2");
  app.innerHTML = situationFivePanel(11, `
    <span class="s1-panel-kicker">Agenda actualizada</span>
    <p class="s1-dialogue-line">¡Listo! Tadeo ayudó con la cena y terminó sus cuatro actividades principales.</p>
    <h1>La agenda de Tadeo</h1>
    <div class="s1-agenda-book s2-final-agenda">
      <img src="./assets/objects/Agenda%20abierta%204%20actividades.png" alt="Agenda abierta de Tadeo con las cuatro actividades completadas" />
      <ol class="s1-agenda-book-list">${items}</ol>
    </div>
    <aside class="s2-reminder">
      <img src="./assets/objects/bolsa_alimento_casi_vacia.png" alt="" />
      <p><strong>Pendiente futuro</strong>Comprar alimento para el perro el día ${reminderDay}.</p>
    </aside>
    <p class="s5-agenda-complete"><strong>Actividades principales:</strong> 4 de 4 completadas.</p>
    ${isReviewMode ? "" : '<button class="primary-button" type="button" data-action="open-final-narrative">CONTINUAR <span aria-hidden="true">→</span></button>'}
  `, "s1-agenda-panel s2-agenda-panel s5-agenda-panel");
};

const renderFinalNarrative = () => {
  progressBar.style.width = "98%";
  app.innerHTML = finalFlowPanel(54, `
    <h1>El día de Tadeo</h1>
    <p class="challenge-intro">Después de completar todas sus actividades, Tadeo revisa su agenda y se da cuenta de que logró terminar todo lo que tenía pendiente.</p>
    <p class="challenge-intro">Durante el día tuvo que analizar diferentes situaciones, representar cantidades desconocidas y encontrar formas de resolverlas.</p>
    <button class="primary-button" type="button" data-action="open-final-screen">CONTINUAR <span aria-hidden="true">→</span></button>
  `, "s5-narrative-panel");
};

const finalScreenControls = () => {
  if (researchSession?.completedAt || finalFlow.completionStatus === "completed") {
    return `
      <p class="feedback success" role="status">Finalización confirmada.</p>
      <button class="primary-button" type="button" disabled>FINALIZADO</button>
      <button class="secondary-button" type="button" data-action="restart-completed-session">VOLVER A JUGAR</button>`;
  }
  if (finalFlow.completionStatus === "syncing" || finalFlow.completionStatus === "completing") {
    return `
      <p class="feedback" role="status">Sincronizando respuestas…</p>
      <button class="primary-button" type="button" disabled>${finalFlow.completionStatus === "completing" ? "FINALIZANDO…" : "FINALIZAR"}</button>`;
  }
  if (finalFlow.completionStatus === "error") {
    const completionPending = finalFlow.completionError === "complete" || Boolean(pendingCompletionItem());
    return `
      <p class="feedback" role="alert">${completionPending
        ? "No fue posible confirmar el registro todavía. Intenta nuevamente."
        : "No fue posible sincronizar todas las respuestas todavía. Intenta nuevamente."}</p>
      <button class="primary-button" type="button" data-action="${completionPending ? "finalize-session" : "retry-final-sync"}">${completionPending ? "REINTENTAR FINALIZACIÓN" : "REINTENTAR SINCRONIZACIÓN"}</button>`;
  }
  return '<button class="primary-button" type="button" data-action="finalize-session">FINALIZAR</button>';
};

const renderFinalScreen = () => {
  progressBar.style.width = "100%";
  app.innerHTML = finalFlowPanel(55, `
    <h1>¡Terminaste el recorrido de Tadeo!</h1>
    <p class="challenge-intro">Tus respuestas han sido registradas.</p>
    ${finalScreenControls()}
  `, "s5-narrative-panel");
};

const renderSituationFive = () => {
  const stageIndex = situationFiveProgress.stage;
  progressBar.style.width = `${Math.round(((stageIndex + 1) / 12) * 100)}%`;
  const renderers = [
    renderSituationFiveNarrative,
    renderSituationFiveExploration,
    renderSituationFiveRecipeOne,
    renderSituationFiveRecipeTwo,
    renderSituationFiveRelation,
    renderSituationFiveEquation,
    renderSituationFiveSolve,
    renderSituationFiveCheck,
    renderSituationFivePortions,
    renderSituationFiveChoice,
    renderSituationFivePreparation,
    renderSituationFiveAgenda,
  ];
  renderers[stageIndex]();
};

const renderScene = () => {
  const sceneIndex = state.currentScene;
  const stepIndex = state.currentStep;
  if (sceneIndex === 1) {
    renderSituationTwo();
    return;
  }
  if (sceneIndex === 2) {
    renderSituationThree();
    return;
  }
  if (sceneIndex === 3) {
    renderSituationFour();
    return;
  }
  const scene = scenes[sceneIndex];
  const step = scene.steps[stepIndex];
  const questionDots = scene.steps
    .map((_, index) => `<span class="question-dot ${index < stepIndex ? "done" : ""} ${index === stepIndex ? "current" : ""}" aria-hidden="true">${index + 1}</span>`)
    .join("");
  app.innerHTML = `
    <section class="story-screen">
      <div class="scene-visual" style="background-image: url('${scene.background}')">
        <img class="character-sprite" src="${scene.character}" alt="" />
        <div class="scene-caption"><span class="scene-label">${scene.label}</span><h2>${scene.title}</h2><p>${scene.setup}</p></div>
      </div>
      <div class="challenge-panel"><div class="challenge-inner">
        <div class="step-indicator"><span>Situación ${sceneIndex + 1} de ${scenes.length}</span><span class="step-line"></span><span>Pregunta ${stepIndex + 1} de ${scene.steps.length}</span></div>
        <div class="question-progress" aria-label="Progreso de preguntas: ${stepIndex + 1} de ${scene.steps.length}">${questionDots}</div>
        <h3>${step.title}</h3><p class="challenge-intro">${step.intro}</p>
        ${step.equation ? `<div class="equation-card">${step.equation}</div>` : ""}
        <form class="challenge-form" id="challenge-form" novalidate>${step.form}
          <p class="feedback" id="feedback" role="status"></p>
          <div class="form-actions">
            <button class="primary-button" type="submit">Comprobar respuesta</button>
            <button class="primary-button" type="button" data-action="next-question" hidden>Siguiente pregunta <span aria-hidden="true">→</span></button>
            <button class="secondary-button" type="button" data-action="continue" hidden>Continuar <span aria-hidden="true">→</span></button>
          </div>
        </form>
      </div></div>
    </section>`;
};

const discoveryMarkup = (index) => {
  const discovery = discoveries[index];
  return `<aside class="discovery-unlocked"><strong>✦ Descubrimiento desbloqueado: ${discovery.title}</strong><span>${discovery.text}</span></aside>`;
};

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

const renderFinish = () => {
  const metrics = state.metrics || {};
  app.innerHTML = `
    <section class="screen finish-screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="hero-card"><div class="hero-copy">
        <span class="eyebrow">Día completado · Folio ${researchSession.code}</span><h1>¡Todo listo!</h1>
        <p>Tadeo terminó lo que tenía pendiente. Tus resultados quedaron guardados correctamente.</p>
        <div class="student-summary">
          <div><strong>${metrics.questions_completed ?? 21}/21</strong><span>preguntas</span></div>
          <div><strong>${metrics.first_try_accuracy ?? "—"}%</strong><span>al primer intento</span></div>
          <div><strong>${metrics.global_accuracy ?? "—"}%</strong><span>exactitud global</span></div>
          <div><strong>${formatDuration(metrics.active_seconds)}</strong><span>tiempo activo</span></div>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="button" data-action="discoveries">Ver mis descubrimientos</button>
          <button class="secondary-button" type="button" data-action="reset">Jugar de nuevo</button>
        </div>
      </div><div class="hero-character"><img src="./assets/characters/tadeo-celebrando.png" alt="Tadeo celebra que completó su agenda" /></div></div>
    </section>`;
};

const flowPanel = (screen, kicker, title, content, extraClass = "") => `
  <section class="screen situation-one-screen s1-game-stage flow-scaffold-screen ${extraClass}" data-flow-screen="${screen}" style="background-image: url('./assets/scenes/habitacion.png')">
    <img class="s1-stage-character" src="./assets/characters/tadeo-pensando.png" alt="Tadeo" />
    <div class="s1-interface-panel flow-scaffold-panel">
      <div class="s1-panel-heading">
        <span class="s1-panel-kicker">Pantalla ${screen} de ${EXPERIENCE_FLOW.totalScreens}</span>
        <span class="s1-panel-scene">${kicker}</span>
      </div>
      <h1>${title}</h1>
      ${content}
    </div>
  </section>`;

const SITUATION_ONE_CONTEXT = "Tadeo tiene 60 minutos para realizar las dos actividades de su agenda y quiere dedicar el mismo tiempo a cada una.";
const SITUATION_ONE_FIRST_RETRY = "Revisa la información del problema e inténtalo nuevamente.";
const SITUATION_ONE_ATTEMPTS_COMPLETE = "Respuesta registrada. Puedes continuar.";

const flowSituation = (situationId) => EXPERIENCE_FLOW.situations.find(({ id }) => id === situationId);
const flowSituationScreen = (situationId, stageIndex) => flowSituation(situationId).startScreen + stageIndex;

const flowSituationOneData = () => {
  if (!flowProgress.situationData) flowProgress.situationData = {};
  if (!flowProgress.situationData[1]) {
    flowProgress.situationData[1] = { answers: {}, objectiveAttempts: {}, savedOpenStages: [] };
  }
  return flowProgress.situationData[1];
};

const flowSituationOneAttempts = (activityId) => {
  const attempts = flowSituationOneData().objectiveAttempts[activityId];
  return Array.isArray(attempts) ? attempts : [];
};

const flowSituationOneValue = (fieldId) => escapeHtml(flowSituationOneData().answers[fieldId] || "");

const flowSituationOneFeedback = (activityId) => {
  const attempts = flowSituationOneAttempts(activityId);
  if (!attempts.length || attempts.at(-1).correct) return "";
  return attempts.length >= 2 ? SITUATION_ONE_ATTEMPTS_COMPLETE : SITUATION_ONE_FIRST_RETRY;
};

const flowSituationOneProblemInfo = () => `
  <button class="s1-problem-info-button" type="button" data-action="s1-show-problem-info">VER INFORMACIÓN DEL PROBLEMA</button>
  <dialog class="s1-problem-dialog" id="s1-problem-dialog" aria-labelledby="s1-problem-dialog-title">
    <button class="dialog-close" type="button" data-action="s1-close-problem-info" aria-label="Cerrar">×</button>
    <div class="dialog-heading">
      <h2 id="s1-problem-dialog-title">Información del problema</h2>
      <p>${SITUATION_ONE_CONTEXT}</p>
    </div>
    <button class="secondary-button" type="button" data-action="s1-close-problem-info">CERRAR</button>
  </dialog>`;

const flowSituationOneObjectiveActions = (activityId) => {
  const attempts = flowSituationOneAttempts(activityId);
  const exhausted = attempts.length >= 2 && !attempts.some(({ correct }) => correct);
  return `
    <p class="feedback" id="feedback" role="status">${flowSituationOneFeedback(activityId)}</p>
    <div class="form-actions">
      ${exhausted
        ? '<button class="primary-button" type="button" data-action="s1-continue-after-attempts">CONTINUAR</button>'
        : '<button class="primary-button" type="submit">CONTINUAR</button>'}
    </div>`;
};

const flowSituationOneContextScreen = () => {
  const activityId = "s1_contexto";
  return `
    <p class="s1-situation-context">${SITUATION_ONE_CONTEXT}</p>
    <form class="challenge-form s1-flow-form" id="challenge-form" data-flow-situation="1" data-s1-flow-stage="0" novalidate>
      <label class="field-group">
        <span class="field-label">a) ¿Cuánto tiempo tiene Tadeo en total para realizar sus actividades?</span>
        <span class="s1-unit-field"><input class="text-input" inputmode="numeric" name="s1_tiempo_total" value="${flowSituationOneValue("s1_tiempo_total")}" autocomplete="off" required /><span>minutos</span></span>
      </label>
      <label class="field-group">
        <span class="field-label">b) ¿Cuántas actividades tiene pendientes?</span>
        <span class="s1-unit-field"><input class="text-input" inputmode="numeric" name="s1_numero_actividades" value="${flowSituationOneValue("s1_numero_actividades")}" autocomplete="off" required /><span>actividades</span></span>
      </label>
      <label class="field-group">
        <span class="field-label">c) Si quiere dedicar el mismo tiempo a cada actividad, ¿cuántos minutos puede dedicar a cada una?</span>
        <span class="s1-unit-field"><input class="text-input" inputmode="numeric" name="s1_tiempo_por_actividad" value="${flowSituationOneValue("s1_tiempo_por_actividad")}" autocomplete="off" required /><span>minutos</span></span>
      </label>
      ${flowSituationOneObjectiveActions(activityId)}
    </form>`;
};

const flowSituationOneDistributionScreen = () => `
  <p class="challenge-intro">Representa cómo puede distribuir Tadeo los 60 minutos entre sus dos actividades.</p>
  ${flowSituationOneProblemInfo()}
  <form class="challenge-form s1-flow-form" id="challenge-form" data-flow-situation="1" data-s1-flow-stage="1" novalidate>
    <div class="s1-equality-builder" aria-label="Completa la igualdad">
      <input class="text-input" inputmode="numeric" name="s1_igualdad_valor_1" aria-label="Primer valor" value="${flowSituationOneValue("s1_igualdad_valor_1")}" autocomplete="off" required />
      <span aria-hidden="true">+</span>
      <input class="text-input" inputmode="numeric" name="s1_igualdad_valor_2" aria-label="Segundo valor" value="${flowSituationOneValue("s1_igualdad_valor_2")}" autocomplete="off" required />
      <span aria-hidden="true">= 60</span>
    </div>
    ${flowSituationOneObjectiveActions("s1_distribucion")}
  </form>`;

const flowSituationOneMeaningScreen = () => {
  const saved = flowSituationOneData().savedOpenStages.includes(2);
  const readonly = saved ? " readonly" : "";
  return `
    <div class="s1-math-display" aria-label="30 más 30 es igual a 60">30 + 30 = 60</div>
    ${flowSituationOneProblemInfo()}
    <form class="challenge-form s1-flow-form" id="challenge-form" data-flow-situation="1" data-s1-flow-stage="2" novalidate>
      <label class="field-group">
        <span class="field-label">¿Qué representa la cantidad que aparece a la izquierda del signo igual? Explícalo con tus palabras.</span>
        <textarea class="text-input open-response" name="s1_significado_izquierda" required${readonly}>${flowSituationOneValue("s1_significado_izquierda")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué representa la cantidad que aparece a la derecha del signo igual? Explícalo con tus palabras.</span>
        <textarea class="text-input open-response" name="s1_significado_derecha" required${readonly}>${flowSituationOneValue("s1_significado_derecha")}</textarea>
      </label>
      ${saved
        ? '<p class="feedback success" id="feedback" role="status">Respuesta registrada.</p><div class="form-actions"><button class="primary-button" type="button" data-action="s1-open-response-continue">CONTINUAR</button></div>'
        : '<p class="feedback" id="feedback" role="status"></p><div class="form-actions"><button class="primary-button" type="submit">GUARDAR RESPUESTAS</button></div>'}
    </form>`;
};

const flowSituationOneEqualityScreen = () => {
  const selected = flowSituationOneData().answers.s1_misma_cantidad || "";
  return `
    <div class="s1-math-display" aria-label="30 más 30 es igual a 60">30 + 30 = 60</div>
    ${flowSituationOneProblemInfo()}
    <form class="challenge-form s1-flow-form" id="challenge-form" data-flow-situation="1" data-s1-flow-stage="3" novalidate>
      <fieldset class="field-group">
        <legend>¿Ambos lados representan la misma cantidad?</legend>
        <div class="answer-grid two-options">
          <label class="answer-choice"><input type="radio" name="s1_misma_cantidad" value="Sí" ${selected === "Sí" ? "checked" : ""} required /><span>Sí</span></label>
          <label class="answer-choice"><input type="radio" name="s1_misma_cantidad" value="No" ${selected === "No" ? "checked" : ""} required /><span>No</span></label>
        </div>
      </fieldset>
      <label class="field-group">
        <span class="field-label">¿Por qué? Explícalo con tus palabras.</span>
        <textarea class="text-input open-response" name="s1_justificacion" required>${flowSituationOneValue("s1_justificacion")}</textarea>
      </label>
      ${flowSituationOneObjectiveActions("s1_misma_cantidad")}
    </form>`;
};

const flowSituationOneDiscoveryScreen = () => `
  <article class="s1-flow-discovery">
    <span class="s1-discovery-label">Mi descubrimiento</span>
    <p>El signo = indica que las expresiones que se encuentran a ambos lados representan la misma cantidad.</p>
    <p>Por ejemplo:</p>
    <div class="s1-math-display" aria-label="30 más 30 es igual a 60">30 + 30 = 60</div>
    <p>Aunque están escritas de manera diferente, ambas partes representan el mismo valor.</p>
  </article>
  <div class="form-actions"><button class="primary-button" type="button" data-action="s1-discovery-continue">CONTINUAR</button></div>`;

const flowSituationOneAgendaScreen = () => {
  const items = agendaItems.map((item) => `<li><span class="s1-pending-box" aria-hidden="true">□</span><span>${item}</span></li>`).join("");
  return `
    <p class="s1-dialogue-line">Ya organicé mi tiempo. Comenzaré por la papelería.</p>
    <div class="two-activity-agenda s1-pending-agenda" aria-label="Agenda de Tadeo con dos actividades pendientes">
      <div class="two-activity-agenda-heading"><span aria-hidden="true">★</span><strong>Plan de la tarde</strong><span aria-hidden="true">★</span></div>
      <ul class="two-activity-agenda-list">${items}</ul>
    </div>
    <div class="form-actions"><button class="primary-button" type="button" data-action="s1-go-papeleria">IR A LA PAPELERÍA</button></div>`;
};

const renderFlowSituationOne = (situation) => {
  const stageIndex = Math.min(situation.screenCount - 1, Math.max(0, flowProgress.currentScreen - situation.startScreen));
  const screens = [
    flowSituationOneContextScreen,
    flowSituationOneDistributionScreen,
    flowSituationOneMeaningScreen,
    flowSituationOneEqualityScreen,
    flowSituationOneDiscoveryScreen,
    flowSituationOneAgendaScreen,
  ];
  const screen = flowSituationScreen(1, stageIndex);
  progressBar.style.width = `${Math.round(((screen - 1) / (EXPERIENCE_FLOW.totalScreens - 1)) * 100)}%`;
  app.innerHTML = flowPanel(
    screen,
    `Situación 1 de ${EXPERIENCE_FLOW.situations.length}`,
    "Organizando el tiempo",
    screens[stageIndex](),
  );
};

const SITUATION_TWO_CONTEXT = `Tadeo necesita comprar 5 cuadernos iguales y un paquete de colores.<br><br>El paquete de colores cuesta $50 y por toda la compra deberá pagar $250.<br><br>Tadeo necesita averiguar cuánto cuesta cada cuaderno.`;
const SITUATION_TWO_SYMBOLS = Object.freeze(["x", "a", "?", "△", "□", "○", "★", "◆"]);
const SITUATION_TWO_NOTEBOOKS = Object.freeze([
  Object.freeze({ value: "Cuaderno A — $35", label: "Cuaderno A", price: "$35", image: "./assets/objects/cuaderno-a.png", style: "basic" }),
  Object.freeze({ value: "Cuaderno B — $40", label: "Cuaderno B", price: "$40", image: "./assets/objects/cuaderno-b.png", style: "standard" }),
  Object.freeze({ value: "Cuaderno C — $65", label: "Cuaderno C", price: "$65", image: "./assets/objects/cuaderno-c.png", style: "premium" }),
]);

const flowSituationTwoData = () => {
  if (!flowProgress.situationData) flowProgress.situationData = {};
  if (!flowProgress.situationData[2]) {
    flowProgress.situationData[2] = {
      answers: {},
      objectiveAttempts: {},
      savedOpenStages: [],
      notebooksAssigned: false,
      colorsAdded: false,
      strategySaved: false,
      activityCompleted: false,
    };
  }
  return flowProgress.situationData[2];
};

const flowSituationTwoAttempts = (activityId) => {
  const attempts = flowSituationTwoData().objectiveAttempts[activityId];
  return Array.isArray(attempts) ? attempts : [];
};

const flowSituationTwoValue = (fieldId) => escapeHtml(flowSituationTwoData().answers[fieldId] || "");
const flowSituationTwoSymbol = () => flowSituationTwoData().answers.s2_simbolo_elegido || "";
const flowSituationTwoRepeatedSymbol = () => Array(5).fill(escapeHtml(flowSituationTwoSymbol())).join(" + ");

const flowSituationTwoPanel = (screen, content, extraClass = "") => `
  <section class="screen s1-game-stage s2-flow-stage ${extraClass}" data-flow-screen="${screen}" style="background-image: url('./assets/scenes/papeleria.png')">
    <div class="s2-flow-characters" aria-hidden="true">
      <img class="s2-flow-tadeo" src="./assets/characters/tadeo-pensando.png" alt="" />
      <img class="s2-flow-clerk" src="./assets/characters/encargado-papeleria.png" alt="" />
    </div>
    <div class="s1-interface-panel s2-flow-panel">
      <div class="s1-panel-heading">
        <span class="s1-panel-kicker">Pantalla ${screen} de ${EXPERIENCE_FLOW.totalScreens}</span>
        <span class="s1-panel-scene">Situación 2 de ${EXPERIENCE_FLOW.situations.length}</span>
      </div>
      <h1>En la papelería</h1>
      ${content}
    </div>
  </section>`;

const flowSituationTwoFeedback = (activityId) => {
  const attempts = flowSituationTwoAttempts(activityId);
  if (!attempts.length || attempts.at(-1).correct) return "";
  if (attempts.length >= 2) return SITUATION_ONE_ATTEMPTS_COMPLETE;
  return {
    s2_signo_relacion: "Revisa la relación entre el costo de los productos y el total de la compra.",
    s2_valor_x: "Revisa la información de la compra y tu estrategia. Puedes intentarlo nuevamente.",
  }[activityId] || "";
};

const flowSituationTwoObjectiveActions = (activityId) => {
  const attempts = flowSituationTwoAttempts(activityId);
  const exhausted = attempts.length >= 2 && !attempts.some(({ correct }) => correct);
  return `
    <p class="feedback" id="feedback" role="status">${flowSituationTwoFeedback(activityId)}</p>
    <div class="form-actions">
      ${exhausted
        ? '<button class="primary-button" type="button" data-action="s2-flow-continue-after-attempts">CONTINUAR</button>'
        : '<button class="primary-button" type="submit">CONTINUAR</button>'}
    </div>`;
};

const flowSituationTwoProblemInfo = () => `
  <button class="s1-problem-info-button" type="button" data-action="s2-show-problem-info">VER INFORMACIÓN DEL PROBLEMA</button>
  <dialog class="s1-problem-dialog" id="s2-problem-dialog" aria-labelledby="s2-problem-dialog-title">
    <button class="dialog-close" type="button" data-action="s2-close-problem-info" aria-label="Cerrar">×</button>
    <div class="dialog-heading">
      <h2 id="s2-problem-dialog-title">Información del problema</h2>
      <ul class="s2-problem-facts">
        <li>5 cuadernos iguales</li>
        <li>Colores: $50</li>
        <li>Total: $250</li>
      </ul>
    </div>
    <button class="secondary-button" type="button" data-action="s2-close-problem-info">CERRAR</button>
  </dialog>`;

const flowSituationTwoOpenActions = (stageIndex) => {
  const saved = flowSituationTwoData().savedOpenStages.includes(stageIndex);
  return saved
    ? '<p class="feedback success" id="feedback" role="status">Respuesta registrada.</p><div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-open-continue">CONTINUAR</button></div>'
    : '<p class="feedback" id="feedback" role="status"></p><div class="form-actions"><button class="primary-button" type="submit">GUARDAR RESPUESTAS</button></div>';
};

const flowSituationTwoContextScreen = () => {
  const saved = flowSituationTwoData().savedOpenStages.includes(0);
  const readonly = saved ? " readonly" : "";
  return `
    <p class="s2-flow-context">${SITUATION_TWO_CONTEXT}</p>
    <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="0" novalidate>
      <label class="field-group">
        <span class="field-label">¿Qué información conoces de la compra de Tadeo?</span>
        <textarea class="text-input open-response" name="s2_informacion_conocida" required${readonly}>${flowSituationTwoValue("s2_informacion_conocida")}</textarea>
      </label>
      <label class="field-group">
        <span class="field-label">¿Qué necesita averiguar Tadeo?</span>
        <textarea class="text-input open-response" name="s2_que_averiguar" required${readonly}>${flowSituationTwoValue("s2_que_averiguar")}</textarea>
      </label>
      ${flowSituationTwoOpenActions(0)}
    </form>`;
};

const flowSituationTwoSymbolScreen = () => {
  const progress = flowSituationTwoData();
  const selected = flowSituationTwoSymbol();
  const saved = progress.savedOpenStages.includes(1);
  const symbolButtons = SITUATION_TWO_SYMBOLS.map((symbol) => `
    <button class="s2-flow-symbol${selected === symbol ? " selected" : ""}" type="button" role="radio" aria-checked="${selected === symbol}" data-action="s2-flow-select-symbol" data-symbol="${escapeHtml(symbol)}" ${saved ? "disabled" : ""}>${escapeHtml(symbol)}</button>`).join("");
  return `
    <p class="challenge-intro">El precio de cada cuaderno es una cantidad que todavía no conocemos.<br><br>Elige un símbolo para representarla.</p>
    <div class="s2-flow-symbols" role="radiogroup" aria-label="Símbolo para representar la cantidad">${symbolButtons}</div>
    ${selected ? `
      <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="1" novalidate>
        <input type="hidden" name="s2_simbolo_elegido" value="${escapeHtml(selected)}" />
        <label class="field-group">
          <span class="field-label">¿Qué representa el símbolo que elegiste? Explícalo con tus palabras.</span>
          <textarea class="text-input open-response" name="s2_significado_simbolo" required${saved ? " readonly" : ""}>${flowSituationTwoValue("s2_significado_simbolo")}</textarea>
        </label>
        ${flowSituationTwoOpenActions(1)}
      </form>` : ""}`;
};

const flowSituationTwoNotebookVisuals = (showSymbol = false) => Array.from({ length: 5 }, (_, index) => `
  <figure class="s2-flow-notebook">
    <img src="./assets/objects/cuaderno-b.png" alt="Cuaderno ${index + 1}" />
    ${showSymbol ? `<figcaption>${escapeHtml(flowSituationTwoSymbol())}</figcaption>` : ""}
  </figure>`).join("");

const flowSituationTwoFiveNotebooksScreen = () => {
  const assigned = flowSituationTwoData().notebooksAssigned;
  return `
    <p class="challenge-intro">Asigna el símbolo que elegiste a cada cuaderno para representar su precio.</p>
    <div class="s2-five-notebooks" aria-label="Cinco cuadernos iguales">${flowSituationTwoNotebookVisuals(assigned)}</div>
    ${assigned
      ? `<div class="s2-flow-expression" aria-label="Representación de cinco cantidades iguales">${flowSituationTwoRepeatedSymbol()}</div><div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-notebooks-continue">CONTINUAR</button></div>`
      : '<div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-assign-notebooks">ASIGNAR SÍMBOLO A LOS 5 CUADERNOS</button></div>'}`;
};

const flowSituationTwoCompletePurchaseScreen = () => {
  const progress = flowSituationTwoData();
  const selected = progress.answers.s2_signo_relacion || "";
  const relationOptions = ["=", "<", ">"].map((symbol) => `
    <label class="answer-choice s2-relation-choice"><input type="radio" name="s2_signo_relacion" value="${escapeHtml(symbol)}" ${selected === symbol ? "checked" : ""} required /><span>${escapeHtml(symbol)}</span></label>`).join("");
  return `
    <p class="challenge-intro">Agrega el paquete de colores a la compra de Tadeo.</p>
    <div class="s2-purchase-builder">
      <div class="s2-five-notebooks compact" aria-label="Cinco cuadernos con el símbolo elegido">${flowSituationTwoNotebookVisuals(true)}</div>
      <div class="s2-color-package${progress.colorsAdded ? " added" : ""}">
        <img src="./assets/objects/colores.png" alt="Paquete de colores" /><strong>$50</strong>
      </div>
    </div>
    ${progress.colorsAdded ? `
      <div class="s2-flow-expression">${flowSituationTwoRepeatedSymbol()} + 50</div>
      <p class="challenge-intro">La compra completa cuesta $250.<br><br>Selecciona el signo que relaciona el costo de los productos con el total de la compra.</p>
      <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="3" novalidate>
        <div class="answer-grid s2-relation-grid">${relationOptions}</div>
        ${selected ? `<div class="s2-flow-expression">${flowSituationTwoRepeatedSymbol()} + 50 ${escapeHtml(selected)} 250</div>` : ""}
        ${flowSituationTwoObjectiveActions("s2_signo_relacion")}
      </form>`
      : '<div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-add-colors">AGREGAR PAQUETE DE COLORES</button></div>'}`;
};

const flowSituationTwoBriefRepresentationScreen = () => {
  const saved = flowSituationTwoData().savedOpenStages.includes(4);
  return `
    <div class="s2-flow-expression">${flowSituationTwoRepeatedSymbol()} + 50 = 250</div>
    <p class="challenge-intro">Observa que el mismo símbolo aparece cinco veces.<br><br>¿Cómo podrías representar de manera más breve cinco veces la misma cantidad?</p>
    <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="4" novalidate>
      <textarea class="text-input s2-math-response" name="s2_representacion_breve" aria-label="¿Cómo podrías representar de manera más breve cinco veces la misma cantidad?" required${saved ? " readonly" : ""}>${flowSituationTwoValue("s2_representacion_breve")}</textarea>
      ${flowSituationTwoOpenActions(4)}
    </form>`;
};

const flowSituationTwoDiscoveryScreen = () => `
  <article class="s1-flow-discovery s2-flow-discovery">
    <span class="s1-discovery-label">Mi descubrimiento</span>
    <p>Una cantidad que todavía no conocemos puede representarse mediante un símbolo o una letra.</p>
    <p>En matemáticas es común utilizar letras como x para representar cantidades desconocidas.</p>
    <p>Cinco veces una misma cantidad puede escribirse como 5x.</p>
    <p>Una ecuación es una igualdad en la que aparece una cantidad desconocida.</p>
    <p>En esta situación:</p>
    <div class="s1-math-display" aria-label="Cinco x más cincuenta es igual a doscientos cincuenta">5x + 50 = 250</div>
    <p>x representa el precio de cada cuaderno.</p>
  </article>
  <div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-discovery-continue">CONTINUAR</button></div>`;

const flowSituationTwoSolveScreen = () => {
  const progress = flowSituationTwoData();
  return `
    <div class="s1-math-display" aria-label="Cinco x más cincuenta es igual a doscientos cincuenta">5x + 50 = 250</div>
    ${flowSituationTwoProblemInfo()}
    ${progress.strategySaved ? `
      <label class="field-group s2-saved-strategy">
        <span class="field-label">¿Cómo podrías encontrar el valor de x? Puedes utilizar la estrategia que consideres conveniente.</span>
        <textarea class="text-input open-response" readonly>${flowSituationTwoValue("s2_estrategia_resolucion")}</textarea>
      </label>
      <p class="feedback success" role="status">Respuesta registrada.</p>
      <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="6" data-s2-flow-form="value" novalidate>
        <label class="field-group">
          <span class="field-label">¿Qué valor encontraste para x?</span>
          <span class="s2-money-field"><span>$</span><input class="text-input" type="number" inputmode="numeric" name="s2_valor_x" value="${flowSituationTwoValue("s2_valor_x")}" autocomplete="off" required /></span>
        </label>
        ${flowSituationTwoObjectiveActions("s2_valor_x")}
      </form>` : `
      <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="6" data-s2-flow-form="strategy" novalidate>
        <label class="field-group">
          <span class="field-label">¿Cómo podrías encontrar el valor de x? Puedes utilizar la estrategia que consideres conveniente.</span>
          <textarea class="text-input open-response s2-strategy-response" name="s2_estrategia_resolucion" required>${flowSituationTwoValue("s2_estrategia_resolucion")}</textarea>
        </label>
        <div class="form-actions"><button class="primary-button" type="submit">GUARDAR RESPUESTA</button></div>
      </form>`}`;
};

const flowSituationTwoChooseNotebookScreen = () => {
  const selected = flowSituationTwoData().answers.s2_cuaderno_elegido || "";
  const choices = SITUATION_TWO_NOTEBOOKS.map((notebook) => `
    <label class="s2-notebook-choice ${notebook.style}">
      <input type="radio" name="s2_cuaderno_elegido" value="${notebook.value}" ${selected === notebook.value ? "checked" : ""} required />
      <span><img src="${notebook.image}" alt="" /><strong>${notebook.label}</strong><small>${notebook.price}</small></span>
    </label>`).join("");
  return `
    <p class="challenge-intro">De acuerdo con el valor que encontraste, ¿qué cuaderno puede comprar Tadeo para que el total de la compra sea $250?</p>
    <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="7" novalidate>
      <div class="s2-notebook-options" role="radiogroup" aria-label="Opciones de cuaderno">${choices}</div>
      ${flowSituationTwoObjectiveActions("s2_cuaderno_elegido")}
    </form>`;
};

const flowSituationTwoCheckScreen = () => {
  const progress = flowSituationTwoData();
  const selected = progress.answers.s2_comprobacion_igualdad || "";
  return `
    <p class="challenge-intro">Comprueba tu elección sustituyendo el precio del cuaderno.</p>
    <div class="s2-check-sequence" aria-label="Comprobación de la compra">
      <span>5(40) + 50 = 250</span>
      <span>200 + 50 = 250</span>
      <strong>250 = 250</strong>
    </div>
    ${progress.activityCompleted ? `
      <div class="s2-completion-reward" role="status"><img src="./assets/characters/tadeo-celebrando.png" alt="Tadeo celebra" /><strong>¡Compra completada!</strong></div>
      <div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-reward-continue">CONTINUAR</button></div>` : `
      <form class="challenge-form s2-flow-form" id="challenge-form" data-flow-situation="2" data-s2-flow-stage="8" novalidate>
        <fieldset class="field-group"><legend>¿Ambos lados representan la misma cantidad?</legend>
          <div class="answer-grid two-options">
            <label class="answer-choice"><input type="radio" name="s2_comprobacion_igualdad" value="Sí" ${selected === "Sí" ? "checked" : ""} required /><span>Sí</span></label>
            <label class="answer-choice"><input type="radio" name="s2_comprobacion_igualdad" value="No" ${selected === "No" ? "checked" : ""} required /><span>No</span></label>
          </div>
        </fieldset>
        ${flowSituationTwoObjectiveActions("s2_comprobacion_igualdad")}
      </form>`}`;
};

const flowSituationTwoAgendaScreen = () => `
  <p class="s1-dialogue-line">Ya tengo los cuadernos y los colores. Ahora iré por el regalo de Eloísa.</p>
  <div class="two-activity-agenda s2-updated-agenda" aria-label="Agenda con Papelería completada y Regalo pendiente">
    <div class="two-activity-agenda-heading"><span aria-hidden="true">★</span><strong>Plan de la tarde</strong><span aria-hidden="true">★</span></div>
    <ul class="two-activity-agenda-list">
      <li class="done"><span class="s2-agenda-check" aria-hidden="true">☑</span><span>Ir a la papelería a comprar 5 cuadernos y un paquete de colores.</span></li>
      <li><span class="s2-agenda-check" aria-hidden="true">☐</span><span>Comprar un regalo para Eloísa.</span></li>
    </ul>
  </div>
  <div class="form-actions"><button class="primary-button" type="button" data-action="s2-flow-go-store">IR A LA TIENDA</button></div>`;

const renderFlowSituationTwo = (situation) => {
  const stageIndex = Math.min(situation.screenCount - 1, Math.max(0, flowProgress.currentScreen - situation.startScreen));
  const screens = [
    flowSituationTwoContextScreen,
    flowSituationTwoSymbolScreen,
    flowSituationTwoFiveNotebooksScreen,
    flowSituationTwoCompletePurchaseScreen,
    flowSituationTwoBriefRepresentationScreen,
    flowSituationTwoDiscoveryScreen,
    flowSituationTwoSolveScreen,
    flowSituationTwoChooseNotebookScreen,
    flowSituationTwoCheckScreen,
    flowSituationTwoAgendaScreen,
  ];
  const screen = flowSituationScreen(2, stageIndex);
  progressBar.style.width = `${Math.round(((screen - 1) / (EXPERIENCE_FLOW.totalScreens - 1)) * 100)}%`;
  app.innerHTML = flowSituationTwoPanel(screen, screens[stageIndex](), `s2-flow-screen-${stageIndex}`);
};

const SITUATION_THREE_GIFTS = Object.freeze([
  Object.freeze({ value: "regalo-peluche", image: "./assets/objects/regalo-peluche.png", accessibleLabel: "Opción de regalo 1" }),
  Object.freeze({ value: "regalo-caja", image: "./assets/objects/regalo-caja.png", accessibleLabel: "Opción de regalo 2" }),
  Object.freeze({ value: "regalo-lampara", image: "./assets/objects/regalo-lampara.png", accessibleLabel: "Opción de regalo 3" }),
]);

const flowSituationThreeData = () => {
  if (!flowProgress.situationData) flowProgress.situationData = {};
  if (!flowProgress.situationData[3]) {
    flowProgress.situationData[3] = {
      answers: {},
      objectiveAttempts: {},
      savedOpenStages: [],
      giftPurchased: false,
      quantitiesBuilt: false,
      expenseAdded: false,
      equationCompleted: false,
      strategySaved: false,
      registerCompleted: false,
    };
  }
  return flowProgress.situationData[3];
};

const flowSituationThreeAttempts = (activityId) => {
  const attempts = flowSituationThreeData().objectiveAttempts[activityId];
  return Array.isArray(attempts) ? attempts : [];
};

const flowSituationThreeValue = (fieldId) => escapeHtml(flowSituationThreeData().answers[fieldId] || "");

const flowSituationThreeFeedback = (activityId) => {
  const attempts = flowSituationThreeAttempts(activityId);
  if (!attempts.length || attempts.at(-1).correct) return "";
  if (attempts.length >= 2) return SITUATION_ONE_ATTEMPTS_COMPLETE;
  return {
    s3_valor_lado_derecho: "Revisa cuánto dinero le quedó a Tadeo después de comprar el regalo.",
    s3_valor_x: "Revisa la información del problema y tu estrategia. Puedes intentarlo nuevamente.",
  }[activityId] || "";
};

const flowSituationThreeObjectiveActions = (activityId) => {
  const attempts = flowSituationThreeAttempts(activityId);
  const exhausted = attempts.length >= 2 && !attempts.some(({ correct }) => correct);
  return `
    <p class="feedback" id="feedback" role="status">${flowSituationThreeFeedback(activityId)}</p>
    <div class="form-actions">
      ${exhausted
        ? '<button class="primary-button" type="button" data-action="s3-flow-continue-after-attempts">CONTINUAR</button>'
        : '<button class="primary-button" type="submit">CONTINUAR</button>'}
    </div>`;
};

const flowSituationThreeOpenActions = (stageIndex) => {
  const saved = flowSituationThreeData().savedOpenStages.includes(stageIndex);
  return saved
    ? '<p class="feedback success" id="feedback" role="status">Respuesta registrada.</p><div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-open-continue">CONTINUAR</button></div>'
    : '<p class="feedback" id="feedback" role="status"></p><div class="form-actions"><button class="primary-button" type="submit">GUARDAR RESPUESTAS</button></div>';
};

const flowSituationThreeSelectedGift = () => SITUATION_THREE_GIFTS.find(
  ({ value }) => value === flowSituationThreeData().answers.s3_regalo_elegido,
) || SITUATION_THREE_GIFTS[0];

const flowSituationThreePanel = (screen, content, extraClass = "") => {
  const atStore = screen === flowSituation(3).startScreen;
  const background = atStore ? "./assets/scenes/regalos.png" : "./assets/scenes/habitacion.png";
  return `
    <section class="screen s1-game-stage s3-flow-stage ${extraClass}" data-flow-screen="${screen}" style="background-image: url('${background}')">
      <div class="s3-flow-characters" aria-hidden="true">
        <img class="s3-flow-tadeo" src="./assets/characters/${flowSituationThreeData().registerCompleted || screen === flowSituation(3).endScreen ? "tadeo-celebrando.png" : "tadeo-pensando.png"}" alt="" />
        ${atStore ? '<img class="s3-flow-clerk" src="./assets/characters/encargada-regalos.png" alt="" />' : ""}
      </div>
      <div class="s1-interface-panel s3-flow-panel">
        <div class="s1-panel-heading">
          <span class="s1-panel-kicker">Pantalla ${screen} de ${EXPERIENCE_FLOW.totalScreens}</span>
          <span class="s1-panel-scene">Situación 3 de ${EXPERIENCE_FLOW.situations.length}</span>
        </div>
        <h1>Registrando su dinero</h1>
        ${content}
      </div>
    </section>`;
};

const flowSituationThreeGiftScreen = () => {
  const progress = flowSituationThreeData();
  const selected = progress.answers.s3_regalo_elegido || "";
  const gifts = SITUATION_THREE_GIFTS.map((gift) => `
    <button class="s3-gift-option${selected === gift.value ? " selected" : ""}" type="button" role="radio" aria-checked="${selected === gift.value}" aria-label="${gift.accessibleLabel}, $180" data-action="s3-flow-buy-gift" data-gift="${gift.value}" ${progress.giftPurchased ? "disabled" : ""}>
      <img src="${gift.image}" alt="" /><strong>$180</strong>
    </button>`).join("");
  return `
    <p class="challenge-intro">Elige el regalo que quieres que Tadeo compre para Eloísa.</p>
    <div class="s3-gift-options" role="radiogroup" aria-label="Tres regalos de $180">${gifts}</div>
    ${progress.giftPurchased ? `
      <div class="s3-gift-reward" role="status"><img src="./assets/characters/tadeo-celebrando.png" alt="" /><strong>¡Regalo comprado!</strong></div>
      <div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-gift-continue">CONTINUAR</button></div>` : ""}`;
};

const flowSituationThreeRegisterContextScreen = () => {
  const saved = flowSituationThreeData().savedOpenStages.includes(1);
  const missingAmounts = Array.from({ length: 4 }, (_, index) => `
    <span class="s3-register-row" aria-label="Cantidad ${index + 1} sin registrar">
      <span class="s3-register-cell">?</span>
    </span>`).join("");
  return `
    <div class="s3-register-context">
      <img src="./assets/objects/registro-ahorros.png" alt="Registro de dinero de Tadeo" />
      <div class="s3-register-slots" aria-label="Cuatro cantidades sin registrar">${missingAmounts}</div>
    </div>
    <p class="s3-flow-context">Antes de salir, Tadeo había recibido dinero en cuatro ocasiones.<br><br>Las cuatro cantidades que recibió eran iguales, pero olvidó anotarlas en su registro.<br><br>Después de gastar $180 en el regalo, le quedaron $300.</p>
    <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="1" novalidate>
      <label class="field-group"><span class="field-label">¿Qué información falta completar en el registro?</span><textarea class="text-input open-response" name="s3_informacion_faltante" required${saved ? " readonly" : ""}>${flowSituationThreeValue("s3_informacion_faltante")}</textarea></label>
      <label class="field-group"><span class="field-label">¿Qué necesita averiguar Tadeo?</span><textarea class="text-input open-response" name="s3_que_averiguar" required${saved ? " readonly" : ""}>${flowSituationThreeValue("s3_que_averiguar")}</textarea></label>
      ${flowSituationThreeOpenActions(1)}
    </form>`;
};

const flowSituationThreeFourAmountsScreen = () => {
  const built = flowSituationThreeData().quantitiesBuilt;
  const tokens = Array.from({ length: 4 }, () => `<span class="s3-x-token${built ? " placed" : ""}">${built ? "x" : ""}</span>`).join("");
  return `
    <p class="challenge-intro">En la papelería utilizamos x para representar una cantidad que todavía no conocíamos.<br><br>Ahora x representará la cantidad de dinero que Tadeo recibió cada vez.</p>
    <p class="field-label">Representa las cuatro cantidades iguales que recibió Tadeo.</p>
    <div class="s3-four-amounts" aria-label="Cuatro cantidades iguales">${tokens}</div>
    ${built ? `
      <div class="s3-expression-steps"><span>x + x + x + x</span><span aria-hidden="true">→</span><strong>4x</strong></div>
      <div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-amounts-continue">CONTINUAR</button></div>`
      : '<div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-build-amounts">COLOCAR LAS CUATRO x</button></div>'}`;
};

const flowSituationThreeExpenseScreen = () => {
  const progress = flowSituationThreeData();
  const gift = flowSituationThreeSelectedGift();
  const saved = progress.savedOpenStages.includes(3);
  return `
    <p class="challenge-intro">Agrega al registro el dinero que Tadeo gastó en el regalo.</p>
    <div class="s3-expense-builder">
      <strong>4x</strong><span class="s3-expense-minus">−</span>
      <figure class="s3-expense-gift${progress.expenseAdded ? " added" : ""}"><img src="${gift.image}" alt="Regalo elegido" /><figcaption>$180</figcaption></figure>
    </div>
    ${progress.expenseAdded ? `
      <div class="s1-math-display" aria-label="Cuatro x menos ciento ochenta">4x − 180</div>
      <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="3" novalidate>
        <label class="field-group"><span class="field-label">¿Qué representa 4x - 180 en esta situación? Explícalo con tus palabras.</span><textarea class="text-input open-response" name="s3_significado_4x_menos_180" required${saved ? " readonly" : ""}>${flowSituationThreeValue("s3_significado_4x_menos_180")}</textarea></label>
        ${flowSituationThreeOpenActions(3)}
      </form>`
      : '<div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-add-expense">AGREGAR $180</button></div>'}`;
};

const flowSituationThreeEquationScreen = () => {
  const progress = flowSituationThreeData();
  const interpretationSaved = progress.savedOpenStages.includes(4);
  if (!progress.equationCompleted) {
    return `
      <p class="challenge-intro">Después de comprar el regalo, Tadeo tiene $300.</p>
      <p class="field-label">Completa la igualdad para representar lo que ocurrió con el dinero de Tadeo.</p>
      <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="4" data-s3-flow-form="right-side" novalidate>
        <div class="s3-equation-input"><span>4x − 180 =</span><span class="s3-money-field"><span>$</span><input class="text-input" type="number" inputmode="numeric" name="s3_valor_lado_derecho" value="${flowSituationThreeValue("s3_valor_lado_derecho")}" autocomplete="off" required /></span></div>
        ${flowSituationThreeObjectiveActions("s3_valor_lado_derecho")}
      </form>`;
  }
  return `
    <p class="challenge-intro">Después de comprar el regalo, Tadeo tiene $300.</p>
    <div class="s1-math-display" aria-label="Cuatro x menos ciento ochenta es igual a trescientos">4x − 180 = 300</div>
    <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="4" data-s3-flow-form="interpretation" novalidate>
      <label class="field-group"><span class="field-label">¿Cómo se relaciona esta igualdad con lo que ocurrió con el dinero de Tadeo? Explícalo con tus palabras.</span><textarea class="text-input open-response" name="s3_interpretacion_ecuacion" required${interpretationSaved ? " readonly" : ""}>${flowSituationThreeValue("s3_interpretacion_ecuacion")}</textarea></label>
      ${flowSituationThreeOpenActions(4)}
    </form>`;
};

const flowSituationThreeProblemInfo = () => `
  <button class="s1-problem-info-button" type="button" data-action="s3-show-problem-info">VER INFORMACIÓN DEL PROBLEMA</button>
  <dialog class="s1-problem-dialog" id="s3-problem-dialog" aria-labelledby="s3-problem-dialog-title">
    <button class="dialog-close" type="button" data-action="s3-close-problem-info" aria-label="Cerrar">×</button>
    <div class="dialog-heading"><h2 id="s3-problem-dialog-title">Información del problema</h2><ul class="s2-problem-facts"><li>Cuatro cantidades iguales</li><li>Gasto: $180</li><li>Dinero restante: $300</li></ul></div>
    <button class="secondary-button" type="button" data-action="s3-close-problem-info">CERRAR</button>
  </dialog>`;

const flowSituationThreeSolveScreen = () => {
  const progress = flowSituationThreeData();
  return `
    <div class="s1-math-display" aria-label="Cuatro x menos ciento ochenta es igual a trescientos">4x − 180 = 300</div>
    <p class="challenge-intro">Tadeo necesita saber cuánto dinero recibió cada vez.</p>
    ${flowSituationThreeProblemInfo()}
    ${progress.strategySaved ? `
      <label class="field-group s3-saved-strategy"><span class="field-label">¿Cómo podrías encontrar el valor de x? Puedes utilizar la estrategia que consideres conveniente.</span><textarea class="text-input open-response" readonly>${flowSituationThreeValue("s3_estrategia_resolucion")}</textarea></label>
      <p class="feedback success" role="status">Respuesta registrada.</p>
      <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="5" data-s3-flow-form="value" novalidate>
        <label class="field-group"><span class="field-label">¿Qué valor encontraste para x?</span><span class="s3-money-field"><span>$</span><input class="text-input" type="number" inputmode="numeric" name="s3_valor_x" value="${flowSituationThreeValue("s3_valor_x")}" autocomplete="off" required /></span></label>
        ${flowSituationThreeObjectiveActions("s3_valor_x")}
      </form>` : `
      <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="5" data-s3-flow-form="strategy" novalidate>
        <label class="field-group"><span class="field-label">¿Cómo podrías encontrar el valor de x? Puedes utilizar la estrategia que consideres conveniente.</span><textarea class="text-input open-response s3-strategy-response" name="s3_estrategia_resolucion" required>${flowSituationThreeValue("s3_estrategia_resolucion")}</textarea></label>
        <div class="form-actions"><button class="primary-button" type="submit">GUARDAR RESPUESTA</button></div>
      </form>`}`;
};

const flowSituationThreeCheckScreen = () => {
  const selected = flowSituationThreeData().answers.s3_comprobacion_igualdad || "";
  return `
    <p class="challenge-intro">Comprueba tu resultado sustituyendo el valor encontrado.</p>
    <div class="s3-check-sequence" aria-label="Comprobación del dinero recibido"><span>4(120) − 180 = 300</span><span>480 − 180 = 300</span><strong>300 = 300</strong></div>
    <form class="challenge-form s3-flow-form" id="challenge-form" data-flow-situation="3" data-s3-flow-stage="6" novalidate>
      <fieldset class="field-group"><legend>¿Ambos lados representan la misma cantidad?</legend><div class="answer-grid two-options">
        <label class="answer-choice"><input type="radio" name="s3_comprobacion_igualdad" value="Sí" ${selected === "Sí" ? "checked" : ""} required /><span>Sí</span></label>
        <label class="answer-choice"><input type="radio" name="s3_comprobacion_igualdad" value="No" ${selected === "No" ? "checked" : ""} required /><span>No</span></label>
      </div></fieldset>
      ${flowSituationThreeObjectiveActions("s3_comprobacion_igualdad")}
    </form>`;
};

const flowSituationThreeCompleteRegisterScreen = () => {
  const completed = flowSituationThreeData().registerCompleted;
  const slots = Array.from({ length: 4 }, (_, index) => `
    <span class="s3-register-row" aria-label="Cantidad ${index + 1}">
      <span class="s3-register-cell s3-register-entry${completed ? " completed" : ""}">${completed ? "$120" : ""}</span>
    </span>`).join("");
  return `
    <p class="challenge-intro">Completa las cantidades que faltaban en el registro de Tadeo.</p>
    <div class="s3-register-completion"><img src="./assets/objects/registro-ahorros.png" alt="Registro de dinero de Tadeo" /><div class="s3-register-entry-grid">${slots}</div></div>
    ${completed ? `
      <div class="s3-register-reward" role="status"><img src="./assets/characters/tadeo-celebrando.png" alt="" /><strong>¡Registro completado!</strong></div>
      <div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-register-continue">CONTINUAR</button></div>`
      : '<div class="form-actions"><button class="primary-button" type="button" data-action="s3-flow-complete-register">REGISTRAR $120 EN LAS CUATRO POSICIONES</button></div>'}`;
};

const renderFlowSituationThree = (situation) => {
  const stageIndex = Math.min(situation.screenCount - 1, Math.max(0, flowProgress.currentScreen - situation.startScreen));
  const screens = [
    flowSituationThreeGiftScreen,
    flowSituationThreeRegisterContextScreen,
    flowSituationThreeFourAmountsScreen,
    flowSituationThreeExpenseScreen,
    flowSituationThreeEquationScreen,
    flowSituationThreeSolveScreen,
    flowSituationThreeCheckScreen,
    flowSituationThreeCompleteRegisterScreen,
  ];
  const screen = flowSituationScreen(3, stageIndex);
  progressBar.style.width = `${Math.round(((screen - 1) / (EXPERIENCE_FLOW.totalScreens - 1)) * 100)}%`;
  app.innerHTML = flowSituationThreePanel(screen, screens[stageIndex](), `s3-flow-screen-${stageIndex}`);
};

const renderFlowSituation = (situation) => {
  if (situation.id === 1) {
    renderFlowSituationOne(situation);
    return;
  }
  if (situation.id === 2) {
    renderFlowSituationTwo(situation);
    return;
  }
  if (situation.id === 3) {
    renderFlowSituationThree(situation);
    return;
  }
  progressBar.style.width = `${Math.round(((situation.startScreen - 1) / (EXPERIENCE_FLOW.totalScreens - 1)) * 100)}%`;
  app.innerHTML = flowPanel(
    situation.startScreen,
    `Situación ${situation.id} de ${EXPERIENCE_FLOW.situations.length}`,
    situation.title,
    '<p class="challenge-intro">Contenido reservado para el siguiente bloque de implementación.</p>',
  );
};

const renderCompletedAgenda = () => {
  app.innerHTML = flowPanel(
    EXPERIENCE_FLOW.screens.completedAgenda,
    "Agenda completada",
    "La agenda de Tadeo",
    `<p class="s1-dialogue-line">¡Listo! Ya terminé todas mis actividades de hoy.</p>
    <div class="s3-agenda-celebration" aria-hidden="true"><img src="./assets/characters/tadeo-celebrando.png" alt="" /></div>
    <div class="two-activity-agenda completed s3-completed-agenda" aria-label="Agenda con las dos actividades completadas">
      <div class="two-activity-agenda-heading"><span aria-hidden="true">★</span><strong>Plan de la tarde</strong><span aria-hidden="true">★</span></div>
      <ul class="two-activity-agenda-list">
        <li class="done"><span class="s2-agenda-check" aria-hidden="true">☑</span><span>Ir a la papelería a comprar 5 cuadernos y un paquete de colores.</span></li>
        <li class="done"><span class="s2-agenda-check" aria-hidden="true">☑</span><span>Comprar un regalo para Eloísa.</span></li>
      </ul>
    </div>
    <div class="form-actions">
      ${isReviewMode
        ? '<button class="primary-button" type="button" data-action="s3-flow-restart-review">VOLVER A RECORRER LA SITUACIÓN</button>'
        : '<button class="primary-button" type="button" data-action="open-flow-closing">CONTINUAR</button>'}
    </div>`,
    "flow-completed-agenda-screen",
  );
};

const renderFlowClosing = () => {
  app.innerHTML = flowPanel(
    EXPERIENCE_FLOW.screens.closing,
    "Recorrido completado",
    "DÍA COMPLETADO",
    `<div class="flow-closing-confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, index) => `<span style="--confetti-index:${index}"></span>`).join("")}</div>
    <div class="flow-closing-layout">
      <div class="flow-closing-copy">
        <p class="flow-closing-message">¡Ayudaste a Tadeo a completar todas las actividades de su agenda!</p>
        <div class="flow-completion-badges" aria-label="Actividades completadas">
          <span><img src="./assets/objects/icono_papeleria.png" alt="" />Papelería completada</span>
          <span><img src="./assets/objects/icono_regalo.png" alt="" />Regalo completado</span>
        </div>
        <div class="flow-completion-meter" aria-label="Recorrido completado al 100 por ciento">
          <div><strong>RECORRIDO COMPLETADO</strong><span>100%</span></div>
          <div class="flow-completion-track"><span></span></div>
        </div>
      </div>
      <div class="flow-closing-visual" aria-hidden="true">
        <img class="flow-closing-tadeo" src="./assets/characters/tadeo-celebrando.png" alt="" />
        <img class="flow-closing-agenda" src="./assets/objects/agenda-cerrada.png" alt="" />
      </div>
    </div>
    <div class="form-actions"><button class="primary-button" type="button" data-action="open-final-screen">CONTINUAR</button></div>`,
    "flow-closing-screen",
  );
};

const renderFlowFinalization = () => {
  progressBar.style.width = "100%";
  app.innerHTML = flowPanel(
    EXPERIENCE_FLOW.screens.finalization,
    "Finalización",
    "¡Terminaste el recorrido de Tadeo!",
    `<div class="flow-finalization-card">
      <img src="./assets/characters/tadeo-celebrando.png" alt="Tadeo celebra que completó su recorrido" />
      <p>Tus respuestas han sido registradas.</p>
    </div>
    <div class="form-actions flow-finalization-actions">${finalScreenControls()}</div>`,
    "flow-finalization-screen",
  );
};

const render = () => {
  updateChrome();
  document.body.dataset.view = introPhase;
  if (!researchSession && introPhase === "access") renderAccess();
  else if (!researchSession) renderHome();
  else if (introPhase === "home") renderHome();
  else if (introPhase === "presentation") renderPresentation();
  else if (introPhase === "agenda") renderInitialAgenda();
  else if (!isReviewMode && finalFlow.screen === EXPERIENCE_FLOW.screens.closing) renderFlowClosing();
  else if (!isReviewMode && finalFlow.screen >= EXPERIENCE_FLOW.screens.finalization) renderFlowFinalization();
  else if (flowProgress.currentScreen === EXPERIENCE_FLOW.screens.completedAgenda) renderCompletedAgenda();
  else if (flowProgress.currentScreen === EXPERIENCE_FLOW.screens.closing) renderFlowClosing();
  else if (flowProgress.currentScreen === EXPERIENCE_FLOW.screens.finalization) renderFlowFinalization();
  else renderFlowSituation(
    situationForScreen(flowProgress.currentScreen)
      || EXPERIENCE_FLOW.situations.find(({ id }) => id === reviewSituation)
      || EXPERIENCE_FLOW.situations[0],
  );
  app.focus({ preventScroll: true });
};

const collectActiveSlice = () => {
  if (!researchSession || isReviewMode || researchSession.completedAt || document.visibilityState !== "visible" || activeStartedAt === null) return;
  const seconds = (performance.now() - activeStartedAt) / 1000;
  activeStartedAt = performance.now();
  if (seconds < 0.2) return;
  const eventId = crypto.randomUUID();
  enqueueOutbox(
    "activity",
    `/api/v2/sessions/${researchSession.id}/activity`,
    "POST",
    { event_id: eventId, active_seconds: Math.min(seconds, 120) },
  );
};

const flushActivity = async () => {
  await flushOutbox();
};

const beginActivityTracking = () => {
  activeStartedAt = !isReviewMode && !researchSession?.completedAt && document.visibilityState === "visible"
    ? performance.now()
    : null;
};

const setFinalFlowStatus = (status, error = "") => {
  finalFlow.completionStatus = status;
  finalFlow.completionError = error;
  saveFinalFlow();
};

const synchronizeFinalScreen = async () => {
  if (isReviewMode || finalFlow.screen !== EXPERIENCE_FLOW.screens.finalization || researchSession?.completedAt) return;
  setFinalFlowStatus("syncing");
  render();
  collectActiveSlice();
  const result = await flushOutbox();
  if (researchSession?.completedAt) {
    setFinalFlowStatus("completed");
  } else if (result.ok) {
    setFinalFlowStatus("ready");
  } else {
    setFinalFlowStatus("error", "sync");
  }
  render();
};

const restoreFinalScreenState = async () => {
  if (isReviewMode || finalFlow.screen !== EXPERIENCE_FLOW.screens.finalization) return;
  if (researchSession?.completedAt) {
    outbox = outbox.filter(
      (item) => !(item.type === "complete" && item.sessionId === researchSession.id),
    );
    saveOutbox();
    setFinalFlowStatus("completed");
    activeStartedAt = null;
    render();
    return;
  }
  if (pendingCompletionItem()) {
    ensureCompletionEventId();
    setFinalFlowStatus("error", "complete");
    render();
    return;
  }
  await synchronizeFinalScreen();
};

const finalizeSession = async () => {
  if (
    isReviewMode
    || finalFlow.screen !== EXPERIENCE_FLOW.screens.finalization
    || researchSession?.completedAt
    || ["syncing", "completing", "completed"].includes(finalFlow.completionStatus)
  ) return;

  const completionEventId = ensureCompletionEventId();
  setFinalFlowStatus("completing");
  render();

  const queuedCompletion = pendingCompletionItem();
  if (queuedCompletion) {
    outbox = outbox.filter((item) => item.queueId !== queuedCompletion.queueId);
    saveOutbox();
  }
  collectActiveSlice();
  const syncResult = await flushOutbox();
  if (!syncResult.ok) {
    if (queuedCompletion) {
      outbox.push(queuedCompletion);
      saveOutbox();
    }
    setFinalFlowStatus("error", "complete");
    render();
    return;
  }

  if (queuedCompletion) {
    outbox.push({ ...queuedCompletion, token: researchSession.token });
    saveOutbox();
    flushOutbox();
  } else {
    queueSessionCompletion(completionEventId);
  }
  const completionResult = await flushOutbox();
  if (!completionResult.ok || !researchSession?.completedAt) {
    setFinalFlowStatus("error", "complete");
  } else {
    setFinalFlowStatus("completed");
    activeStartedAt = null;
  }
  render();
};

const startSession = async (code, allowResume = true, forceNew = false) => {
  const previous = allowResume && researchSession?.code === code ? researchSession : null;
  const data = await apiRequest("/api/v2/sessions", {
    method: "POST",
    body: JSON.stringify({
      code,
      resume_session_id: previous?.id || null,
      resume_token: previous?.token || null,
      force_new: forceNew,
    }),
  }, null);
  const previousRevision = previous?.id === data.state.session_id
    ? Number(previous.progressRevision) || 0
    : 0;
  const pendingProgress = [...outbox].reverse().find(
    (item) => item.type === "progress" && item.sessionId === data.state.session_id,
  );
  const pendingRevision = Number(pendingProgress?.payload?.progress_revision) || 0;
  finalFlow = previous?.id === data.state.session_id
    ? { ...defaultFinalFlow, ...(previous.finalFlow || {}) }
    : { ...defaultFinalFlow };
  researchSession = {
    id: data.state.session_id,
    token: data.session_token,
    code: data.state.participant_code,
    introPhase: "game",
    experienceVersion: data.state.experience_version,
    progressRevision: Math.max(previousRevision, pendingRevision, Number(data.state.progress_revision) || 0),
    completedAt: data.state.completed_at || null,
    finalFlow: { ...finalFlow },
  };
  outbox = outbox.map((item) => item.sessionId === researchSession.id
    ? { ...item, token: researchSession.token }
    : item);
  saveOutbox();
  saveResearchSession();
  applyServerState(data.state);
  loadFlowProgress();
  if (pendingRevision > (Number(data.state.progress_revision) || 0)) {
    applyProgressSnapshot(pendingProgress.payload.progress_snapshot);
  } else if ((Number(data.state.progress_revision) || 0) >= previousRevision) {
    applyProgressSnapshot(data.state.progress_snapshot);
  }
  if (researchSession.completedAt) {
    finalFlow.screen = EXPERIENCE_FLOW.screens.finalization;
    finalFlow.completionStatus = "completed";
    finalFlow.completionError = "";
    saveFinalFlow();
  }
  beginActivityTracking();
  if (finalFlow.screen === EXPERIENCE_FLOW.screens.finalization) await restoreFinalScreenState();
  else flushOutbox();
};

const completeCurrentScene = (sceneIndex) => {
  updateChrome();
  const feedback = document.querySelector("#feedback");
  feedback.textContent = scenes[sceneIndex].success;
  feedback.classList.add("success");
  document.querySelectorAll("#challenge-form input, #challenge-form button[type='submit']").forEach((element) => { element.disabled = true; });
  document.querySelector("#challenge-form button[type='submit']").hidden = true;
  document.querySelector("[data-action='continue']").hidden = false;
  document.querySelector(".challenge-inner").insertAdjacentHTML("beforeend", discoveryMarkup(sceneIndex));
  showToast(`Nuevo descubrimiento: ${discoveries[sceneIndex].title}`);
};

const submitSituationTwoStage = async (form, stageIndex) => {
  const feedback = form.querySelector("#feedback");
  const originalAnswers = Object.fromEntries(new FormData(form).entries());
  situationTwoProgress.answers = { ...situationTwoProgress.answers, ...originalAnswers };
  saveSituationTwoProgress();
  const emptyTextField = [...form.querySelectorAll("input:not([type='radio']), textarea")]
    .find((field) => !field.value.trim());
  if (emptyTextField) {
    const symbolButton = form.querySelector("[data-s2-symbol]");
    feedback.textContent = emptyTextField.type === "hidden"
      ? "Elige una letra o un símbolo antes de continuar."
      : "Completa todos los campos antes de continuar.";
    (emptyTextField.type === "hidden" && symbolButton ? symbolButton : emptyTextField).focus();
    return;
  }

  collectActiveSlice();
  let validationResult = null;
  let fieldValidation = {};
  if (stageIndex === 2) {
    validationResult = originalAnswers.s2_dias_alimento.trim() === "3";
    fieldValidation = { s2_dias_alimento: validationResult };
  } else if (stageIndex === 7) {
    validationResult = originalAnswers.s2_dia_comprar_alimento.trim() === "2";
    fieldValidation = { s2_dia_comprar_alimento: validationResult };
  }
  queueResponseSubmission({
    situation: 2,
    screen: 12 + stageIndex,
    activityId: `s2_stage_${stageIndex}`,
    answers: originalAnswers,
    validationResult,
    fieldValidation,
  });

  if (stageIndex === 2 && !validationResult) {
    feedback.textContent = "Pista: ¿cuántos grupos de 300 g caben en 900 g?";
    form.querySelector("[name='s2_dias_alimento']").focus();
    return;
  }
  if (stageIndex === 7 && !validationResult) {
    feedback.textContent = "Recuerda: la compra debe hacerse un día antes de que terminen los 3 días de alimento.";
    form.querySelector("[name='s2_dia_comprar_alimento']").focus();
    return;
  }

  situationTwoProgress.stage = stageIndex + 1;
  saveSituationTwoProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const selectSituationTwoSymbol = (button, moveFocus = false) => {
  const group = button.closest("[role='radiogroup']");
  const form = button.closest("form");
  if (!group || !form) return;
  const buttons = [...group.querySelectorAll("[data-s2-symbol]")];
  const name = button.dataset.symbolName;
  const input = form.elements.namedItem(name);
  buttons.forEach((item) => {
    const isSelected = item === button;
    item.setAttribute("aria-checked", String(isSelected));
    item.classList.toggle("selected", isSelected);
    item.tabIndex = isSelected ? 0 : -1;
  });
  if (input) input.value = button.dataset.s2Symbol;
  situationTwoProgress.answers[name] = button.dataset.s2Symbol;
  saveSituationTwoProgress();
  form.querySelector("#feedback").textContent = "";
  if (moveFocus) button.focus();
};

const selectSituationThreeSymbol = (button, moveFocus = false) => {
  const group = button.closest("[role='radiogroup']");
  const form = button.closest("form");
  if (!group || !form) return;
  const buttons = [...group.querySelectorAll("[data-s2-symbol]")];
  const name = button.dataset.symbolName;
  const input = form.elements.namedItem(name);
  buttons.forEach((item) => {
    const isSelected = item === button;
    item.setAttribute("aria-checked", String(isSelected));
    item.classList.toggle("selected", isSelected);
    item.tabIndex = isSelected ? 0 : -1;
  });
  if (input) input.value = button.dataset.s2Symbol;
  situationThreeProgress.answers[name] = button.dataset.s2Symbol;
  saveSituationThreeProgress();
  form.querySelector("#feedback").textContent = "";
  if (moveFocus) button.focus();
};

const selectUnknownRepresentation = (button, moveFocus = false) => {
  if (button.dataset.symbolName === "s3_representacion_incognita") {
    selectSituationThreeSymbol(button, moveFocus);
    return;
  }
  selectSituationTwoSymbol(button, moveFocus);
};

const persistSituationThreeDraft = () => {
  const form = document.querySelector("form[data-s3-stage]");
  if (!form) return;
  const draft = Object.fromEntries(new FormData(form).entries());
  situationThreeProgress.answers = { ...situationThreeProgress.answers, ...draft };
  saveSituationThreeProgress();
};

const submitSituationThreeStage = async (form, stageIndex) => {
  const feedback = form.querySelector("#feedback");
  const button = form.querySelector("button[type='submit']");
  let submittedAnswers = Object.fromEntries(new FormData(form).entries());
  situationThreeProgress.answers = { ...situationThreeProgress.answers, ...submittedAnswers };
  saveSituationThreeProgress();

  const requiredNames = {
    1: ["s3_cantidades_conocidas", "s3_cantidad_encontrar", "s3_incognita"],
    2: ["s3_representacion_incognita"],
    3: ["s3_cinco_cuadernos"],
    4: ["s3_igualdad_compra"],
    5: ["s3_representacion_breve"],
    7: ["s3_valor_x", "s3_cuaderno_elegido"],
    8: ["s3_sustitucion", "s3_se_mantiene_igualdad"],
  };
  const missingName = requiredNames[stageIndex].find(
    (name) => !String(situationThreeProgress.answers[name] ?? "").trim(),
  );
  if (missingName) {
    feedback.textContent = missingName === "s3_representacion_incognita"
      ? "Elige una letra o un símbolo antes de continuar."
      : "Completa todos los campos antes de continuar.";
    const missingField = form.elements.namedItem(missingName);
    const focusTarget = missingField?.type === "hidden"
      ? form.querySelector("[data-s2-symbol]")
      : missingField?.length ? missingField[0] : missingField;
    focusTarget?.focus();
    return;
  }

  const objectiveName = stageIndex === 7 ? "s3_resolver" : stageIndex === 8 ? "s3_comprobacion" : null;
  let attempt = null;
  if (objectiveName) {
    const attempts = situationThreeAttemptList(objectiveName);
    const pendingAttempt = attempts.at(-1)?.syncPending ? attempts.at(-1) : null;
    if (pendingAttempt) {
      attempt = pendingAttempt;
      submittedAnswers = { ...pendingAttempt.answers };
    } else {
      const correct = stageIndex === 7
        ? String(submittedAnswers.s3_valor_x).trim() === "30" && submittedAnswers.s3_cuaderno_elegido === "A"
        : submittedAnswers.s3_se_mantiene_igualdad === "Sí";
      attempt = { answers: { ...submittedAnswers }, correct, syncPending: false };
      situationThreeProgress.objectiveAttempts[objectiveName] = [...attempts, attempt];
      saveSituationThreeProgress();
    }
  }
  collectActiveSlice();
  const fieldValidation = {};
  if (stageIndex === 7) {
    fieldValidation.s3_valor_x = attempt.correct;
    fieldValidation.s3_cuaderno_elegido = attempt.correct;
  } else if (stageIndex === 8) {
    fieldValidation.s3_se_mantiene_igualdad = attempt.correct;
  }
  queueResponseSubmission({
    situation: 3,
    screen: 21 + stageIndex,
    activityId: objectiveName || `s3_stage_${stageIndex}`,
    answers: submittedAnswers,
    validationResult: attempt ? attempt.correct : null,
    fieldValidation,
  });

  if (!objectiveName) {
    situationThreeProgress.stage = stageIndex + 1;
    saveSituationThreeProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (attempt.correct) {
    situationThreeProgress.stage = stageIndex + 1;
    saveSituationThreeProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const attempts = situationThreeAttemptList(objectiveName);
  if (attempts.length >= 2) {
    render();
    return;
  }
  feedback.textContent = stageIndex === 7
    ? "Primer intento guardado. Pista: retira primero los $45 de los colores y reparte lo que queda entre los cinco cuadernos."
    : "Primer intento guardado. Pista: calcula el lado izquierdo de tu sustitución y compáralo con $195.";
  if (button) {
    button.disabled = false;
    button.textContent = "Segundo intento";
  }
};

const persistSituationFourDraft = () => {
  const form = document.querySelector("form[data-s4-stage]");
  if (!form) return;
  const draft = Object.fromEntries(new FormData(form).entries());
  situationFourProgress.answers = { ...situationFourProgress.answers, ...draft };
  if (draft.s4_regalo_elegido) situationFourProgress.selectedGift = draft.s4_regalo_elegido;
  saveSituationFourProgress();
};

const situationFourObjectiveForStage = (stageIndex) => {
  if (stageIndex === 6) return "s4_valor_x";
  if (stageIndex === 8) return "s4_se_mantiene_igualdad";
  if (stageIndex === 9) return "s4_registro";
  return null;
};

const situationFourObjectiveIsCorrect = (stageIndex, answers) => {
  if (stageIndex === 6) return String(answers.s4_valor_x ?? "").trim() === "120";
  if (stageIndex === 8) return answers.s4_se_mantiene_igualdad === "Sí";
  if (stageIndex === 9) {
    return [1, 2, 3, 4].every(
      (index) => String(answers[`s4_registro_ingreso${index}`] ?? "").trim() === "120",
    );
  }
  return true;
};

const submitSituationFourStage = (form, stageIndex) => {
  const feedback = form.querySelector("#feedback");
  const submittedAnswers = Object.fromEntries(new FormData(form).entries());
  situationFourProgress.answers = { ...situationFourProgress.answers, ...submittedAnswers };
  if (submittedAnswers.s4_regalo_elegido) {
    situationFourProgress.selectedGift = submittedAnswers.s4_regalo_elegido;
  }
  saveSituationFourProgress();

  const requiredNames = {
    0: ["s4_regalo_elegido"],
    2: ["s4_cantidades_conocidas", "s4_cantidad_encontrar", "s4_incognita"],
    3: ["s4_cuatro_ingresos"],
    4: ["s4_ecuacion"],
    5: ["s4_significado_4x", "s4_significado_menos180", "s4_significado_300"],
    6: ["s4_procedimiento", "s4_valor_x"],
    7: ["s4_explicacion_procedimiento"],
    8: ["s4_sustitucion", "s4_se_mantiene_igualdad", "s4_interpretacion_resultado"],
    9: ["s4_registro_ingreso1", "s4_registro_ingreso2", "s4_registro_ingreso3", "s4_registro_ingreso4"],
  };
  const missingName = requiredNames[stageIndex].find(
    (name) => !String(situationFourProgress.answers[name] ?? "").trim(),
  );
  if (missingName) {
    feedback.textContent = missingName === "s4_regalo_elegido"
      ? "Elige uno de los tres regalos antes de continuar."
      : "Completa todos los campos antes de continuar.";
    const missingField = form.elements.namedItem(missingName);
    const focusTarget = missingField?.length ? missingField[0] : missingField;
    focusTarget?.focus();
    return;
  }

  const objectiveName = situationFourObjectiveForStage(stageIndex);
  let attempt = null;
  if (objectiveName) {
    const attempts = situationFourAttemptList(objectiveName);
    if (attempts.length >= 2) return;
    attempt = {
      answers: { ...submittedAnswers },
      correct: situationFourObjectiveIsCorrect(stageIndex, submittedAnswers),
    };
    situationFourProgress.objectiveAttempts[objectiveName] = [...attempts, attempt];
    saveSituationFourProgress();
  }

  const fieldValidation = {};
  if (stageIndex === 6) fieldValidation.s4_valor_x = attempt.correct;
  if (stageIndex === 8) fieldValidation.s4_se_mantiene_igualdad = attempt.correct;
  if (stageIndex === 9) {
    [1, 2, 3, 4].forEach((index) => {
      fieldValidation[`s4_registro_ingreso${index}`] = String(
        submittedAnswers[`s4_registro_ingreso${index}`],
      ).trim() === "120";
    });
  }
  collectActiveSlice();
  queueResponseSubmission({
    situation: 4,
    screen: 31 + stageIndex,
    activityId: objectiveName || `s4_stage_${stageIndex}`,
    answers: submittedAnswers,
    validationResult: attempt ? attempt.correct : null,
    fieldValidation,
  });
  if (attempt && !attempt.correct) {
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  situationFourProgress.stage = Math.min(10, stageIndex + 1);
  saveSituationFourProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const persistSituationFiveDraft = () => {
  const form = document.querySelector("form[data-s5-stage]");
  if (!form) return;
  const draft = Object.fromEntries(new FormData(form).entries());
  situationFiveProgress.answers = { ...situationFiveProgress.answers, ...draft };
  if (draft.s5_receta_elegida) situationFiveProgress.selectedRecipe = draft.s5_receta_elegida;
  saveSituationFiveProgress();
};

const situationFiveObjectiveForStage = (stageIndex) => {
  if (stageIndex === 4) return "s5_signo_relacion";
  if (stageIndex === 6) return "s5_valor_x";
  if (stageIndex === 7) return "s5_comprobacion";
  if (stageIndex === 8) return "s5_porciones_final";
  return null;
};

const situationFiveValueIsFour = (value) => /^(?:x\s*=\s*)?4(?:[.,]0+)?$/i.test(String(value ?? "").trim());
const situationFiveValueIsSevenHundred = (value) => /^700(?:[.,]0+)?\s*(?:g|gr|gramos?)?$/i.test(String(value ?? "").trim());
const situationFivePortionsAreFour = (value) => {
  const text = String(value ?? "").trim().toLowerCase();
  return situationFiveValueIsFour(text) || (/\b4\b/.test(text) && /porci(?:ón|on|ones)/.test(text));
};

const situationFiveObjectiveIsCorrect = (stageIndex, answers) => {
  if (stageIndex === 4) return answers.s5_signo_relacion === "=";
  if (stageIndex === 6) return situationFiveValueIsFour(answers.s5_valor_x);
  if (stageIndex === 7) {
    return situationFiveValueIsSevenHundred(answers.s5_resultado_receta1)
      && situationFiveValueIsSevenHundred(answers.s5_resultado_receta2)
      && answers.s5_misma_cantidad === "Sí"
      && situationFiveValueIsSevenHundred(answers.s5_gramos_cada_receta);
  }
  if (stageIndex === 8) return situationFivePortionsAreFour(answers.s5_porciones_final);
  return true;
};

const submitSituationFiveStage = (form, stageIndex) => {
  const feedback = form.querySelector("#feedback");
  const submittedAnswers = Object.fromEntries(new FormData(form).entries());
  situationFiveProgress.answers = { ...situationFiveProgress.answers, ...submittedAnswers };
  if (submittedAnswers.s5_receta_elegida) {
    situationFiveProgress.selectedRecipe = submittedAnswers.s5_receta_elegida;
  }
  saveSituationFiveProgress();

  const requiredNames = {
    1: ["s5_cantidades_conocidas", "s5_cantidad_encontrar", "s5_incognita"],
    2: ["s5_receta1_porciones", "s5_receta1_total"],
    3: ["s5_receta2_total"],
    4: ["s5_signo_relacion"],
    5: ["s5_sustitucion_expresiones", "s5_ecuacion_construida", "s5_significado_igual"],
    6: ["s5_procedimiento", "s5_valor_x", "s5_explicacion_procedimiento"],
    7: ["s5_sustitucion_receta1_x", "s5_resultado_receta1", "s5_sustitucion_receta2_x", "s5_resultado_receta2", "s5_misma_cantidad", "s5_gramos_cada_receta"],
    8: ["s5_porciones_final"],
    9: ["s5_receta_elegida"],
  };
  const missingName = (requiredNames[stageIndex] || []).find(
    (name) => !String(situationFiveProgress.answers[name] ?? "").trim(),
  );
  if (missingName) {
    feedback.textContent = stageIndex === 5 && (missingName === "s5_sustitucion_expresiones" || missingName === "s5_ecuacion_construida")
      ? "Forma la relación con tus expresiones antes de continuar."
      : missingName === "s5_receta_elegida"
        ? "Elige una de las dos recetas antes de continuar."
        : "Completa todos los campos antes de continuar.";
    const missingField = form.elements.namedItem(missingName);
    const focusTarget = missingField?.type === "hidden"
      ? document.querySelector("[data-action='s5-build-equation']")
      : missingField?.length ? missingField[0] : missingField;
    focusTarget?.focus();
    return;
  }

  const objectiveName = situationFiveObjectiveForStage(stageIndex);
  let attempt = null;
  if (objectiveName) {
    const attempts = situationFiveAttemptList(objectiveName);
    if (attempts.length >= 2) return;
    attempt = {
      answers: { ...submittedAnswers },
      correct: situationFiveObjectiveIsCorrect(stageIndex, submittedAnswers),
    };
    situationFiveProgress.objectiveAttempts[objectiveName] = [...attempts, attempt];
    saveSituationFiveProgress();
  }

  const fieldValidation = {};
  if (stageIndex === 4) fieldValidation.s5_signo_relacion = attempt.correct;
  if (stageIndex === 6) fieldValidation.s5_valor_x = attempt.correct;
  if (stageIndex === 7) {
    fieldValidation.s5_resultado_receta1 = situationFiveValueIsSevenHundred(submittedAnswers.s5_resultado_receta1);
    fieldValidation.s5_resultado_receta2 = situationFiveValueIsSevenHundred(submittedAnswers.s5_resultado_receta2);
    fieldValidation.s5_misma_cantidad = submittedAnswers.s5_misma_cantidad === "Sí";
    fieldValidation.s5_gramos_cada_receta = situationFiveValueIsSevenHundred(submittedAnswers.s5_gramos_cada_receta);
  }
  if (stageIndex === 8) fieldValidation.s5_porciones_final = attempt.correct;
  collectActiveSlice();
  queueResponseSubmission({
    situation: 5,
    screen: 42 + stageIndex,
    activityId: objectiveName || `s5_stage_${stageIndex}`,
    answers: submittedAnswers,
    validationResult: attempt ? attempt.correct : null,
    fieldValidation,
  });
  if (attempt && !attempt.correct) {
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  situationFiveProgress.stage = Math.min(11, stageIndex + 1);
  saveSituationFiveProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const advanceFlowSituationOne = (stageIndex) => {
  flowProgress.currentScreen = flowSituationScreen(1, stageIndex + 1);
  saveFlowProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const submitFlowSituationOneStage = (form, stageIndex) => {
  const originalAnswers = Object.fromEntries(new FormData(form).entries());
  const progress = flowSituationOneData();
  progress.answers = { ...progress.answers, ...originalAnswers };

  if (stageIndex === 2) {
    collectActiveSlice();
    queueResponseSubmission({
      situation: 1,
      screen: flowSituationScreen(1, stageIndex),
      activityId: "s1_significados",
      answers: originalAnswers,
    });
    if (!progress.savedOpenStages.includes(stageIndex)) progress.savedOpenStages.push(stageIndex);
    saveFlowProgress();
    render();
    return;
  }

  const objectiveStages = {
    0: {
      activityId: "s1_contexto",
      expected: {
        s1_tiempo_total: "60",
        s1_numero_actividades: "2",
        s1_tiempo_por_actividad: "30",
      },
    },
    1: {
      activityId: "s1_distribucion",
      expected: {
        s1_igualdad_valor_1: "30",
        s1_igualdad_valor_2: "30",
      },
    },
    3: {
      activityId: "s1_misma_cantidad",
      expected: { s1_misma_cantidad: "Sí" },
    },
  };
  const objective = objectiveStages[stageIndex];
  if (!objective) return;
  const attempts = flowSituationOneAttempts(objective.activityId);
  if (attempts.length >= 2) return;
  const fieldValidation = Object.fromEntries(
    Object.entries(objective.expected).map(([fieldId, expected]) => [
      fieldId,
      String(originalAnswers[fieldId] || "").trim() === expected,
    ]),
  );
  const validationResult = Object.values(fieldValidation).every(Boolean);
  attempts.push({ answers: { ...originalAnswers }, correct: validationResult });
  progress.objectiveAttempts[objective.activityId] = attempts;
  collectActiveSlice();
  queueResponseSubmission({
    situation: 1,
    screen: flowSituationScreen(1, stageIndex),
    activityId: objective.activityId,
    answers: originalAnswers,
    validationResult,
    fieldValidation,
  });
  if (validationResult) {
    advanceFlowSituationOne(stageIndex);
    return;
  }
  saveFlowProgress();
  render();
};

const advanceFlowSituationTwo = (stageIndex) => {
  flowProgress.currentScreen = flowSituationScreen(2, stageIndex + 1);
  saveFlowProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const submitFlowSituationTwoStage = (form, stageIndex) => {
  const originalAnswers = Object.fromEntries(new FormData(form).entries());
  const progress = flowSituationTwoData();
  progress.answers = { ...progress.answers, ...originalAnswers };

  if (form.dataset.s2FlowForm === "strategy") {
    collectActiveSlice();
    queueResponseSubmission({
      situation: 2,
      screen: flowSituationScreen(2, stageIndex),
      activityId: "s2_estrategia_resolucion",
      answers: originalAnswers,
    });
    progress.strategySaved = true;
    saveFlowProgress();
    render();
    return;
  }

  const openStages = {
    0: "s2_contexto",
    1: "s2_simbolo",
    4: "s2_representacion_breve",
  };
  if (Object.hasOwn(openStages, stageIndex)) {
    collectActiveSlice();
    queueResponseSubmission({
      situation: 2,
      screen: flowSituationScreen(2, stageIndex),
      activityId: openStages[stageIndex],
      answers: originalAnswers,
    });
    if (!progress.savedOpenStages.includes(stageIndex)) progress.savedOpenStages.push(stageIndex);
    saveFlowProgress();
    render();
    return;
  }

  const objectiveStages = {
    3: { activityId: "s2_signo_relacion", expected: { s2_signo_relacion: "=" } },
    6: { activityId: "s2_valor_x", expected: { s2_valor_x: "40" } },
    7: { activityId: "s2_cuaderno_elegido", expected: { s2_cuaderno_elegido: "Cuaderno B — $40" } },
    8: { activityId: "s2_comprobacion_igualdad", expected: { s2_comprobacion_igualdad: "Sí" } },
  };
  const objective = objectiveStages[stageIndex];
  if (!objective) return;
  const attempts = flowSituationTwoAttempts(objective.activityId);
  if (attempts.length >= 2) return;
  const fieldValidation = Object.fromEntries(
    Object.entries(objective.expected).map(([fieldId, expected]) => [
      fieldId,
      String(originalAnswers[fieldId] || "").trim() === expected,
    ]),
  );
  const validationResult = Object.values(fieldValidation).every(Boolean);
  attempts.push({ answers: { ...originalAnswers }, correct: validationResult });
  progress.objectiveAttempts[objective.activityId] = attempts;
  collectActiveSlice();
  queueResponseSubmission({
    situation: 2,
    screen: flowSituationScreen(2, stageIndex),
    activityId: objective.activityId,
    answers: originalAnswers,
    validationResult,
    fieldValidation,
  });
  if (validationResult) {
    if (stageIndex === 8) {
      progress.activityCompleted = true;
      saveFlowProgress();
      render();
      return;
    }
    advanceFlowSituationTwo(stageIndex);
    return;
  }
  saveFlowProgress();
  render();
};

const advanceFlowSituationThree = (stageIndex) => {
  flowProgress.currentScreen = flowSituationScreen(3, stageIndex + 1);
  saveFlowProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const submitFlowSituationThreeStage = (form, stageIndex) => {
  const originalAnswers = Object.fromEntries(new FormData(form).entries());
  const progress = flowSituationThreeData();
  progress.answers = { ...progress.answers, ...originalAnswers };

  if (form.dataset.s3FlowForm === "strategy") {
    collectActiveSlice();
    queueResponseSubmission({
      situation: 3,
      screen: flowSituationScreen(3, stageIndex),
      activityId: "s3_estrategia_resolucion",
      answers: originalAnswers,
    });
    progress.strategySaved = true;
    saveFlowProgress();
    render();
    return;
  }

  const openForms = {
    1: "s3_contexto_registro",
    3: "s3_significado_4x_menos_180",
  };
  const isInterpretation = stageIndex === 4 && form.dataset.s3FlowForm === "interpretation";
  if (Object.hasOwn(openForms, stageIndex) || isInterpretation) {
    collectActiveSlice();
    queueResponseSubmission({
      situation: 3,
      screen: flowSituationScreen(3, stageIndex),
      activityId: isInterpretation ? "s3_interpretacion_ecuacion" : openForms[stageIndex],
      answers: originalAnswers,
    });
    if (!progress.savedOpenStages.includes(stageIndex)) progress.savedOpenStages.push(stageIndex);
    saveFlowProgress();
    render();
    return;
  }

  const objectiveStages = {
    4: { activityId: "s3_valor_lado_derecho", expected: { s3_valor_lado_derecho: "300" } },
    5: { activityId: "s3_valor_x", expected: { s3_valor_x: "120" } },
    6: { activityId: "s3_comprobacion_igualdad", expected: { s3_comprobacion_igualdad: "Sí" } },
  };
  const objective = objectiveStages[stageIndex];
  if (!objective) return;
  const attempts = flowSituationThreeAttempts(objective.activityId);
  if (attempts.length >= 2) return;
  const fieldValidation = Object.fromEntries(
    Object.entries(objective.expected).map(([fieldId, expected]) => [
      fieldId,
      String(originalAnswers[fieldId] || "").trim() === expected,
    ]),
  );
  const validationResult = Object.values(fieldValidation).every(Boolean);
  attempts.push({ answers: { ...originalAnswers }, correct: validationResult });
  progress.objectiveAttempts[objective.activityId] = attempts;
  collectActiveSlice();
  queueResponseSubmission({
    situation: 3,
    screen: flowSituationScreen(3, stageIndex),
    activityId: objective.activityId,
    answers: originalAnswers,
    validationResult,
    fieldValidation,
  });
  if (validationResult) {
    if (stageIndex === 4) {
      progress.equationCompleted = true;
      saveFlowProgress();
      render();
      return;
    }
    advanceFlowSituationThree(stageIndex);
    return;
  }
  saveFlowProgress();
  render();
};

document.addEventListener("submit", async (event) => {
  if (event.target.id === "participant-access-form") {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector("button[type='submit']");
    const feedback = form.querySelector("#access-feedback");
    const code = new FormData(form).get("code")?.trim().toUpperCase().replaceAll(" ", "") || "";
    button.disabled = true;
    button.textContent = "Validando…";
    try {
      await startSession(code);
      setIntroPhase(situationThreeReviewRequested || situationFourReviewRequested ? "game" : "presentation");
      render();
    } catch (error) {
      feedback.textContent = error.message;
      button.disabled = false;
      button.textContent = "CONTINUAR";
    }
    return;
  }

  if (event.target.id !== "challenge-form") return;
  event.preventDefault();
  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (form.dataset.flowSituation === "1") {
    submitFlowSituationOneStage(form, Number(form.dataset.s1FlowStage));
    return;
  }
  if (form.dataset.flowSituation === "2") {
    submitFlowSituationTwoStage(form, Number(form.dataset.s2FlowStage));
    return;
  }
  if (form.dataset.flowSituation === "3") {
    submitFlowSituationThreeStage(form, Number(form.dataset.s3FlowStage));
    return;
  }
  if (form.dataset.s1Stage) {
    const stageIndex = Number(form.dataset.s1Stage);
    const emptyTextField = [...form.querySelectorAll("input:not([type='radio']), textarea")]
      .find((field) => !field.value.trim());
    if (emptyTextField) {
      form.querySelector("#feedback").textContent = "Completa todos los campos antes de continuar.";
      emptyTextField.focus();
      return;
    }
    const originalAnswers = Object.fromEntries(new FormData(form).entries());
    situationOneProgress.answers = { ...situationOneProgress.answers, ...originalAnswers };
    let validationResult = null;
    const fieldValidation = {};
    if (stageIndex === 1) {
      fieldValidation.s1_explora_a = originalAnswers.s1_explora_a.trim() === "120";
      fieldValidation.s1_explora_b = originalAnswers.s1_explora_b.trim() === "4";
      fieldValidation.s1_explora_c = originalAnswers.s1_explora_c.trim() === "30";
      validationResult = Object.values(fieldValidation).every(Boolean);
    } else if (stageIndex === 4) {
      fieldValidation.s1_misma_cantidad = originalAnswers.s1_misma_cantidad === "Sí";
      validationResult = fieldValidation.s1_misma_cantidad;
    }
    collectActiveSlice();
    queueResponseSubmission({
      situation: 1,
      screen: 5 + stageIndex,
      activityId: `s1_stage_${stageIndex}`,
      answers: originalAnswers,
      validationResult,
      fieldValidation,
    });
    situationOneProgress.stage = stageIndex + 1;
    saveSituationOneProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (form.dataset.s2Stage) {
    await submitSituationTwoStage(form, Number(form.dataset.s2Stage));
    return;
  }
  if (form.dataset.s3Stage) {
    await submitSituationThreeStage(form, Number(form.dataset.s3Stage));
    return;
  }
  if (form.dataset.s4Stage) {
    submitSituationFourStage(form, Number(form.dataset.s4Stage));
    return;
  }
  if (form.dataset.s5Stage) {
    submitSituationFiveStage(form, Number(form.dataset.s5Stage));
    return;
  }
  const sceneIndex = state.currentScene;
  const stepIndex = state.currentStep;
  const step = scenes[sceneIndex].steps[stepIndex];
  const button = form.querySelector("button[type='submit']");
  const feedback = form.querySelector("#feedback");
  const result = step.validate(new FormData(form));
  if (!result.ok) {
    feedback.textContent = result.hint;
    feedback.classList.remove("success");
    return;
  }
  feedback.textContent = step.success;
  feedback.classList.add("success");
  button.hidden = true;
  form.querySelector("[data-action='next-question']").hidden = false;
});

document.addEventListener("click", (event) => {
  const symbolButton = event.target.closest("[data-s2-symbol]");
  if (symbolButton) selectUnknownRepresentation(symbolButton);
});

document.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.name || (field.type === "radio" && !field.checked)) return;
  const flowSituationOneForm = field.closest('form[data-flow-situation="1"]');
  if (flowSituationOneForm) {
    flowSituationOneData().answers[field.name] = field.value;
    persistProgressCaches();
    return;
  }
  const flowSituationTwoForm = field.closest('form[data-flow-situation="2"]');
  if (flowSituationTwoForm) {
    flowSituationTwoData().answers[field.name] = field.value;
    persistProgressCaches();
    return;
  }
  const flowSituationThreeForm = field.closest('form[data-flow-situation="3"]');
  if (flowSituationThreeForm) {
    flowSituationThreeData().answers[field.name] = field.value;
    persistProgressCaches();
    return;
  }
  const situationThreeForm = field.closest("form[data-s3-stage]");
  if (situationThreeForm) {
    situationThreeProgress.answers[field.name] = field.value;
    saveSituationThreeProgress();
    return;
  }
  const situationFourForm = field.closest("form[data-s4-stage]");
  if (situationFourForm) {
    situationFourProgress.answers[field.name] = field.value;
    if (field.name === "s4_regalo_elegido") situationFourProgress.selectedGift = field.value;
    saveSituationFourProgress();
    return;
  }
  const situationFiveForm = field.closest("form[data-s5-stage]");
  if (!situationFiveForm) return;
  situationFiveProgress.answers[field.name] = field.value;
  if (field.name === "s5_receta_elegida") situationFiveProgress.selectedRecipe = field.value;
  saveSituationFiveProgress();
});

document.addEventListener("keydown", (event) => {
  const symbolButton = event.target.closest("[data-s2-symbol]");
  if (!symbolButton) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectUnknownRepresentation(symbolButton, true);
    return;
  }
  const navigationKeys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
  if (!navigationKeys.includes(event.key)) return;
  event.preventDefault();
  const buttons = [...symbolButton.closest("[role='radiogroup']").querySelectorAll("[data-s2-symbol]")];
  const currentIndex = buttons.indexOf(symbolButton);
  let nextIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = buttons.length - 1;
  else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % buttons.length;
  else nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  selectUnknownRepresentation(buttons[nextIndex], true);
});

document.addEventListener("click", async (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === "show-access") {
    if (researchSession) {
      if (situationFourReviewRequested && situationFourProgress.stage === 10) {
        resetSituationFourProgress();
      }
      if (situationFiveReviewRequested && situationFiveProgress.stage === 11) {
        resetSituationFiveProgress();
      }
      setIntroPhase("game");
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    introPhase = "access";
    render();
    return;
  }
  if (action === "view-initial-agenda") {
    setIntroPhase("agenda");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "start-game") {
    flowProgress.currentScreen = EXPERIENCE_FLOW.situations[0].startScreen;
    setIntroPhase("game");
    persistProgressCaches();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s1-show-problem-info") {
    document.querySelector("#s1-problem-dialog")?.showModal();
    return;
  }
  if (action === "s1-close-problem-info") {
    actionElement.closest("dialog")?.close();
    return;
  }
  if (action === "s1-continue-after-attempts") {
    const stageIndex = flowProgress.currentScreen - flowSituation(1).startScreen;
    const activityIds = { 0: "s1_contexto", 1: "s1_distribucion", 3: "s1_misma_cantidad" };
    const attempts = flowSituationOneAttempts(activityIds[stageIndex]);
    if (attempts.length < 2 || attempts.some(({ correct }) => correct)) return;
    advanceFlowSituationOne(stageIndex);
    return;
  }
  if (action === "s1-open-response-continue") {
    const progress = flowSituationOneData();
    if (!progress.savedOpenStages.includes(2)) return;
    advanceFlowSituationOne(2);
    return;
  }
  if (action === "s1-discovery-continue") {
    flowProgress.currentScreen = flowSituationScreen(1, 5);
    saveFlowProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s1-go-papeleria") {
    flowProgress.completedSituations = [...new Set([...flowProgress.completedSituations, 1])];
    flowProgress.currentScreen = flowSituation(2).startScreen;
    state.completedScenes = [...flowProgress.completedSituations];
    state.unlocked = [...flowProgress.completedSituations];
    saveFlowProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s2-show-problem-info") {
    document.querySelector("#s2-problem-dialog")?.showModal();
    return;
  }
  if (action === "s2-close-problem-info") {
    actionElement.closest("dialog")?.close();
    return;
  }
  if (action === "s2-flow-select-symbol") {
    const progress = flowSituationTwoData();
    if (progress.savedOpenStages.includes(1)) return;
    progress.answers.s2_simbolo_elegido = actionElement.dataset.symbol;
    persistProgressCaches();
    render();
    return;
  }
  if (action === "s2-flow-open-continue") {
    const stageIndex = flowProgress.currentScreen - flowSituation(2).startScreen;
    if (!flowSituationTwoData().savedOpenStages.includes(stageIndex)) return;
    advanceFlowSituationTwo(stageIndex);
    return;
  }
  if (action === "s2-flow-assign-notebooks") {
    const progress = flowSituationTwoData();
    if (!flowSituationTwoSymbol() || progress.notebooksAssigned) return;
    const literal = Array(5).fill(flowSituationTwoSymbol()).join(" + ");
    progress.answers.s2_representacion_cinco_cuadernos = literal;
    progress.notebooksAssigned = true;
    collectActiveSlice();
    queueResponseSubmission({
      situation: 2,
      screen: flowSituationScreen(2, 2),
      activityId: "s2_representacion_cinco_cuadernos",
      answers: { s2_representacion_cinco_cuadernos: literal },
    });
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s2-flow-notebooks-continue") {
    if (!flowSituationTwoData().notebooksAssigned) return;
    advanceFlowSituationTwo(2);
    return;
  }
  if (action === "s2-flow-add-colors") {
    flowSituationTwoData().colorsAdded = true;
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s2-flow-continue-after-attempts") {
    const stageIndex = flowProgress.currentScreen - flowSituation(2).startScreen;
    const activityIds = {
      3: "s2_signo_relacion",
      6: "s2_valor_x",
      7: "s2_cuaderno_elegido",
      8: "s2_comprobacion_igualdad",
    };
    const attempts = flowSituationTwoAttempts(activityIds[stageIndex]);
    if (attempts.length < 2 || attempts.some(({ correct }) => correct)) return;
    if (stageIndex === 8) {
      flowSituationTwoData().activityCompleted = true;
      saveFlowProgress();
      render();
      return;
    }
    advanceFlowSituationTwo(stageIndex);
    return;
  }
  if (action === "s2-flow-discovery-continue") {
    flowProgress.currentScreen = flowSituationScreen(2, 6);
    saveFlowProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s2-flow-reward-continue") {
    if (!flowSituationTwoData().activityCompleted) return;
    flowProgress.completedActivities = [...new Set([...flowProgress.completedActivities, 0])];
    advanceFlowSituationTwo(8);
    return;
  }
  if (action === "s2-flow-go-store") {
    flowProgress.completedSituations = [...new Set([...flowProgress.completedSituations, 2])];
    flowProgress.completedActivities = [...new Set([...flowProgress.completedActivities, 0])];
    flowProgress.currentScreen = flowSituation(3).startScreen;
    state.completedScenes = [...flowProgress.completedSituations];
    state.unlocked = [...flowProgress.completedSituations];
    saveFlowProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s3-flow-buy-gift") {
    const progress = flowSituationThreeData();
    if (progress.giftPurchased) return;
    progress.answers.s3_regalo_elegido = actionElement.dataset.gift;
    progress.giftPurchased = true;
    collectActiveSlice();
    queueResponseSubmission({
      situation: 3,
      screen: flowSituationScreen(3, 0),
      activityId: "s3_regalo_elegido",
      answers: { s3_regalo_elegido: actionElement.dataset.gift },
    });
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s3-flow-gift-continue") {
    if (!flowSituationThreeData().giftPurchased) return;
    advanceFlowSituationThree(0);
    return;
  }
  if (action === "s3-flow-open-continue") {
    const stageIndex = flowProgress.currentScreen - flowSituation(3).startScreen;
    if (!flowSituationThreeData().savedOpenStages.includes(stageIndex)) return;
    advanceFlowSituationThree(stageIndex);
    return;
  }
  if (action === "s3-flow-build-amounts") {
    const progress = flowSituationThreeData();
    if (progress.quantitiesBuilt) return;
    const literal = "x + x + x + x = 4x";
    progress.quantitiesBuilt = true;
    progress.answers.s3_representacion_cuatro_cantidades = literal;
    collectActiveSlice();
    queueResponseSubmission({
      situation: 3,
      screen: flowSituationScreen(3, 2),
      activityId: "s3_representacion_cuatro_cantidades",
      answers: { s3_representacion_cuatro_cantidades: literal },
    });
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s3-flow-amounts-continue") {
    if (!flowSituationThreeData().quantitiesBuilt) return;
    advanceFlowSituationThree(2);
    return;
  }
  if (action === "s3-flow-add-expense") {
    flowSituationThreeData().expenseAdded = true;
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s3-show-problem-info") {
    document.querySelector("#s3-problem-dialog")?.showModal();
    return;
  }
  if (action === "s3-close-problem-info") {
    actionElement.closest("dialog")?.close();
    return;
  }
  if (action === "s3-flow-continue-after-attempts") {
    const stageIndex = flowProgress.currentScreen - flowSituation(3).startScreen;
    const activityIds = {
      4: "s3_valor_lado_derecho",
      5: "s3_valor_x",
      6: "s3_comprobacion_igualdad",
    };
    const attempts = flowSituationThreeAttempts(activityIds[stageIndex]);
    if (attempts.length < 2 || attempts.some(({ correct }) => correct)) return;
    if (stageIndex === 4) {
      flowSituationThreeData().equationCompleted = true;
      saveFlowProgress();
      render();
      return;
    }
    advanceFlowSituationThree(stageIndex);
    return;
  }
  if (action === "s3-flow-complete-register") {
    const progress = flowSituationThreeData();
    if (progress.registerCompleted) return;
    const literal = "$120 | $120 | $120 | $120";
    progress.registerCompleted = true;
    progress.answers.s3_registro_completado = literal;
    collectActiveSlice();
    queueResponseSubmission({
      situation: 3,
      screen: flowSituationScreen(3, 7),
      activityId: "s3_registro_completado",
      answers: { s3_registro_completado: literal },
    });
    saveFlowProgress();
    render();
    return;
  }
  if (action === "s3-flow-register-continue") {
    if (!flowSituationThreeData().registerCompleted) return;
    flowProgress.completedSituations = [...new Set([...flowProgress.completedSituations, 3])];
    flowProgress.completedActivities = [...new Set([...flowProgress.completedActivities, 1])];
    flowProgress.currentScreen = EXPERIENCE_FLOW.screens.completedAgenda;
    state.completedScenes = [...flowProgress.completedSituations];
    state.unlocked = [...flowProgress.completedSituations];
    saveFlowProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s3-flow-restart-review") {
    if (!isReviewMode || reviewSituation !== 3) return;
    flowProgress.situationData[3] = createDefaultFlowProgress().situationData[3];
    flowProgress.currentScreen = flowSituation(3).startScreen;
    state.currentScene = 2;
    state.completedScenes = [];
    state.unlocked = [];
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s1-start") {
    situationOneProgress.stage = 1;
    saveSituationOneProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s1-show-agenda") {
    situationOneProgress.stage = 6;
    saveSituationOneProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "start-s2") {
    state.currentScene = 1;
    state.completedScenes = [0];
    state.unlocked = [0];
    situationOneProgress.stage = 7;
    saveSituationOneProgress();
    loadSituationTwoProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s2-next") {
    situationTwoProgress.stage += 1;
    saveSituationTwoProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "start-s3") {
    state.currentScene = 2;
    state.completedScenes = [0, 1];
    state.unlocked = [0, 1];
    situationThreeProgress.stage = 0;
    saveSituationThreeProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s3-next") {
    situationThreeProgress.stage = Math.min(9, situationThreeProgress.stage + 1);
    saveSituationThreeProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "start-s4") {
    state.currentScene = 3;
    state.completedScenes = [0, 1, 2];
    state.unlocked = [0, 1, 2];
    resetSituationFourProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "start-s5") {
    state.currentScene = 4;
    state.completedScenes = [0, 1, 2, 3];
    state.unlocked = [0, 1, 2, 3];
    loadSituationFiveProgress();
    ensureSituationFiveProgress();
    setIntroPhase("game");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s4-next") {
    persistSituationFourDraft();
    situationFourProgress.stage = Math.min(10, situationFourProgress.stage + 1);
    saveSituationFourProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s5-next") {
    persistSituationFiveDraft();
    situationFiveProgress.stage = Math.min(11, situationFiveProgress.stage + 1);
    saveSituationFiveProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "open-final-narrative") {
    if (isReviewMode || situationFiveProgress.stage !== 11) return;
    finalFlow.screen = EXPERIENCE_FLOW.screens.closing;
    setFinalFlowStatus("idle");
    queueProgressSnapshot();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "open-flow-closing") {
    if (isReviewMode || flowProgress.currentScreen !== EXPERIENCE_FLOW.screens.completedAgenda) return;
    collectActiveSlice();
    finalFlow.screen = EXPERIENCE_FLOW.screens.closing;
    setFinalFlowStatus("idle");
    queueProgressSnapshot();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "open-final-screen") {
    if (isReviewMode || finalFlow.screen !== EXPERIENCE_FLOW.screens.closing) return;
    collectActiveSlice();
    finalFlow.screen = EXPERIENCE_FLOW.screens.finalization;
    ensureCompletionEventId();
    setFinalFlowStatus("syncing");
    queueProgressSnapshot();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    await synchronizeFinalScreen();
    return;
  }
  if (action === "retry-final-sync") {
    await synchronizeFinalScreen();
    return;
  }
  if (action === "finalize-session") {
    await finalizeSession();
    return;
  }
  if (action === "s5-build-equation") {
    persistSituationFiveDraft();
    const expressionOne = String(situationFiveProgress.answers.s5_receta1_total || "");
    const sign = String(situationFiveProgress.answers.s5_signo_relacion || "");
    const expressionTwo = String(situationFiveProgress.answers.s5_receta2_total || "");
    const relation = `${expressionOne} ${sign} ${expressionTwo}`;
    situationFiveProgress.answers.s5_sustitucion_expresiones = relation;
    situationFiveProgress.answers.s5_ecuacion_construida = relation;
    saveSituationFiveProgress();
    render();
    return;
  }
  if (action === "s3-continue-after-attempts") {
    const objectiveName = situationThreeProgress.stage === 7 ? "s3_resolver" : "s3_comprobacion";
    const attempts = situationThreeAttemptList(objectiveName);
    if (attempts.length < 2 || attempts.some((attempt) => attempt.correct)) return;
    situationThreeProgress.stage = Math.min(9, situationThreeProgress.stage + 1);
    saveSituationThreeProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s3-return-home") {
    persistSituationThreeDraft();
    setIntroPhase("home");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s4-continue-after-attempts") {
    const objectiveName = situationFourObjectiveForStage(situationFourProgress.stage);
    const attempts = objectiveName ? situationFourAttemptList(objectiveName) : [];
    if (attempts.length < 2 || attempts.some((attempt) => attempt.correct)) return;
    situationFourProgress.stage = Math.min(10, situationFourProgress.stage + 1);
    saveSituationFourProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s4-return-home") {
    persistSituationFourDraft();
    setIntroPhase("home");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s5-continue-after-attempts") {
    const objectiveName = situationFiveObjectiveForStage(situationFiveProgress.stage);
    const attempts = objectiveName ? situationFiveAttemptList(objectiveName) : [];
    if (attempts.length < 2 || attempts.some((attempt) => attempt.correct)) return;
    persistSituationFiveDraft();
    situationFiveProgress.stage = Math.min(11, situationFiveProgress.stage + 1);
    saveSituationFiveProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "s5-return-home") {
    persistSituationFiveDraft();
    setIntroPhase("home");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "restart-completed-session") {
    if (isReviewMode || !researchSession?.completedAt) return;
    const code = researchSession.code;
    actionElement.disabled = true;
    actionElement.textContent = "PREPARANDO…";
    try {
      await startSession(code, false, true);
      setIntroPhase("presentation");
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Se inició un nuevo recorrido.");
    } catch (error) {
      showToast(error.message);
      actionElement.disabled = false;
      actionElement.textContent = "VOLVER A JUGAR";
    }
    return;
  }
  if (action === "s1-restart") {
    const code = researchSession.code;
    actionElement.disabled = true;
    actionElement.textContent = "Preparando revisión…";
    collectActiveSlice();
    await flushActivity();
    try {
      await startSession(code, false, true);
      setIntroPhase("game");
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("La revisión de la Situación 1 está lista.");
    } catch (error) {
      showToast(error.message);
      actionElement.disabled = false;
      actionElement.textContent = "Revisar de nuevo la Situación 1";
    }
    return;
  }
  if (action === "next-question" || action === "continue") {
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (action === "discoveries") discoveriesDialog.showModal();
  if (action === "reset") {
    const code = researchSession.code;
    actionElement.disabled = true;
    collectActiveSlice();
    await flushActivity();
    try {
      await startSession(code, false, true);
      render();
      showToast("Se inició una nueva sesión de repetición.");
    } catch (error) {
      showToast(error.message);
      actionElement.disabled = false;
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    collectActiveSlice();
    activeStartedAt = null;
    flushActivity();
  } else if (researchSession && !isReviewMode && !researchSession.completedAt) {
    activeStartedAt = performance.now();
    flushActivity();
  }
});

window.addEventListener("pagehide", () => {
  collectActiveSlice();
  flushActivity();
});

window.setInterval(() => {
  collectActiveSlice();
  flushActivity();
}, 15000);

document.querySelector("#agenda-button").addEventListener("click", () => agendaDialog.showModal());
document.querySelector("#discoveries-button").addEventListener("click", () => discoveriesDialog.showModal());
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
});

const initialize = async () => {
  if (isReviewMode) {
    researchSession = {
      id: `review-s${reviewSituation}`,
      token: "",
      code: `REVIEW${reviewSituation}`,
      introPhase: "game",
      experienceVersion: EXPERIENCE_VERSION,
      progressRevision: 0,
      completedAt: null,
    };
    introPhase = "game";
    flowProgress = createDefaultFlowProgress();
    flowProgress.currentScreen = EXPERIENCE_FLOW.situations.find(({ id }) => id === reviewSituation).startScreen;
    state = {
      ...defaultState,
      currentScene: reviewSituation - 1,
      completedScenes: [],
      unlocked: [],
    };
    render();
    return;
  }
  if (!researchSession?.id || !researchSession?.token) {
    researchSession = null;
    introPhase = "home";
    render();
    return;
  }
  renderLoading();
  const localRevision = Number(researchSession.progressRevision) || 0;
  loadFlowProgress();
  const pendingProgress = [...outbox].reverse().find(
    (item) => item.type === "progress" && item.sessionId === researchSession.id,
  );
  const pendingRevision = Number(pendingProgress?.payload?.progress_revision) || 0;
  if (pendingProgress && pendingRevision >= localRevision) {
    researchSession.progressRevision = pendingRevision;
    applyProgressSnapshot(pendingProgress.payload.progress_snapshot);
  }
  try {
    const data = await apiRequest(`/api/v2/sessions/${researchSession.id}/state`);
    applyServerState(data.state);
    researchSession.experienceVersion = data.state.experience_version;
    researchSession.completedAt = data.state.completed_at || null;
    const serverRevision = Number(data.state.progress_revision) || 0;
    if (serverRevision >= Math.max(localRevision, pendingRevision)) {
      researchSession.progressRevision = serverRevision;
      applyProgressSnapshot(data.state.progress_snapshot);
    }
    if (researchSession.completedAt) {
      finalFlow.screen = EXPERIENCE_FLOW.screens.finalization;
      finalFlow.completionStatus = "completed";
      finalFlow.completionError = "";
    }
    saveFinalFlow();
    saveResearchSession();
    beginActivityTracking();
    render();
    if (finalFlow.screen === EXPERIENCE_FLOW.screens.finalization) await restoreFinalScreenState();
    else flushOutbox();
  } catch (error) {
    if (error.status === 401 || error.status === 404) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      researchSession = null;
      state = { ...defaultState };
      introPhase = "access";
      renderAccess("Tu sesión anterior ya no está disponible. Ingresa nuevamente tu folio.");
      return;
    }
    introPhase = researchSession.introPhase || "game";
    const currentSituation = situationForScreen(currentScreenForProgress());
    state.currentScene = currentSituation ? currentSituation.id - 1 : 0;
    beginActivityTracking();
    render();
    if (finalFlow.screen === EXPERIENCE_FLOW.screens.finalization) await restoreFinalScreenState();
  }
};

initialize();
