const SESSION_STORAGE_KEY = "tadeo-research-session-v1";
const PENDING_ATTEMPT_KEY = "tadeo-pending-attempt-v1";
const ACTIVITY_QUEUE_KEY = "tadeo-activity-queue-v1";

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

const answerChoice = (name, value, label) => `
  <label class="answer-choice">
    <input type="radio" name="${name}" value="${value}" />
    <span>${label}</span>
  </label>`;

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
            <div class="symbol-grid">${symbols.map(symbolChoice).join("")}</div>
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

const defaultState = { currentScene: 0, currentStep: 0, completedScenes: [], unlocked: [], metrics: null };
let state = { ...defaultState };
let researchSession = loadJson(SESSION_STORAGE_KEY, null);
let activityQueue = loadJson(ACTIVITY_QUEUE_KEY, []);
let activeStartedAt = null;
let activitySending = false;
let toastTimer;

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const saveResearchSession = () => localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(researchSession));
const saveActivityQueue = () => localStorage.setItem(ACTIVITY_QUEUE_KEY, JSON.stringify(activityQueue));

const applyServerState = (serverState) => {
  state = {
    currentScene: serverState.current_scene,
    currentStep: serverState.current_step,
    completedScenes: serverState.completed_scenes,
    unlocked: serverState.completed_scenes,
    metrics: serverState.metrics,
  };
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
  if (!response.ok) throw new Error(data.detail || "El servidor no pudo completar la solicitud.");
  return data;
};

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
  const scene = scenes[state.currentScene];
  const stepProgress = scene ? state.currentStep / scene.steps.length : 0;
  const storyProgress = state.currentScene >= scenes.length ? 1 : (state.completedScenes.length + stepProgress) / scenes.length;
  progressBar.style.width = `${Math.round(Math.min(storyProgress, 1) * 100)}%`;
  agendaList.innerHTML = agendaItems
    .map((item, index) => `<li class="${index < done ? "done" : ""}"><span class="check" aria-hidden="true">${index < done ? "✓" : ""}</span><span>${item}</span></li>`)
    .join("");

  if (!state.unlocked.length) {
    discoveriesList.innerHTML = '<p class="empty-state">Completa el primer reto para desbloquear tu primera tarjeta.</p>';
  } else {
    discoveriesList.innerHTML = state.unlocked.map((index) => {
      const item = discoveries[index];
      return `<article class="discovery-card"><h3>${item.title}</h3><p>${item.text}</p><code>${item.example}</code></article>`;
    }).join("");
  }
};

const renderAccess = (error = "") => {
  app.innerHTML = `
    <section class="screen" style="background-image: url('./assets/scenes/habitacion.png')">
      <div class="hero-card access-card">
        <div class="hero-copy">
          <span class="eyebrow">Una tarde · Cinco descubrimientos</span>
          <h1>El día de Tadeo</h1>
          <p>Ingresa el folio anónimo que te entregó el aplicador. Guardaremos tus respuestas, intentos y tiempos para evaluar la actividad; no solicitamos tu nombre ni correo.</p>
          <form id="participant-access-form" class="access-form">
            <label class="field-group"><span class="field-label">Folio de participante</span>
              <input class="text-input code-input" name="code" maxlength="8" autocomplete="off" autocapitalize="characters" required placeholder="Ej. 7KMP4R2A" />
            </label>
            <p class="feedback" id="access-feedback" role="alert">${error}</p>
            <button class="primary-button" type="submit">Comenzar <span aria-hidden="true">→</span></button>
          </form>
          <p class="privacy-note">El folio es seudónimo. El aplicador puede exportar o eliminar los datos desde el panel protegido.</p>
        </div>
        <div class="hero-character"><img src="./assets/characters/tadeo.png" alt="Tadeo, protagonista del juego" /></div>
      </div>
    </section>`;
};

const renderLoading = () => {
  app.innerHTML = '<section class="screen loading-screen"><div class="loading-card"><strong>Cargando tu sesión…</strong><span>Estamos recuperando tu progreso.</span></div></section>';
};

