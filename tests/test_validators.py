from __future__ import annotations

import pytest

from backend.validators import TOTAL_QUESTIONS, validate_question


CORRECT_ANSWERS = {
    (0, 0): {"total": "120", "activities": "4"},
    (0, 1): {"minutes": "30"},
    (0, 2): {"leftMeaning": "activities", "rightMeaning": "total", "reason": "same"},
    (1, 0): {"totalFood": "900", "dailyFood": "300", "unknown": "days"},
    (1, 1): {"days": "3", "repeatedSum": "300 + 300 + 300 = 900"},
    (1, 2): {"symbol": "△", "symbolMeaning": "days"},
    (1, 3): {"buyDay": "2"},
    (2, 0): {"notebookCount": "5", "colorsPrice": "45", "unknown": "notebookPrice"},
    (2, 1): {"notebooksExpression": "5x", "equation": "5x + $45 = 195"},
    (2, 2): {"notebook": "30", "price": "30"},
    (2, 3): {"total": "195", "isEqual": "yes"},
    (3, 0): {"gift": "peluche", "unknown": "income"},
    (3, 1): {"equation": "4x − 180 = 300"},
    (3, 2): {"fourX": "incomes", "expense": "gift", "remaining": "money"},
    (3, 3): {"beforeExpense": "480", "income": "120"},
    (3, 4): {"checkTotal": "300", "isEqual": "yes"},
    (4, 0): {"recipeOne": "150", "recipeTwo": "100", "unknown": "portions"},
    (4, 1): {"expressionOne": "150x + 100", "expressionTwo": "100x + 300"},
    (4, 2): {"equation": "150x + 100 = 100x + 300", "equalMeaning": "same"},
    (4, 3): {"portions": "4"},
    (4, 4): {"totalOne": "700", "totalTwo": "700", "recipe": "2"},
}


@pytest.mark.parametrize(("question", "answers"), CORRECT_ANSWERS.items())
def test_all_questions_accept_the_expected_answers(question, answers):
    assert validate_question(*question, answers).correct is True


@pytest.mark.parametrize("question", CORRECT_ANSWERS)
def test_all_questions_reject_empty_answers_with_a_hint(question):
    result = validate_question(*question, {})
    assert result.correct is False
    assert result.hint


def test_question_count_matches_contract():
    assert len(CORRECT_ANSWERS) == TOTAL_QUESTIONS == 21

