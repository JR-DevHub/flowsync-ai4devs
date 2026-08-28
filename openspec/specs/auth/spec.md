# Cuentas y acceso

## Purpose

Permitir que una persona cree su cuenta en FlowSync, entre con ella y salga cuando quiera, y que la aplicación sepa en todo momento quién está usándola. Cubre el registro, el inicio y el cierre de sesión, la persistencia de esa sesión entre recargas y la consulta del propio perfil.

## Requirements

### Requirement: Registro de una cuenta nueva

El sistema SHALL permitir crear una cuenta a partir de un email y una contraseña y, en el mismo paso, dejar la sesión ya iniciada, devolviendo un token de acceso junto con los datos públicos de la cuenta recién creada.

#### Scenario: Alta con datos válidos

- **WHEN** se envía `POST /api/v1/auth/signup` con un email libre, una contraseña de entre 8 y 32 caracteres y su confirmación idéntica
- **THEN** la respuesta es `200` y contiene un token de acceso y los datos públicos del nuevo usuario, sin necesidad de un inicio de sesión posterior

#### Scenario: El nombre completo es opcional pero debe enviarse

- **WHEN** se envía el registro con el nombre completo explícitamente vacío (`null`)
- **THEN** la cuenta se crea igualmente y el nombre queda sin rellenar

#### Scenario: Falta el dato del nombre completo

- **WHEN** se envía el registro sin incluir el nombre completo entre los datos
- **THEN** la respuesta es `422` y señala ese campo como obligatorio, aunque su valor pueda ser vacío

### Requirement: Un email solo puede tener una cuenta

El sistema SHALL rechazar el registro cuando el email ya pertenece a otra cuenta, indicando qué campo es el que falla.

#### Scenario: Email ya registrado

- **WHEN** se intenta registrar un email que ya tiene cuenta
- **THEN** la respuesta es `422`, el error apunta al campo del email y no se crea ninguna cuenta nueva

#### Scenario: El email se compara tal cual se escribe

- **WHEN** se registra un email que solo difiere de uno ya existente en el uso de mayúsculas
- **THEN** el registro se acepta y quedan dos cuentas distintas, porque el email no se normaliza antes de compararse

### Requirement: Reglas de la contraseña al registrarse

El sistema SHALL exigir una contraseña de entre 8 y 32 caracteres y una confirmación idéntica, y SHALL rechazar el registro cuando no se cumpla, sin crear la cuenta.

#### Scenario: Contraseña demasiado corta o demasiado larga

- **WHEN** se envía el registro con una contraseña de menos de 8 o de más de 32 caracteres
- **THEN** la respuesta es `422`, el error indica el límite incumplido y no se crea la cuenta

#### Scenario: La confirmación no coincide

- **WHEN** se envía el registro con una confirmación distinta de la contraseña
- **THEN** la respuesta es `422` y el error apunta al campo de la confirmación

### Requirement: Formato del email

El sistema SHALL aceptar como email únicamente una dirección con formato válido y de como mucho 254 caracteres, tanto al registrarse como al iniciar sesión.

#### Scenario: Email con formato inválido

- **WHEN** se envía un registro o un inicio de sesión con un email que no tiene forma de dirección de correo
- **THEN** la respuesta es `422` y el error apunta al campo del email

### Requirement: Inicio de sesión

El sistema SHALL entregar un token de acceso junto con los datos públicos de la cuenta cuando el email y la contraseña enviados correspondan a una cuenta existente.

#### Scenario: Credenciales correctas

- **WHEN** se envía `POST /api/v1/auth/login` con el email y la contraseña de una cuenta existente
- **THEN** la respuesta es `200` e incluye un token de acceso nuevo y los datos públicos de esa cuenta

### Requirement: Credenciales inválidas indistinguibles

El sistema SHALL responder exactamente lo mismo cuando el email no corresponde a ninguna cuenta y cuando la contraseña es incorrecta, de modo que no se pueda averiguar desde fuera qué emails están registrados.

#### Scenario: Contraseña incorrecta

- **WHEN** se envía un inicio de sesión con un email registrado y una contraseña que no es la suya
- **THEN** la respuesta es `400` con un error genérico de credenciales inválidas, sin decir cuál de los dos datos falla

#### Scenario: Email no registrado

- **WHEN** se envía un inicio de sesión con un email que no tiene cuenta
- **THEN** la respuesta es `400` con exactamente el mismo error genérico que en el caso de la contraseña incorrecta

### Requirement: El acceso al perfil exige una sesión válida

El sistema SHALL devolver los datos públicos de la cuenta a quien presente un token de acceso vigente, y SHALL denegar el acceso a quien no lo presente o presente uno que no sirva.

#### Scenario: Consulta con token vigente