const renderScene = () => {
  const sceneIndex = state.currentScene;
  const stepIndex = state.currentStep;
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

const render = () => {
  updateChrome();
  if (!researchSession) renderAccess();
  else if (state.currentScene >= scenes.length) renderFinish();
  else renderScene();
  app.focus({ preventScroll: true });
};

const collectActiveSlice = () => {
  if (!researchSession || document.visibilityState !== "visible" || activeStartedAt === null) return;
  const seconds = (performance.now() - activeStartedAt) / 1000;
  activeStartedAt = performance.now();
  if (seconds < 0.2) return;
  activityQueue.push({
    sessionId: researchSession.id,
    token: researchSession.token,
    event_id: crypto.randomUUID(),
    active_seconds: Math.min(seconds, 120),
  });
  saveActivityQueue();
};

const flushActivity = async () => {
  if (activitySending || !activityQueue.length) return;
  activitySending = true;
  try {
    while (activityQueue.length) {
      const item = activityQueue[0];
      await apiRequest(`/api/sessions/${item.sessionId}/activity`, {
        method: "POST",
        body: JSON.stringify({ event_id: item.event_id, active_seconds: item.active_seconds }),
        keepalive: true,
      }, item.token);
      activityQueue.shift();
      saveActivityQueue();
    }
  } catch {
    // La cola permanece localmente y se reintenta en el siguiente pulso.
  } finally {
    activitySending = false;
  }
};

const beginActivityTracking = () => {
  activeStartedAt = document.visibilityState === "visible" ? performance.now() : null;
};

const startSession = async (code, allowResume = true) => {
  const previous = allowResume && researchSession?.code === code ? researchSession : null;
  const data = await apiRequest("/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      code,
      resume_session_id: previous?.id || null,
      resume_token: previous?.token || null,
    }),
  }, null);
  researchSession = { id: data.state.session_id, token: data.session_token, code: data.state.participant_code };
  saveResearchSession();
  applyServerState(data.state);
  beginActivityTracking();
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
      await startSession(code, false);
      render();
      agendaDialog.showModal();
    } catch (error) {
      feedback.textContent = error.message;
      button.disabled = false;
      button.textContent = "Comenzar →";
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
  const sceneIndex = state.currentScene;
  const stepIndex = state.currentStep;
  const step = scenes[sceneIndex].steps[stepIndex];
  const answers = Object.fromEntries(new FormData(form).entries());
  const fingerprint = JSON.stringify({ sessionId: researchSession.id, sceneIndex, stepIndex, answers });
  const savedPending = loadJson(PENDING_ATTEMPT_KEY, null);
  const pending = savedPending?.fingerprint === fingerprint
    ? savedPending
    : { event_id: crypto.randomUUID(), fingerprint };
  localStorage.setItem(PENDING_ATTEMPT_KEY, JSON.stringify(pending));

  const button = form.querySelector("button[type='submit']");
  const feedback = form.querySelector("#feedback");
  button.disabled = true;
  button.textContent = "Guardando…";
  collectActiveSlice();
  flushActivity();
  try {
    const result = await apiRequest(`/api/sessions/${researchSession.id}/attempts`, {
      method: "POST",
      body: JSON.stringify({ event_id: pending.event_id, scene_index: sceneIndex, step_index: stepIndex, answers }),
    });
    localStorage.removeItem(PENDING_ATTEMPT_KEY);
    applyServerState(result.state);
    if (!result.correct) {
      feedback.textContent = result.hint;
      feedback.classList.remove("success");
      button.disabled = false;
      button.textContent = "Comprobar respuesta";
      return;
    }

    if (stepIndex === scenes[sceneIndex].steps.length - 1) {
      completeCurrentScene(sceneIndex);
      return;
    }
    feedback.textContent = step.success;
    feedback.classList.add("success");
    document.querySelectorAll("#challenge-form input").forEach((element) => { element.disabled = true; });
    button.hidden = true;
    form.querySelector("[data-action='next-question']").hidden = false;
    updateChrome();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.classList.remove("success");
    button.disabled = false;
    button.textContent = "Reintentar y guardar";
  }
});

document.addEventListener("click", async (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
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
      await startSession(code, false);
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
  } else if (researchSession) {
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
  if (!researchSession?.id || !researchSession?.token) {
    researchSession = null;
    render();
    return;
  }
  renderLoading();
  try {
    const data = await apiRequest(`/api/sessions/${researchSession.id}/state`);
    applyServerState(data.state);
    beginActivityTracking();
    render();
    flushActivity();
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    researchSession = null;
    state = { ...defaultState };
    renderAccess("Tu sesión anterior ya no está disponible. Ingresa nuevamente tu folio.");
  }
};

initialize();
