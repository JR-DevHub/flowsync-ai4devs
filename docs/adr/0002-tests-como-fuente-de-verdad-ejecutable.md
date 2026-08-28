# 2. Los tests de integración son la única fuente de verdad ejecutable

## Contexto

El [ADR 0001](0001-openspec-como-fuente-de-verdad.md) hizo de `openspec/specs/` la fuente de verdad viva del producto, y en sus consecuencias anotó el riesgo que ha acabado decidiendo este cambio:

> **Nada obliga a que la spec y el código coincidan.** […] Una spec que nadie ejecuta es documentación con mejor formato, no una red.

Ese riesgo no se materializó como accidente aislado, sino como el modo normal de funcionamiento. El precedente ya estaba en el propio ADR 0001: el commit `2ccf2c1` cambió el validador del filtro de la lista de `vine.enum(TASK_STATUSES)` a `vine.string()` y dejó falsos tres scenarios del requisito *Un estado que no existe se rechaza, no se responde vacío* sin que nada fallara. Ni el lint, ni el typecheck, ni los tests, ni `openspec validate --all --strict`, que comprueba la forma de las specs y no su correspondencia con el código. Se descubrió leyendo, meses después, y solo porque alguien contrastó a mano el documento OpenAPI contra la spec.

La asimetría que ese episodio dejó a la vista es la que sostiene esta decisión: **la deriva que un test cubre es imposible; la que solo cubre una spec es invisible hasta que alguien lee**. Un año de mantener las dos cosas ha confirmado cuál de las dos avisa.

Los otros costes que el ADR 0001 ya había anotado tampoco han mejorado por sí solos:

- La spec viva y sus cambios archivados suman un volumen que hay que mantener a mano y que solo envejece: 169 scenarios repartidos entre `auth` (45) y `tasks` (124), más los artefactos de los cambios archivados.
- La fusión de una delta en la spec viva es una edición en prosa, no un merge mecánico, así que puede integrar mal un requisito sin que nada chirríe.
- Escribir la delta después del código —que es lo que ocurrió en `add-task-status-filter`— convierte la spec en un espejo del código y le quita el único valor que la hacía distinta de él: ser una comprobación independiente.

Mientras tanto, la suite ha crecido en la dirección contraria. Arrancó cubriendo solo `auth`, y hoy hay tests de integración de las dos capabilities, en dos suites declaradas en `adonisrc.ts` (`functional`, 30 s; `unit`, 2 s), que corren contra la API real con el cliente tipado de Japa. Y esos tests ya citan la spec: `tests/functional/tasks/assignee.spec.ts` dice en su cabecera qué requisito cubre y de qué scenarios se hace cargo. Es decir, el puente entre ambos mundos ya está construido; lo que se decide ahora es cuál de las dos orillas sostiene el peso.

## Decisión

**Los tests de integración pasan a ser la única fuente de verdad ejecutable de FlowSync.** Un comportamiento que ningún test ejerce no es un requisito: es una intención.

En concreto:

- **Todo cambio de comportamiento entra con su test, en el mismo commit que el código.** El test es la unidad que declara el contrato; si el contrato cambia, cambia el test, y ese diff es lo que se revisa.
- **`openspec/specs/` se congela.** No se borra y no se actualiza: queda como registro histórico de lo que se creía y se quería, exactamente el papel al que el ADR 0001 relegó al PRD y al backlog. Quien quiera saber qué hace el sistema hoy lee los tests. La CLI `openspec` y las skills `/opsx:*` dejan de formar parte del flujo de trabajo.
- **Los tests se escriben para ser leídos como especificación.** Se mantiene lo que la suite ya hace: nombres en la lengua del producto, una cabecera que dice qué comportamiento se cubre y por qué, y mensajes de aserción que explican qué se ha roto. Un test cuyo fallo no se entienda sin abrir el código no cumple su función aquí.
- **El porqué se traslada a los ADR y a los mensajes de commit.** Es lo único que un test no puede llevar dentro, y el hueco que deja el fin de los `design.md` hay que llenarlo a conciencia: las alternativas descartadas y los trade-offs se escriben en el cuerpo del commit que introduce el comportamiento.
- **El contrato externo lo publica el documento OpenAPI**, generado desde los decoradores de los controladores y por tanto atado al código. Los tests que ejercen cada endpoint son lo que impide que ese documento mienta.
- **El frontend necesita runner.** Sin él, la mitad del producto se queda sin fuente de verdad de ninguna clase, porque la spec que hoy la cubría deja de mantenerse. Montarlo es condición de esta decisión, no una mejora posterior.

