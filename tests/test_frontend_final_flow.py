from pathlib import Path


ROOT = Path(__file__).parents[1]
APP_SOURCE = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
CSS_SOURCE = (ROOT / "css" / "main.css").read_text(encoding="utf-8")
ACTIVE_DOCS = [
    ROOT / "README.md",
    ROOT / "tadeo_videojuego" / "Bienvenido.md",
    ROOT / "tadeo_videojuego" / "01 Proyecto" / "Narrativa.md",
    ROOT / "tadeo_videojuego" / "01 Proyecto" / "Brief del proyecto.md",
    *sorted((ROOT / "tadeo_videojuego" / "02 Situaciones").glob("*.md")),
    *sorted((ROOT / "tadeo_videojuego" / "03 Diseño").glob("*.md")),
]


def test_new_experience_and_storage_are_isolated():
    assert 'const EXPERIENCE_VERSION = "tadeo-3situaciones-1";' in APP_SOURCE
    assert 'const SESSION_STORAGE_KEY = "tadeo-3situaciones-session-v1";' in APP_SOURCE
    assert 'const OUTBOX_STORAGE_KEY = "tadeo-3situaciones-outbox-v1";' in APP_SOURCE
    assert 'const FLOW_PROGRESS_KEY = "tadeo-3situaciones-progress-v1";' in APP_SOURCE


def test_flow_definition_centralizes_definitive_31_screens():
    route = APP_SOURCE.split("const EXPERIENCE_ROUTE =", 1)[1].split("const buildExperienceFlow", 1)[0]
    builder = APP_SOURCE.split("const buildExperienceFlow", 1)[1].split("const EXPERIENCE_FLOW", 1)[0]
    assert "nextScreen = route.introScreens.initialAgenda + 1" in builder
    assert "home: 1" in route
    assert "folio: 2" in route
    assert "presentation: 3" in route
    assert "initialAgenda: 4" in route
    assert 'id: 1, key: "organizando-tiempo", title: "Organizando el tiempo", screenCount: 6' in route
    assert 'id: 2, key: "papeleria", title: "En la papelería", screenCount: 10' in route
    assert 'id: 3, key: "dinero", title: "Registrando su dinero", screenCount: 8' in route
    assert 'closingScreens: Object.freeze(["completedAgenda", "closing", "finalization"])' in route
    assert "screens[name] = nextScreen" in builder
    assert route.count("Object.freeze({ id:") == 3
    assert "mascota" not in route.lower()
    assert "receta" not in route.lower()


def test_active_agenda_has_exactly_two_approved_activities():
    agenda = APP_SOURCE.split("const agendaItems =", 1)[1].split("const initialAgendaIcons", 1)[0]
    icons = APP_SOURCE.split("const initialAgendaIcons =", 1)[1].split("const discoveries", 1)[0]
    assert "Ir a la papelería a comprar 5 cuadernos y un paquete de colores." in agenda
    assert "Comprar un regalo para Eloísa." in agenda
    assert "perro" not in agenda.lower()
    assert "cena" not in agenda.lower()
    assert agenda.count('  "') == 2
    assert icons.count('  "') == 2


def test_initial_agenda_does_not_use_the_four_slot_artwork():
    renderer = APP_SOURCE.split("const renderInitialAgenda = () =>", 1)[1].split(
        "const renderLoading", 1
    )[0]
    assert "two-activity-agenda" in renderer
    assert "Agenda%20abierta%204%20actividades" not in renderer
    assert ".two-activity-agenda-list {" in CSS_SOURCE
    assert "grid-template-columns: repeat(2" in CSS_SOURCE


def test_situation_one_uses_only_the_approved_questions_and_equality_language():
    active_s1 = APP_SOURCE.split("const SITUATION_ONE_CONTEXT", 1)[1].split(
        "const SITUATION_TWO_CONTEXT", 1
    )[0]
    approved_questions = [
        "¿Cuánto tiempo tiene Tadeo en total para realizar sus actividades?",
        "¿Cuántas actividades tiene pendientes?",
        "Si quiere dedicar el mismo tiempo a cada actividad, ¿cuántos minutos puede dedicar a cada una?",
        "¿Qué representa la cantidad que aparece a la izquierda del signo igual? Explícalo con tus palabras.",
        "¿Qué representa la cantidad que aparece a la derecha del signo igual? Explícalo con tus palabras.",
        "¿Ambos lados representan la misma cantidad?",
        "¿Por qué? Explícalo con tus palabras.",
    ]
    for question in approved_questions:
        assert active_s1.count(question) == 1
    assert "incógnita" not in active_s1.lower()
    assert "ecuación" not in active_s1.lower()
    assert 'name="x"' not in active_s1