- **WHEN** se envía `GET /api/v1/account/profile` con el token de acceso en la cabecera `Authorization` como `Bearer`
- **THEN** la respuesta es `200` con los datos públicos de la cuenta dueña de ese token

#### Scenario: Consulta sin token

- **WHEN** se envía la misma petición sin cabecera de autorización
- **THEN** la respuesta es `401` y no se revela ningún dato de ninguna cuenta

#### Scenario: Consulta con un token que no vale

- **WHEN** se envía la petición con un token inventado, manipulado o ya invalidado
- **THEN** la respuesta es `401` y no se revela ningún dato de ninguna cuenta

### Requirement: Cierre de sesión

El sistema SHALL invalidar de forma permanente el token con el que se pide el cierre de sesión, dejando intactas las demás sesiones abiertas de esa misma cuenta.

#### Scenario: Cierre de sesión con token vigente

- **WHEN** se envía `POST /api/v1/account/logout` con un token de acceso vigente
- **THEN** la respuesta es `200` con un mensaje de confirmación y ese token deja de servir para cualquier petición posterior

#### Scenario: Las demás sesiones sobreviven

- **WHEN** una cuenta tiene varias sesiones abiertas y se cierra una de ellas
- **THEN** los tokens de las demás siguen dando acceso al perfil con normalidad

#### Scenario: Cierre de sesión sin sesión

- **WHEN** se envía el cierre de sesión sin token o con uno que ya no vale
- **THEN** la respuesta es `401`

### Requirement: Datos públicos de una cuenta

El sistema SHALL exponer de cada cuenta su identificador, su email, su nombre completo (que puede estar vacío), sus iniciales, y las fechas de creación y de última modificación. El sistema SHALL NOT exponer nunca la contraseña, ni en claro ni cifrada, en ninguna respuesta.

#### Scenario: Forma de los datos devueltos

- **WHEN** cualquier respuesta incluye los datos de una cuenta (registro, inicio de sesión o consulta del perfil)
- **THEN** contiene identificador, email, nombre completo, iniciales y fechas de creación y modificación, y ningún campo relacionado con la contraseña

#### Scenario: Iniciales a partir del nombre

- **WHEN** la cuenta tiene un nombre completo de dos o más palabras
- **THEN** sus iniciales son la primera letra de las dos primeras palabras, en mayúsculas

#### Scenario: Iniciales con un nombre de una sola palabra

- **WHEN** la cuenta tiene un nombre completo de una única palabra
- **THEN** sus iniciales son las dos primeras letras de esa palabra, en mayúsculas

#### Scenario: Iniciales cuando no hay nombre

- **WHEN** la cuenta no tiene nombre completo
- **THEN** sus iniciales se derivan del email en su lugar, de modo que siempre hay algo que mostrar

### Requirement: Formato uniforme de las respuestas

El sistema SHALL responder siempre en JSON, envolver los datos de las respuestas correctas bajo una clave `data`, y describir los fallos de validación como una lista de errores en la que cada uno indica el campo y la regla incumplidos.

#### Scenario: Respuesta correcta

- **WHEN** una petición de registro, inicio de sesión o consulta de perfil se resuelve con éxito
- **THEN** el cuerpo es un JSON con los datos bajo la clave `data`

#### Scenario: Respuesta de validación fallida

- **WHEN** una petición se rechaza por validación
- **THEN** el cuerpo es un JSON con una lista `errors` en la que cada entrada lleva su mensaje, el campo afectado y la regla incumplida, de forma que se pueda colocar cada error bajo su campo

#### Scenario: Petición desde un navegador servida en otro origen

- **WHEN** el frontend, servido en un origen distinto, llama a la API durante el desarrollo
- **THEN** la llamada se permite, incluida la cabecera de autorización

### Requirement: Pantalla de registro

La aplicación SHALL ofrecer una pantalla de registro con campos para nombre completo (marcado como opcional), email, contraseña y repetición de la contraseña, que al enviarse con datos válidos deja a la persona dentro de la aplicación.

#### Scenario: Registro correcto desde la pantalla

- **WHEN** se rellena el formulario de registro con datos válidos y se pulsa «Crear cuenta»
- **THEN** el botón pasa a «Creando cuenta…» mientras se envía y, al terminar, se muestra la pantalla de perfil con la sesión ya iniciada

#### Scenario: Las contraseñas no coinciden

- **WHEN** se envía el registro con dos contraseñas distintas
- **THEN** se muestra el aviso «Las contraseñas no coinciden.» bajo el campo de repetición, sin llegar a enviar nada al servidor

#### Scenario: Ayuda sobre la contraseña

- **WHEN** se mira el campo de contraseña sin ningún error pendiente
- **THEN** debajo se indica el rango admitido, «Entre 8 y 32 caracteres.»

### Requirement: Pantalla de inicio de sesión

La aplicación SHALL ofrecer una pantalla de inicio de sesión con campos de email y contraseña que, con credenciales correctas, deja a la persona dentro de la aplicación.

