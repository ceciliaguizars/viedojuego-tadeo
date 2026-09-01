---
tags:
  - brief
  - proyecto
  - didactica
estado: vigente
---

# Brief del proyecto

[[Bienvenido|← Volver al inicio]]

## Descripción general

Videojuego educativo narrativo para apoyar la introducción a las ecuaciones de primer grado con una incógnita en estudiantes de secundaria de 12 a 13 años. El jugador acompaña a Tadeo durante una tarde y resuelve situaciones cotidianas de complejidad progresiva.

## Objetivos didácticos

- Reconocer cantidades conocidas y desconocidas.
- Comprender el signo igual como relación de equivalencia.
- Representar una incógnita mediante letras o símbolos.
- Traducir situaciones cotidianas a expresiones algebraicas.
- Construir y resolver ecuaciones de primer grado.
- Comprobar e interpretar una solución en su contexto.
- Explicar el procedimiento empleado.

El diseño se vincula con el Enfoque Ontosemiótico, el aprendizaje significativo y las orientaciones de la Nueva Escuela Mexicana.

## Experiencia

- Recorrido lineal y guiado.
- Escenarios como fondos estáticos; personajes y objetos como sprites independientes.
- Cada situación se divide en preguntas breves que cubren exploración, representación, resolución, comprobación e interpretación.
- Diálogos, selecciones, campos numéricos y algebraicos, y retroalimentación mediante interfaces.
- El avance se habilita solamente después de responder correctamente la pregunta actual.
- Progreso representado por la agenda, no por puntos o recompensas externas.
- Intervención didáctica acompañada por una hoja de trabajo.

## Sistema “Mis descubrimientos”

Al completar la última pregunta de cada situación se desbloquea una tarjeta con:

1. Definición breve.
2. Ejemplo relacionado con la situación.
3. Formalización del concepto trabajado.

El botón **Mis descubrimientos** debe estar disponible durante toda la experiencia.

## Retroalimentación

- Evitar mensajes aislados de “correcto” o “incorrecto”.
- Ante un error, ofrecer una pista relacionada con el significado de los datos.
- Permitir volver a intentarlo sin pérdida de puntos.
- Confirmar cada acierto antes de habilitar la siguiente pregunta.
- Mostrar la formalización matemática al completar el reto.

## Identidad visual

- Pixel art limpio y detallado.
- Perspectiva ligeramente elevada e iluminación cálida.
- Estética juvenil para estudiantes de 12 a 13 años.
- Escenarios domésticos y comerciales acogedores.
- Interfaz clara, legible y sin saturación visual.

## Personajes y escenarios

**Personajes:** Tadeo, su mamá, encargado de la papelería, encargada de la tienda de regalos y perro de Tadeo.

**Escenarios:** habitación, patio, mini mundo exterior, papelería, tienda de regalos y cocina.

## Alcance técnico de la primera versión

HTML, CSS y JavaScript, ejecutables directamente en navegador. La primera versión permite completar la historia de principio a fin mediante 21 etapas, validar respuestas, conservar la pregunta actual, actualizar la agenda, mostrar retroalimentación y desbloquear descubrimientos.

Fuera de alcance: movimiento libre, mapas interactivos, combates, puntos, cuentas personales con nombre, correo o contraseña, y multijugador. La base PostgreSQL identifica a cada participante únicamente mediante un folio anónimo.

## Cierre

> ¡Todas las actividades están completas!  
> Tadeo terminó todo lo que tenía pendiente para hoy. Después de cenar con su familia, guarda su agenda y se prepara para dormir.

## Registro de la aplicación

La implementación utiliza folios anónimos y PostgreSQL para conservar respuestas, intentos, progreso y tiempos. Las definiciones de las métricas, medidas de privacidad y operación del panel se documentan en [[03 Diseño/Registro de usuarios y estadísticas|Registro de usuarios y estadísticas]].