def test_situation_one_numeric_units_are_outside_inputs_and_math_is_clear():
    context_screen = APP_SOURCE.split("const flowSituationOneContextScreen", 1)[1].split(
        "const flowSituationOneDistributionScreen", 1
    )[0]
    assert 'name="s1_tiempo_total"' in context_screen
    assert 'name="s1_numero_actividades"' in context_screen
    assert 'name="s1_tiempo_por_actividad"' in context_screen
    assert context_screen.count('</span>\n      </label>') == 3
    assert context_screen.count("<span>minutos</span>") == 2
    assert context_screen.count("<span>actividades</span>") == 1
    assert "font-family: Georgia" in CSS_SOURCE
    assert ".s1-math-display" in CSS_SOURCE


def test_situation_one_attempts_are_capped_preserved_and_non_blocking():
    submitter = APP_SOURCE.split("const submitFlowSituationOneStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    actions = APP_SOURCE.split('if (action === "s1-continue-after-attempts")', 1)[1].split(
        'if (action === "s1-open-response-continue")', 1
    )[0]
    assert "if (attempts.length >= 2) return;" in submitter
    assert "attempts.push({ answers: { ...originalAnswers }, correct: validationResult });" in submitter
    assert "attempts.length < 2" in actions
    assert "advanceFlowSituationOne(stageIndex);" in actions
    assert "Revisa la información del problema e inténtalo nuevamente." in APP_SOURCE
    assert "Respuesta registrada. Puedes continuar." in APP_SOURCE


def test_situation_one_open_answers_have_no_automatic_validation():
    submitter = APP_SOURCE.split("const submitFlowSituationOneStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    open_branch = submitter.split("if (stageIndex === 2)", 1)[1].split(
        "const objectiveStages", 1
    )[0]
    assert 'activityId: "s1_significados"' in open_branch
    assert "validationResult" not in open_branch
    assert "fieldValidation" not in open_branch
    assert "Respuesta registrada." in APP_SOURCE


def test_problem_information_preserves_drafts_and_does_not_submit():
    input_handler = APP_SOURCE.split('document.addEventListener("input"', 1)[1].split(
        'document.addEventListener("keydown"', 1
    )[0]
    info_action = APP_SOURCE.split('if (action === "s1-show-problem-info")', 1)[1].split(
        'if (action === "s1-close-problem-info")', 1
    )[0]
    assert "flowSituationOneData().answers[field.name] = field.value" in input_handler
    assert "persistProgressCaches();" in input_handler
    assert "showModal();" in info_action
    assert "render();" not in info_action
    assert "queueResponseSubmission" not in info_action


def test_situation_one_final_agenda_stays_pending_and_routes_to_situation_two():
    agenda_screen = APP_SOURCE.split("const flowSituationOneAgendaScreen", 1)[1].split(
        "const renderFlowSituationOne", 1
    )[0]
    route_action = APP_SOURCE.split('if (action === "s1-go-papeleria")', 1)[1].split(
        'if (action === "s2-show-problem-info")', 1
    )[0]
    assert "Ya organicé mi tiempo. Comenzaré por la papelería." in agenda_screen
    assert "s1-pending-box" in agenda_screen
    assert "✓" not in agenda_screen
    assert "IR A LA PAPELERÍA" in agenda_screen
    assert "flowSituation(2).startScreen" in route_action
    assert "completedActivities" not in route_action
    renderer = APP_SOURCE.split("const render = () =>", 1)[1].split(
        "const collectActiveSlice", 1
    )[0]
    assert renderer.index("situationForScreen(flowProgress.currentScreen)") < renderer.index(
        "EXPERIENCE_FLOW.situations.find(({ id }) => id === reviewSituation)"
    )


