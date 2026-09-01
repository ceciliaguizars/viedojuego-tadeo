from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ValidationResult:
    correct: bool
    hint: str = ""


def _value(answers: dict[str, Any], key: str) -> str:
    value = answers.get(key, "")
    return str(value).strip()


def normalize_equation(value: str) -> str:
    return (
        value.lower()
        .replace(" ", "")
        .replace("·", "")
        .replace("*", "")
        .replace("×", "")
        .replace("$", "")
        .replace("−", "-")
    )


STEP_COUNTS = (3, 4, 4, 5, 5)
TOTAL_QUESTIONS = sum(STEP_COUNTS)


def _number(answers: dict[str, Any], key: str, expected: int) -> bool:
    return _value(answers, key) == str(expected)


def _equation(answers: dict[str, Any], key: str, accepted: set[str]) -> bool:
    return normalize_equation(_value(answers, key)) in accepted


def validate_question(scene_index: int, step_index: int, answers: dict[str, Any]) -> ValidationResult:
    question = (scene_index, step_index)

    if question == (0, 0):
        if not _number(answers, "total", 120): return ValidationResult(False, "Revisa el reloj: Tadeo dispone de 120 minutos en total.")
        if not _number(answers, "activities", 4): return ValidationResult(False, "Cuenta las actividades anotadas en la agenda: son cuatro.")
    elif question == (0, 1):
        if not _number(answers, "minutes", 30): return ValidationResult(False, "Pista: busca cuatro cantidades iguales que, al sumarse, den 120.")
    elif question == (0, 2):
        if _value(answers, "leftMeaning") != "activities": return ValidationResult(False, "El lado izquierdo reúne cuatro bloques iguales de tiempo, uno por actividad.")
        if _value(answers, "rightMeaning") != "total": return ValidationResult(False, "El número a la derecha representa todos los minutos disponibles.")
        if _value(answers, "reason") != "same": return ValidationResult(False, "Suma los cuatro 30: los dos lados deben representar la misma cantidad.")

    elif question == (1, 0):
        if not _number(answers, "totalFood", 900): return ValidationResult(False, "La bolsa nueva contiene 900 gramos.")
        if not _number(answers, "dailyFood", 300): return ValidationResult(False, "Las indicaciones señalan 300 gramos de alimento al día.")
        if _value(answers, "unknown") != "days": return ValidationResult(False, "Tadeo ya conoce los gramos; necesita descubrir cuántos días durarán.")
    elif question == (1, 1):
        if not _number(answers, "days", 3): return ValidationResult(False, "Pista: ¿cuántos grupos de 300 g caben en 900 g?")
        if not _equation(answers, "repeatedSum", {"300+300+300=900", "900=300+300+300"}): return ValidationResult(False, "Escribe tres veces 300 a un lado y el total de 900 al otro.")
    elif question == (1, 2):
        if not _value(answers, "symbol"): return ValidationResult(False, "Elige una letra o un símbolo para la cantidad desconocida.")
        if _value(answers, "symbolMeaning") != "days": return ValidationResult(False, "El símbolo sustituye la cantidad que al principio no conocíamos: los días.")
    elif question == (1, 3):
        if not _number(answers, "buyDay", 2): return ValidationResult(False, "Resta un día a los 3 días que dura la bolsa.")

    elif question == (2, 0):
        if not _number(answers, "notebookCount", 5): return ValidationResult(False, "La lista de la hermana de Tadeo pide 5 cuadernos iguales.")
        if not _number(answers, "colorsPrice", 45): return ValidationResult(False, "La caja de colores tiene un precio conocido de $45.")
        if _value(answers, "unknown") != "notebookPrice": return ValidationResult(False, "Ya conocemos el costo de los colores y el presupuesto; falta elegir el precio de cada cuaderno.")
    elif question == (2, 1):
        if not _equation(answers, "notebooksExpression", {"5x", "x+x+x+x+x"}): return ValidationResult(False, "Cinco cuadernos del mismo precio se representan como x + x + x + x + x, o de forma breve como 5x.")
        if not _equation(answers, "equation", {"5x+45=195", "45+5x=195", "195=5x+45", "195=45+5x"}): return ValidationResult(False, "Suma los $45 de los colores al costo de los cinco cuadernos e iguálalo con $195.")
    elif question == (2, 2):
        if _value(answers, "notebook") != "30": return ValidationResult(False, "Sustituye x por cada precio. ¿Con cuál obtienes exactamente $195?")
        if not _number(answers, "price", 30): return ValidationResult(False, "Resta primero $45 a $195 y reparte el resultado entre los 5 cuadernos.")
    elif question == (2, 3):
        if not _number(answers, "total", 195): return ValidationResult(False, "Calcula 5 × 30 y después suma los $45 de los colores.")
        if _value(answers, "isEqual") != "yes": return ValidationResult(False, "El costo calculado y el dinero disponible son $195; por eso la igualdad sí se mantiene.")

    elif question == (3, 0):
        if not _value(answers, "gift"): return ValidationResult(False, "Elige cualquiera de los tres regalos; todos cuestan lo mismo.")
        if _value(answers, "unknown") != "income": return ValidationResult(False, "Ya conocemos el gasto y el dinero restante; falta saber de cuánto fue cada ingreso.")
    elif question == (3, 1):
        if not _equation(answers, "equation", {"4x-180=300", "300=4x-180"}): return ValidationResult(False, "Cuatro ingresos iguales forman 4x; después resta el gasto de $180 y obtén los $300 restantes.")
    elif question == (3, 2):
        if _value(answers, "fourX") != "incomes": return ValidationResult(False, "Como x es un ingreso, 4x reúne los cuatro ingresos iguales.")
        if _value(answers, "expense") != "gift": return ValidationResult(False, "El signo menos indica el dinero que salió para pagar el regalo.")
        if _value(answers, "remaining") != "money": return ValidationResult(False, "Los $300 son el resultado después de restar el gasto.")
    elif question == (3, 3):
        if not _number(answers, "beforeExpense", 480): return ValidationResult(False, "Suma el gasto de $180 a los $300 que quedaron.")
        if not _number(answers, "income", 120): return ValidationResult(False, "Reparte los $480 entre los cuatro ingresos iguales.")
    elif question == (3, 4):
        if not _number(answers, "checkTotal", 300): return ValidationResult(False, "Multiplica 4 × 120 y resta los $180 del regalo.")
        if _value(answers, "isEqual") != "yes": return ValidationResult(False, "El resultado calculado es el mismo dinero restante de la historia: $300.")

    elif question == (4, 0):
        if not _number(answers, "recipeOne", 150): return ValidationResult(False, "La receta 1 utiliza 150 g de carne por porción.")
        if not _number(answers, "recipeTwo", 100): return ValidationResult(False, "La receta 2 utiliza 100 g de carne por porción.")
        if _value(answers, "unknown") != "portions": return ValidationResult(False, "Buscamos para cuántas porciones coinciden los totales; esa cantidad es x.")
    elif question == (4, 1):
        if not _equation(answers, "expressionOne", {"150x+100", "100+150x"}): return ValidationResult(False, "Para la receta 1 son 150 g por cada una de x porciones, más 100 g de guarnición.")
        if not _equation(answers, "expressionTwo", {"100x+300", "300+100x"}): return ValidationResult(False, "Para la receta 2 son 100 g por cada una de x porciones, más 300 g de guarnición.")
    elif question == (4, 2):
        if not _equation(answers, "equation", {"150x+100=100x+300", "100x+300=150x+100"}): return ValidationResult(False, "Coloca un total a cada lado del signo igual.")
        if _value(answers, "equalMeaning") != "same": return ValidationResult(False, "El signo igual indica que ambos lados representan la misma cantidad total.")
    elif question == (4, 3):
        if not _number(answers, "portions", 4): return ValidationResult(False, "Resta 100x en ambos lados y después resta 100: quedará 50x = 200.")
    elif question == (4, 4):
        if not _number(answers, "totalOne", 700): return ValidationResult(False, "Para la receta 1 calcula 150 × 4 + 100.")
        if not _number(answers, "totalTwo", 700): return ValidationResult(False, "Para la receta 2 calcula 100 × 4 + 300.")
        if not _value(answers, "recipe"): return ValidationResult(False, "Las dos recetas usan 700 g; puedes elegir cualquiera.")
    else:
        raise ValueError("Pregunta inexistente")

    return ValidationResult(True)
