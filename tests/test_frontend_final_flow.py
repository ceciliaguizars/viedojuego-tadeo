from pathlib import Path


APP_SOURCE = (Path(__file__).parents[1] / "js" / "app.js").read_text(encoding="utf-8")


def test_screen_53_opens_54_only_outside_review():
    assert 'data-action="open-final-narrative">CONTINUAR' in APP_SOURCE
    assert '${isReviewMode ? "" :' in APP_SOURCE
    assert 'if (action === "open-final-narrative")' in APP_SOURCE
    assert "if (isReviewMode || situationFiveProgress.stage !== 11) return;" in APP_SOURCE
    assert "finalFlow.screen = 54;" in APP_SOURCE


def test_screen_54_has_exact_narrative_and_advances_without_a_response():
    assert "Después de completar todas sus actividades, Tadeo revisa su agenda y se da cuenta de que logró terminar todo lo que tenía pendiente." in APP_SOURCE
    assert "Durante el día tuvo que analizar diferentes situaciones, representar cantidades desconocidas y encontrar formas de resolverlas." in APP_SOURCE
    assert 'data-action="open-final-screen">CONTINUAR' in APP_SOURCE
    handler = APP_SOURCE.split('if (action === "open-final-screen")', 1)[1].split(
        'if (action === "retry-final-sync")', 1
    )[0]
    assert "finalFlow.screen = 55;" in handler
    assert "queueResponseSubmission" not in handler


def test_final_progress_snapshot_covers_screens_54_and_55_and_stable_uuid():
    assert "if (!isReviewMode && finalFlow.screen >= 54) return Math.min(55, finalFlow.screen);" in APP_SOURCE
    assert "current_screen: finalFlow.screen" in APP_SOURCE
    assert "completion_event_id: finalFlow.completionEventId" in APP_SOURCE
    assert "completion_status: finalFlow.completionStatus" in APP_SOURCE
    assert "if (!finalFlow.completionEventId) finalFlow.completionEventId = crypto.randomUUID();" in APP_SOURCE
    assert "if (queuedCompletionId) finalFlow.completionEventId = queuedCompletionId;" in APP_SOURCE


def test_screen_55_has_exact_copy_and_no_legacy_results_actions():
    final_renderer = APP_SOURCE.split("const renderFinalScreen = () =>", 1)[1].split(
        "const renderSituationFive = () =>", 1
    )[0]
    assert "¡Terminaste el recorrido de Tadeo!" in final_renderer
    assert "Tus respuestas han sido registradas." in final_renderer
    assert "calificación" not in final_renderer
    assert "questions_completed" not in final_renderer
    assert "discoveries" not in final_renderer
    assert "reset" not in final_renderer


def test_completion_waits_for_sync_and_guards_double_click():
    finalizer = APP_SOURCE.split("const finalizeSession = async () =>", 1)[1].split(
        "const startSession = async", 1
    )[0]
    assert '["syncing", "completing", "completed"].includes(finalFlow.completionStatus)' in finalizer
    assert finalizer.index("collectActiveSlice();") < finalizer.index("queueSessionCompletion(completionEventId);")
    assert finalizer.index("await flushOutbox();") < finalizer.index("queueSessionCompletion(completionEventId);")
    assert 'setFinalFlowStatus("completing")' in finalizer


def test_completion_failure_retries_same_event_and_reload_keeps_pending_complete():
    assert "No fue posible confirmar el registro todavía. Intenta nuevamente." in APP_SOURCE
    assert "REINTENTAR FINALIZACIÓN" in APP_SOURCE
    assert "const existing = pendingCompletionItem();" in APP_SOURCE
    assert "if (existing) return existing;" in APP_SOURCE
    restore = APP_SOURCE.split("const restoreFinalScreenState = async () =>", 1)[1].split(
        "const finalizeSession = async", 1
    )[0]
    assert "if (pendingCompletionItem())" in restore
    assert 'setFinalFlowStatus("error", "complete")' in restore


def test_completion_ack_stops_activity_and_reload_recovers_completed_state():
    assert "researchSession.completedAt = result.state.completed_at;" in APP_SOURCE
    assert 'finalFlow.completionStatus = "completed";' in APP_SOURCE
    assert "activeStartedAt = null;" in APP_SOURCE
    assert "!researchSession?.completedAt" in APP_SOURCE
    assert "!researchSession.completedAt" in APP_SOURCE
    assert "if (researchSession.completedAt)" in APP_SOURCE


def test_review_cannot_complete_and_v2_final_flow_precedes_legacy_finish():
    finalizer = APP_SOURCE.split("const finalizeSession = async () =>", 1)[1].split(
        "const startSession = async", 1
    )[0]
    assert "isReviewMode" in finalizer
    render = APP_SOURCE.split("const render = () =>", 1)[1].split(
        "const collectActiveSlice", 1
    )[0]
    assert render.index("finalFlow.screen === 54") < render.index("renderFinish()")
    assert render.index("finalFlow.screen >= 55") < render.index("renderFinish()")
    assert "state.currentScene >= scenes.length && researchSession.experienceVersion !== EXPERIENCE_VERSION" in render
    assert "screen = 56" not in APP_SOURCE