def test_situation_two_uses_the_approved_purchase_data_and_questions():
    s2 = APP_SOURCE.split("const SITUATION_TWO_CONTEXT", 1)[1].split(
        "const SITUATION_THREE_GIFTS", 1
    )[0]
    assert "5 cuadernos iguales y un paquete de colores" in s2
    assert "El paquete de colores cuesta $50" in s2
    assert "por toda la compra deberá pagar $250" in s2
    assert "¿Qué información conoces de la compra de Tadeo?" in s2
    assert "¿Qué necesita averiguar Tadeo?" in s2
    assert "5x + 50 = 250" in s2
    assert 'expected: { s2_valor_x: "40" }' in APP_SOURCE


def test_situation_two_offers_eight_equal_symbol_choices_without_preselection():
    symbols = APP_SOURCE.split("const SITUATION_TWO_SYMBOLS", 1)[1].split(
        "const SITUATION_TWO_NOTEBOOKS", 1
    )[0]
    symbol_screen = APP_SOURCE.split("const flowSituationTwoSymbolScreen", 1)[1].split(
        "const flowSituationTwoNotebookVisuals", 1
    )[0]
    assert '["x", "a", "?", "△", "□", "○", "★", "◆"]' in symbols
    assert symbols.count('", "') == 7
    assert "SITUATION_TWO_SYMBOLS.map" in symbol_screen
    assert 'aria-checked="${selected === symbol}"' in symbol_screen
    assert 'type="radio"' not in symbol_screen
    assert '? "checked"' not in symbol_screen
    assert ".s2-flow-symbol {" in CSS_SOURCE
    assert ".s2-flow-symbol-x" not in CSS_SOURCE


def test_situation_two_reuses_the_selected_symbol_for_five_equal_notebooks():
    visuals = APP_SOURCE.split("const flowSituationTwoNotebookVisuals", 1)[1].split(
        "const flowSituationTwoCompletePurchaseScreen", 1
    )[0]
    assignment = APP_SOURCE.split('if (action === "s2-flow-assign-notebooks")', 1)[1].split(
        'if (action === "s2-flow-notebooks-continue")', 1
    )[0]
    assert "Array.from({ length: 5 }" in visuals
    assert "flowSituationTwoSymbol()" in visuals
    assert 'Array(5).fill(flowSituationTwoSymbol()).join(" + ")' in assignment
    assert "s2_representacion_cinco_cuadernos" in assignment


def test_situation_two_does_not_formalize_x_before_discovery():
    before_discovery = APP_SOURCE.split("const flowSituationTwoContextScreen", 1)[1].split(
        "const flowSituationTwoDiscoveryScreen", 1
    )[0]
    discovery = APP_SOURCE.split("const flowSituationTwoDiscoveryScreen", 1)[1].split(
        "const flowSituationTwoSolveScreen", 1
    )[0]
    assert "5x" not in before_discovery
    assert "ecuación" not in before_discovery.lower()
    assert "5x + 50 = 250" in discovery
    assert "Una ecuación es una igualdad" in discovery


def test_situation_two_open_responses_are_literal_and_not_validated():
    submitter = APP_SOURCE.split("const submitFlowSituationTwoStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    open_branch = submitter.split("const openStages", 1)[1].split(
        "const objectiveStages", 1
    )[0]
    strategy_branch = submitter.split('if (form.dataset.s2FlowForm === "strategy")', 1)[1].split(
        "const openStages", 1
    )[0]
    assert "queueResponseSubmission" in open_branch
    assert "validationResult" not in open_branch
    assert "fieldValidation" not in open_branch
    assert 'activityId: "s2_estrategia_resolucion"' in strategy_branch
    assert "validationResult" not in strategy_branch
    assert "originalAnswers" in strategy_branch


def test_situation_two_objective_attempts_are_capped_and_keep_both_submissions():
    submitter = APP_SOURCE.split("const submitFlowSituationTwoStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    actions = APP_SOURCE.split('if (action === "s2-flow-continue-after-attempts")', 1)[1].split(
        'if (action === "s2-flow-discovery-continue")', 1
    )[0]
    assert 'expected: { s2_signo_relacion: "=" }' in submitter
    assert 'expected: { s2_valor_x: "40" }' in submitter
    assert 'expected: { s2_cuaderno_elegido: "Cuaderno B — $40" }' in submitter
    assert 'expected: { s2_comprobacion_igualdad: "Sí" }' in submitter
    assert "if (attempts.length >= 2) return;" in submitter
    assert "attempts.push({ answers: { ...originalAnswers }, correct: validationResult });" in submitter
    assert "attempts.length < 2" in actions