#### Scenario: Entrada correcta

- **WHEN** se rellena el formulario con las credenciales de una cuenta existente y se pulsa «Entrar»
- **THEN** el botón pasa a «Entrando…» mientras se envía y, al terminar, se muestra la pantalla de perfil

#### Scenario: Credenciales incorrectas

- **WHEN** se envía el formulario con un email o una contraseña que no son correctos
- **THEN** se muestra en la parte superior del formulario el aviso «El email o la contraseña no son correctos.» y se permanece en la pantalla de inicio de sesión

### Requirement: Los errores del servidor se explican en castellano

La aplicación SHALL traducir cualquier fallo devuelto por el servidor a una frase comprensible en castellano, y SHALL colocarla bajo el campo que la ha provocado cuando ese campo está en pantalla, o como aviso general del formulario cuando no lo está.

#### Scenario: Email ya registrado

- **WHEN** se intenta registrar un email que ya tiene cuenta
- **THEN** bajo el campo de email aparece «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Error sobre un campo que no está en pantalla

- **WHEN** el servidor rechaza el formulario por un campo que esa pantalla no muestra
- **THEN** el mensaje se muestra como aviso general en la parte superior del formulario, para que nunca quede oculto

#### Scenario: Servidor inalcanzable

- **WHEN** se envía un formulario y no se consigue contactar con el servidor
- **THEN** se muestra «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.» y el formulario vuelve a quedar disponible para reintentar

### Requirement: La sesión sobrevive a las recargas

La aplicación SHALL recordar la sesión iniciada entre recargas y cierres del navegador, y SHALL confirmarla contra el servidor antes de darla por buena, mostrando un indicador de carga mientras tanto.

#### Scenario: Recarga con sesión válida

- **WHEN** se recarga la página teniendo una sesión iniciada
- **THEN** se muestra brevemente un indicador de carga y después la pantalla que se estaba visitando, sin volver a pedir las credenciales

#### Scenario: Recarga con una sesión que el servidor ya no reconoce

- **WHEN** se recarga la página y el servidor rechaza la sesión guardada
- **THEN** se lleva a la pantalla de inicio de sesión y se muestra «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: Recarga con el servidor caído

- **WHEN** se recarga la página y no se consigue contactar con el servidor
- **THEN** se lleva a la pantalla de inicio de sesión explicando el motivo, pero la sesión guardada se conserva y basta con volver a recargar cuando el servidor responda

### Requirement: Protección de las pantallas según la sesión

La aplicación SHALL reservar la pantalla de perfil a quien tenga sesión iniciada, SHALL apartar de las pantallas de acceso a quien ya la tenga, y SHALL llevar cualquier dirección desconocida al perfil.

#### Scenario: Perfil sin sesión

- **WHEN** se intenta abrir `/profile` sin sesión iniciada
- **THEN** se muestra la pantalla de inicio de sesión

#### Scenario: Pantallas de acceso con sesión ya iniciada

- **WHEN** se intenta abrir `/login` o `/register` teniendo sesión iniciada
- **THEN** se muestra la pantalla de perfil

#### Scenario: Dirección desconocida

- **WHEN** se abre una dirección que no corresponde a ninguna pantalla
- **THEN** se redirige al perfil, que a su vez aplicará la protección que corresponda según haya sesión o no

#### Scenario: Ir y venir entre acceso y registro

- **WHEN** se está en la pantalla de inicio de sesión o en la de registro
- **THEN** hay un enlace visible a la otra, para cambiar sin tener que escribir la dirección

### Requirement: Pantalla de perfil y cierre de sesión

La aplicación SHALL mostrar a quien tiene sesión iniciada sus propios datos —iniciales, nombre, email y fecha de alta— y SHALL ofrecer un botón para cerrar la sesión que la termina siempre, incluso si el servidor no responde.

#### Scenario: Datos del perfil

- **WHEN** se abre la pantalla de perfil con sesión iniciada
- **THEN** se ven las iniciales, el nombre completo, el email y la fecha de alta con formato largo en castellano

#### Scenario: Cuenta sin nombre

- **WHEN** la cuenta no tiene nombre completo
- **THEN** en su lugar se muestra «Sin nombre», y el resto de los datos se ve con normalidad

#### Scenario: Cierre de sesión

- **WHEN** se pulsa «Cerrar sesión»
- **THEN** el botón pasa a «Cerrando sesión…» y se acaba en la pantalla de inicio de sesión, sin sesión guardada

#### Scenario: Cierre de sesión con el servidor caído

- **WHEN** se pulsa «Cerrar sesión» y no se consigue contactar con el servidor
- **THEN** la sesión se cierra igualmente en la aplicación y se acaba en la pantalla de inicio de sesión, sin mostrar ningún error