## Estado

**Aceptada** (2027-08-28). Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md), cuya decisión queda sin efecto a partir de esta fecha.

## Consecuencias

### Lo que ganamos

- **La deriva deja de ser posible en lo cubierto.** Es el motivo entero de la decisión: el caso `2ccf2c1` habría fallado en rojo en el mismo commit en lugar de sobrevivir meses.
- **Se acaba la doble contabilidad.** Un cambio de comportamiento se escribe una vez, no dos, y desaparece el paso de traducir un scenario a un test.
- **La verdad se ejecuta en cada PR**, sin depender de que nadie se acuerde de archivar un cambio ni de que una fusión en prosa esté bien hecha.
- **Una dependencia externa menos.** La CLI `openspec`, que ningún manifiesto del repositorio declaraba, deja de ser necesaria para saber qué hace el producto.

### Lo que nos cuesta

- **Perdemos el porqué como género.** Un test dice qué ocurre; no dice por qué se decidió así, qué alternativa se descartó ni a cambio de qué. Los `design.md` archivados guardan cosas que ningún test podrá expresar: por qué `DEFAULT_LIST_STATUSES` se escribe entera en vez de derivarse como `TASK_STATUSES` menos `done`, o por qué se resolvió a favor de `CA-9` frente a `CA-17`. Trasladarlo a los commits es un plan, no una garantía: los commits no se releen.
- **Los requisitos negativos se quedan sin registro.** Un test no puede demostrar la ausencia de una funcionalidad. *No hay lista personal*, *El catálogo de estados no se toca*, *Sin señales de presencia*, *La lista no adelanta el vencimiento*: son requisitos de que algo **no** exista, y son exactamente los que impiden que el producto se convierta en otro. Al congelar la spec dejan de estar escritos en ninguna parte viva, y nada avisará cuando alguien los incumpla añadiendo una funcionalidad.
- **Los requisitos de interfaz y de accesibilidad son los que peor sobreviven.** *La señal no es solo un color*, *Sin ratón*, *Una lista sin filas no significa siempre lo mismo* con sus cuatro finales distintos: cubrirlos exige un runner de frontend y utillaje de accesibilidad que hoy no existen. Hasta que existan, esa parte del producto no tiene fuente de verdad de ningún tipo, y esta decisión la habrá empeorado en vez de mejorarla.
- **La migración es cara y la mayor parte no se hará.** Hay 169 scenarios escritos y una suite de 27 tests. Traducir todo lo traducible es un trabajo largo; lo que no se traduzca no queda pendiente, queda perdido, porque la spec que lo sostenía ya no se mantiene. Conviene decidir y anotar qué se acepta perder, en lugar de descubrirlo por ausencia.
- **Un test describe lo que el sistema hace, no lo que debe hacer.** Es la pérdida conceptual más seria: la spec era independiente del código y podía contradecirlo —que es justo lo que la hacía útil al contrastar el documento OpenAPI—, mientras que un test se escribe mirando la implementación. Un comportamiento equivocado con test verde se convierte en el contrato, y ya no hay ningún artefacto desde el que discutirlo.
- **La fuente de verdad deja de ser legible para producto.** Nadie de negocio va a abrir `status_filter.spec.ts` para saber qué hace el filtro. Se pierde el lenguaje común que los `WHEN`/`THEN` daban a quien no programa, y con él la posibilidad de que alguien de fuera del equipo detecte que lo especificado no es lo que se quería.
- **Verde no significa especificado.** Una suite en verde invita a creer que el contrato está completo cuando solo dice que lo escrito pasa. Es un fallo silencioso del mismo género que el que esta decisión viene a arreglar, y sin la spec al lado no hay forma barata de medir el hueco.
- **El mantenimiento no desaparece, cambia de sitio.** Los tests de integración pegan contra la base real y envejecen mal: fixtures, aislamiento, casos frágiles. Lo que antes costaba prosa desactualizada ahora cuesta suite lenta y tests que se tocan por motivos que no son cambios de contrato.
- **Se pierde el diff que declaraba la ruptura.** Una cabecera `MODIFIED` sobre un requisito existente se leía en revisión como lo que era: «esto que prometíamos deja de ser cierto». Un test modificado no se lee así de bien, y borrar una aserción es más fácil de colar en una revisión que borrar un requisito.