def test_situation_two_value_input_has_currency_outside_and_approved_notebooks():
    solve = APP_SOURCE.split("const flowSituationTwoSolveScreen", 1)[1].split(
        "const flowSituationTwoChooseNotebookScreen", 1
    )[0]
    notebook_catalog = APP_SOURCE.split("const SITUATION_TWO_NOTEBOOKS", 1)[1].split(
        "const flowSituationTwoData", 1
    )[0]
    assert '<span class="s2-money-field"><span>$</span><input' in solve
    assert 'type="number" inputmode="numeric" name="s2_valor_x"' in solve
    assert 'name="s2_valor_x"' in solve
    assert "Cuaderno A — $35" in notebook_catalog
    assert "Cuaderno B — $40" in notebook_catalog
    assert "Cuaderno C — $65" in notebook_catalog
    assert "cuaderno-a.png" in notebook_catalog
    assert "cuaderno-b.png" in notebook_catalog
    assert "cuaderno-c.png" in notebook_catalog


def test_situation_two_check_reward_and_updated_agenda_are_exact():
    check = APP_SOURCE.split("const flowSituationTwoCheckScreen", 1)[1].split(
        "const flowSituationTwoAgendaScreen", 1
    )[0]
    agenda = APP_SOURCE.split("const flowSituationTwoAgendaScreen", 1)[1].split(
        "const renderFlowSituationTwo", 1
    )[0]
    route = APP_SOURCE.split('if (action === "s2-flow-go-store")', 1)[1].split(
        'if (action === "s1-start")', 1
    )[0]
    assert "5(40) + 50 = 250" in check
    assert "200 + 50 = 250" in check
    assert "250 = 250" in check
    assert "¡Compra completada!" in check
    assert "puntos" not in check.lower()
    assert "porcentaje" not in check.lower()
    assert "☑" in agenda
    assert "☐" in agenda
    assert "Ya tengo los cuadernos y los colores. Ahora iré por el regalo de Eloísa." in agenda
    assert "IR A LA TIENDA" in agenda
    assert "flowSituation(3).startScreen" in route


def test_situation_three_has_three_narrative_gifts_at_the_same_price():
    catalog = APP_SOURCE.split("const SITUATION_THREE_GIFTS", 1)[1].split(
        "const flowSituationThreeData", 1
    )[0]
    screen = APP_SOURCE.split("const flowSituationThreeGiftScreen", 1)[1].split(
        "const flowSituationThreeRegisterContextScreen", 1
    )[0]
    action = APP_SOURCE.split('if (action === "s3-flow-buy-gift")', 1)[1].split(
        'if (action === "s3-flow-gift-continue")', 1
    )[0]
    assert catalog.count('Object.freeze({ value: "regalo-') == 3
    assert "SITUATION_THREE_GIFTS.map" in screen
    assert '<strong>$180</strong>' in screen
    assert "Tres regalos de $180" in screen
    assert "¡Regalo comprado!" in screen
    assert 'activityId: "s3_regalo_elegido"' in action
    assert "validationResult" not in action
    assert "fieldValidation" not in action


def test_situation_three_uses_received_amounts_and_reuses_x_without_symbol_picker():
    active_s3 = APP_SOURCE.split("const SITUATION_THREE_GIFTS", 1)[1].split(
        "const renderFlowSituation =", 1
    )[0]
    assert "Las cuatro cantidades que recibió eran iguales" in active_s3
    assert "cantidad de dinero que Tadeo recibió cada vez" in active_s3
    assert "ingresos" not in active_s3.lower()
    assert "SITUATION_TWO_SYMBOLS" not in active_s3
    assert "x + x + x + x" in active_s3
    assert "4x" in active_s3
    assert "ocho símbolos" not in active_s3.lower()


