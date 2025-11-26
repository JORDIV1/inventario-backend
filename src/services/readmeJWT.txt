Qué significan esos nombres

cfg: abreviatura de config (configuración). Es un objeto con los valores que necesita el servicio JWT: secret, issuer, audience, tiempos de expiración, etc.

issuer (iss): “quién emite” el token. Sirve para que el que verifica sepa que el token viene de tu backend (p. ej., inventario-app).

audience (aud): “para quién está destinado” el token (el cliente/SPA/móvil que lo consumirá). Evita que un token válido para un cliente A se use en cliente B.

claims: el contenido útil que vas a firmar dentro del JWT (p. ej., sub = id del usuario, rolId, y otros datos mínimos).

token: el JWT ya firmado (string).

opts: opciones extra que le pasas a un método (por ejemplo expectedType: "access" para asegurarte de que el token que verificas es de acceso y no de refresh).

authHeader: el valor del header HTTP Authorization (p. ej., "Bearer eyJ...").

¿Por qué static? Porque extraer el token del header es una utilidad pura que no depende del estado del objeto; no necesita this. Por eso conviene método estático.




“Normalizo el esquema Bearer para asegurar compatibilidad y seguridad frente a variaciones reales de clientes HTTP. La extracción del token es robusta frente a tabs, múltiples espacios y capitalización variable.”




n ataque de tiempo es un tipo de ataque de canal lateral que explota las variaciones en el tiempo que tarda una computadora en realizar operaciones criptográficas para robar información.Al medir con precisión el tiempo de ejecución de los algoritmos, un atacante puede deducir información confidencial



El repo no devuelve “ER_DUP_ENTRY” (que solo MySQL entiende), sino un código de dominio ("EMAIL_TAKEN").
El Service entiende ese código y lo convierte en lógica de negocio coherente:
El Controller no entiende SQL ni dominio:
solo traduce el código de dominio a un HTTP status legible para el cliente.



servicew 
¿Por qué undefined y no null cuando “no vino”?

undefined = ausencia de campo en el PATCH ⇒ el service entiende “no lo toques”.

null = intención explícita del cliente ⇒ “ponlo a NULL” en BD (semántica distinta).
Si usas null para ambos casos, pierdes la diferencia entre no modificar y borrar valor.
En normalize/merge del PATCH, no tiramos throw por “no enviado”; solo ignoramos el campo (undefined).

Sí tiras throw si el valor que vino es inválido (p. ej., precioCents decimal o < 0). Eso lo hará la Entidad al construir el merged (o tus validadores del service si decides un “fail-fast” extra).