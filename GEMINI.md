# Reglas del proyecto

## Objetivo general

Mantener una arquitectura simple, clara y fácil de seguir para cualquier desarrollador nuevo.

Evitar sobreingeniería y soluciones innecesariamente complejas.

---

# Arquitectura

* Mantener la estructura actual del proyecto.
* No agregar Redux, Zustand, Context API extra ni Providers innecesarios.
* Mantener la lógica principal en componentes padre o contenedores.
* Los componentes hijos deben trabajar mediante props y callbacks.
* No mover lógica importante a lugares ocultos o difíciles de rastrear.
* Mantener separación clara entre frontend, backend, servicios y modelos.

---

# Código

* No modificar código funcional inneariamente.
* Hacer cambios mínimos y seguros.
* Mantener comentarios claros y organizados por secciones.
* Escribir código fácil de entender para principiantes.
* Evitar abstracciones excesivas.
* Priorizar legibilidad sobre complejidad.

---

# Frontend

* Mantener componentes reutilizables.
* Evitar renders innecesarios.
* Evitar llamadas duplicadas al backend.
* Optimizar consultas y carga de datos.
* Mantener el flujo de datos fácil de seguir.
* Preferir hooks locales antes que estados globales.

---

# Backend

* Mantener endpoints simples y claros.
* Evitar consultas innecesarias a la base de datos.
* Mantener separación entre rutas, controladores y servicios.
* Optimizar consultas frecuentes.
* Mantener nombres descriptivos y consistentes.

---

# Estilo de respuestas del agente

Cuando propongas cambios:

* Explica primero qué problema solucionas.
* No reestructures todo el proyecto innecesariamente.
* Respeta el código existente.
* Mantén compatibilidad con la arquitectura actual.