def test_situation_three_builds_expense_before_the_complete_equation():
    amounts = APP_SOURCE.split("const flowSituationThreeFourAmountsScreen", 1)[1].split(
        "const flowSituationThreeExpenseScreen", 1
    )[0]
    expense = APP_SOURCE.split("const flowSituationThreeExpenseScreen", 1)[1].split(
        "const flowSituationThreeEquationScreen", 1
    )[0]
    equation = APP_SOURCE.split("const flowSituationThreeEquationScreen", 1)[1].split(
        "const flowSituationThreeProblemInfo", 1
    )[0]
    assert "Representa las cuatro cantidades iguales que recibió Tadeo." in amounts
    assert "x + x + x + x" in amounts
    assert "s3_representacion_cuatro_cantidades" in APP_SOURCE
    assert "4x − 180" in expense
    assert "4x − 180 = 300" not in expense
    assert "¿Qué representa 4x - 180 en esta situación? Explícalo con tus palabras." in expense
    assert 'name="s3_significado_4x_menos_180"' in expense
    assert "4x − 180 = 300" in equation


def test_situation_three_open_responses_are_literal_and_not_automatically_validated():
    submitter = APP_SOURCE.split("const submitFlowSituationThreeStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    strategy = submitter.split('if (form.dataset.s3FlowForm === "strategy")', 1)[1].split(
        "const openForms", 1
    )[0]
    open_branch = submitter.split("const openForms", 1)[1].split(
        "const objectiveStages", 1
    )[0]
    assert 'activityId: "s3_estrategia_resolucion"' in strategy
    assert "validationResult" not in strategy
    assert "fieldValidation" not in strategy
    assert "queueResponseSubmission" in open_branch
    assert "validationResult" not in open_branch
    assert "fieldValidation" not in open_branch
    assert "despej" not in APP_SOURCE.split("const SITUATION_THREE_GIFTS", 1)[1].split(
        "const renderFlowSituation =", 1
    )[0].lower()


def test_situation_three_numeric_units_and_two_attempt_rules_are_exact():
    equation = APP_SOURCE.split("const flowSituationThreeEquationScreen", 1)[1].split(
        "const flowSituationThreeProblemInfo", 1
    )[0]
    solve = APP_SOURCE.split("const flowSituationThreeSolveScreen", 1)[1].split(
        "const flowSituationThreeCheckScreen", 1
    )[0]
    submitter = APP_SOURCE.split("const submitFlowSituationThreeStage", 1)[1].split(
        'document.addEventListener("submit"', 1
    )[0]
    actions = APP_SOURCE.split('if (action === "s3-flow-continue-after-attempts")', 1)[1].split(
        'if (action === "s3-flow-complete-register")', 1
    )[0]
    assert '<span class="s3-money-field"><span>$</span><input' in equation
    assert 'type="number" inputmode="numeric" name="s3_valor_lado_derecho"' in equation
    assert '<span class="s3-money-field"><span>$</span><input' in solve
    assert 'type="number" inputmode="numeric" name="s3_valor_x"' in solve
    assert 'expected: { s3_valor_lado_derecho: "300" }' in submitter
    assert 'expected: { s3_valor_x: "120" }' in submitter
    assert 'expected: { s3_comprobacion_igualdad: "Sí" }' in submitter
    assert "if (attempts.length >= 2) return;" in submitter
    assert "attempts.push({ answers: { ...originalAnswers }, correct: validationResult });" in submitter
    assert "attempts.length < 2" in actions


def test_situation_three_problem_information_preserves_drafts_without_submission():
    input_handler = APP_SOURCE.split('document.addEventListener("input"', 1)[1].split(
        'document.addEventListener("keydown"', 1
    )[0]
    info_action = APP_SOURCE.split('if (action === "s3-show-problem-info")', 1)[1].split(
        'if (action === "s3-close-problem-info")', 1
    )[0]
    assert "flowSituationThreeData().answers[field.name] = field.value" in input_handler
    assert "persistProgressCaches();" in input_handler
    assert "showModal();" in info_action
    assert "render();" not in info_action
    assert "queueResponseSubmission" not in info_action
    assert "Cuatro cantidades iguales" in APP_SOURCE
    assert "Gasto: $180" in APP_SOURCE
    assert "Dinero restante: $300" in APP_SOURCE


def test_situation_three_check_register_and_final_agenda_are_exact():
    check = APP_SOURCE.split("const flowSituationThreeCheckScreen", 1)[1].split(
        "const flowSituationThreeCompleteRegisterScreen", 1
    )[0]
    register = APP_SOURCE.split("const flowSituationThreeCompleteRegisterScreen", 1)[1].split(
        "const renderFlowSituationThree", 1
    )[0]
    agenda = APP_SOURCE.split("const renderCompletedAgenda", 1)[1].split(
        "const renderFlowClosing", 1
    )[0]
    finish = APP_SOURCE.split('if (action === "s3-flow-register-continue")', 1)[1].split(
        'if (action === "s3-flow-restart-review")', 1
    )[0]
    assert "4(120) − 180 = 300" in check
    assert "480 − 180 = 300" in check
    assert "300 = 300" in check
    assert "¿Ambos lados representan la misma cantidad?" in check
    assert "Array.from({ length: 4 }" in register
    assert 'completed ? "$120"' in register
    assert 'class="s3-register-row"' in register
    assert "s3-register-cell s3-register-entry" in register
    assert "¡Registro completado!" in register
    assert "puntos" not in register.lower()
    assert "porcentaje" not in register.lower()
    assert agenda.count("☑") == 2
    assert "☐" not in agenda
    assert "¡Listo! Ya terminé todas mis actividades de hoy." in agenda
    assert "EXPERIENCE_FLOW.screens.completedAgenda" in finish


def test_active_situation_three_does_not_restore_pet_recipe_or_scores():
    active_s3 = APP_SOURCE.split("const SITUATION_THREE_GIFTS", 1)[1].split(
        "const renderFlowSituation =", 1
    )[0].lower()
    assert "mascota" not in active_s3
    assert "perro" not in active_s3
    assert "receta" not in active_s3
    assert "puntuación" not in active_s3
    assert "calificación" not in active_s3
    assert "porcentaje de aciertos" not in active_s3


def test_situation_three_review_can_restart_without_touching_real_sessions():
    agenda = APP_SOURCE.split("const renderCompletedAgenda", 1)[1].split(
        "const renderFlowClosing", 1
    )[0]
    restart = APP_SOURCE.split('if (action === "s3-flow-restart-review")', 1)[1].split(
        'if (action === "s1-start")', 1
    )[0]
    assert "VOLVER A RECORRER LA SITUACIÓN" in agenda
    assert "isReviewMode" in agenda
    assert "!isReviewMode || reviewSituation !== 3" in restart
    assert "createDefaultFlowProgress().situationData[3]" in restart
    assert "flowSituation(3).startScreen" in restart
    assert "saveFlowProgress" not in restart


def test_review_mode_accepts_only_the_three_new_situations():
    review = APP_SOURCE.split("const requestedSituation", 1)[1].split(
        "const defaultState", 1
    )[0]
    assert "EXPERIENCE_FLOW.situations.some" in review
    assert "requestedSituation" in review


def test_new_renderer_never_routes_to_pet_or_recipe_situations():
    renderer = APP_SOURCE.split("const render = () =>", 1)[1].split(
        "const collectActiveSlice", 1
    )[0]
    assert "renderSituationTwo()" not in renderer
    assert "renderSituationFive()" not in renderer
    assert "renderFlowSituation" in renderer
    assert "renderCompletedAgenda" in renderer
    assert "renderFlowClosing" in renderer
    assert "renderFlowFinalization" in renderer


def test_completion_waits_for_sync_and_guards_double_click():
    finalizer = APP_SOURCE.split("const finalizeSession = async () =>", 1)[1].split(
        "const startSession = async", 1
    )[0]
    assert "finalFlow.screen !== EXPERIENCE_FLOW.screens.finalization" in finalizer
    assert '["syncing", "completing", "completed"].includes(finalFlow.completionStatus)' in finalizer
    assert finalizer.index("collectActiveSlice();") < finalizer.index("queueSessionCompletion(completionEventId);")
    assert finalizer.index("await flushOutbox();") < finalizer.index("queueSessionCompletion(completionEventId);")
    assert "isReviewMode" in finalizer


def test_completion_idempotence_and_literal_data_paths_remain_present():
    assert "if (!finalFlow.completionEventId) finalFlow.completionEventId = crypto.randomUUID();" in APP_SOURCE
    assert "const existing = pendingCompletionItem();" in APP_SOURCE
    assert "if (existing) return existing;" in APP_SOURCE
    assert 'literal_value: String(value ?? "")' in APP_SOURCE
    submission = APP_SOURCE.split("const queueResponseSubmission", 1)[1].split(
        "const pendingCompletionItem", 1
    )[0]
    assert "attempt_number" not in submission


def test_final_screen_has_no_score_or_legacy_results_actions():
    renderer = APP_SOURCE.split("const renderFlowFinalization = () =>", 1)[1].split(
        "const render = () =>", 1
    )[0]
    assert "¡Terminaste el recorrido de Tadeo!" in renderer
    assert "Tus respuestas han sido registradas." in renderer
    assert "questions_completed" not in renderer
    assert "discoveries" not in renderer
    assert 'data-action="restart-completed-session"' in APP_SOURCE


def test_completed_session_can_start_a_separate_full_retake():
    controls = APP_SOURCE.split("const finalScreenControls = () =>", 1)[1].split(
        "const renderFinalScreen", 1
    )[0]
    restart = APP_SOURCE.split('if (action === "restart-completed-session")', 1)[1].split(
        'if (action === "s1-restart")', 1
    )[0]
    assert "VOLVER A JUGAR" in controls
    assert "researchSession?.completedAt" in controls
    assert "isReviewMode || !researchSession?.completedAt" in restart
    assert "await startSession(code, false, true);" in restart
    assert 'setIntroPhase("presentation");' in restart
    assert "localStorage.removeItem" not in restart


def test_completed_agenda_closing_and_finalization_use_progress_not_scores():
    agenda = APP_SOURCE.split("const renderCompletedAgenda", 1)[1].split(
        "const renderFlowClosing", 1
    )[0]
    closing = APP_SOURCE.split("const renderFlowClosing", 1)[1].split(
        "const renderFlowFinalization", 1
    )[0]
    handler = APP_SOURCE.split('if (action === "open-flow-closing")', 1)[1].split(
        'if (action === "open-final-screen")', 1
    )[0]
    assert agenda.count("☑") == 2
    assert "¡Listo! Ya terminé todas mis actividades de hoy." in agenda
    assert "DÍA COMPLETADO" in closing
    assert "¡Ayudaste a Tadeo a completar todas las actividades de su agenda!" in closing
    assert "Papelería completada" in closing
    assert "Regalo completado" in closing
    assert "RECORRIDO COMPLETADO" in closing
    assert "100%" in closing
    assert "puntu" not in closing.lower()
    assert "correct" not in closing.lower()
    assert "isReviewMode" in handler


def test_active_documentation_has_three_situations_and_archives_old_designs():
    active_text = "\n".join(path.read_text(encoding="utf-8") for path in ACTIVE_DOCS)
    situations = sorted((ROOT / "tadeo_videojuego" / "02 Situaciones").glob("*.md"))
    archive = ROOT / "tadeo_videojuego" / "99 Archivo histórico"
    assert len(situations) == 3
    assert "tadeo-3situaciones-1" in active_text
    assert "31 pantallas" in active_text
    assert "Situación 2 · Alimentando a su mascota" not in active_text
    assert "Situación 5 · Ayudando con la cena" not in active_text
    assert (archive / "Situación 2 - Alimentando a su mascota.md").is_file()
    assert (archive / "Situación 5 - Ayudando con la cena.md").is_file()


def test_historical_assets_and_migrations_are_preserved():
    historical_assets = [
        ROOT / "assets" / "characters" / "perro.png",
        ROOT / "assets" / "objects" / "receta-1.png",
        ROOT / "assets" / "objects" / "receta-2.png",
        ROOT / "assets" / "scenes" / "cocina.png",
    ]
    assert all(path.is_file() for path in historical_assets)
    migrations = sorted(path.name for path in (ROOT / "alembic" / "versions").glob("*.py"))
    assert migrations == ["20260831_0001_initial.py", "20260907_0002_final_data.py"]
