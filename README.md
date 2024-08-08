# smq

This is the Java implementation of smq, using Java 21 and Spring Boot.

Other implementations:

[C# (.NET)](https://github.com/stanggc/smq/tree/c%23-dotnet) | [JavaScript/TypeScript (Deno)](https://github.com/stanggc/smq/tree/js-deno)

## Introduction

smq is a simple high-performance messaging queue service.

It supports enqueuing and de-queuing messages on different message channels.

It is capable of dealing with at least one million messages (1,000,000) per second.
Note that this excludes HTTP communication overheads.

## Requirements

smq requires Java 21.

## Configuration

Configuration is done in an `application.properties` file.

You can set the initial capacity of the message queues via `smq.initial-capacity`:

```properties
smq.initial-capacity=1000
```

## Usage

Clone this repository, and invoke `gradle bootRun`.

smq stores messages in byte arrays, and responds with
`content-length` as `application/octet-stream` during message retrievals. This
means you can send binary messages, besides sending text messages.

For all responses other than message retrievals, smq responds with
`content-type` of `text/plain`.

The URL path to both adding and getting messages is `/msg`.

The route to add message to a channel is `POST /msg`.

The route to get a message from a channel is `GET /msg`.

If `x-channel` is not specified, smq responds with HTTP status `400`. However, if
authentication mode is enabled for the same situation, and incorrect
authentication is provided, smq responds with HTTP status `403` instead.

### Authentication mode

smq can be configured to require authentication for its operations.

Set `smq.auth-key` in `application.properties` file.

Example:

```properties
smq.initial-capacity=1000
smq.auth-key=ThisIsSecretKey
```
Once smq is operating in authentication mode, a `x-auth` request HTTP header
will need to be provided in client requests.

Example with auth key configured to be `ThisIsSecretKey`:

```http
GET /msg
x-channel: abc
x-auth: ThisIsSecretKey
```

Should the authentication key be incorrect, smq will always fail with HTTP
status `403` first, even if it had failed with HTTP status `400` instead when
in non-authenticated mode.

### Examples

To add a message to a channel named `abc`, do a POST method, as follows:

```http
POST /msg
x-channel: abc
content-length: 6

Hello!
```

smq responds with HTTP status 200 and responds with `ok`.

To get a message from a channel named `abc`, do a GET method, as follows:

```http
GET /msg
x-channel: abc
```

If there is a message, smq responds with HTTP status `200`, and with the response
body containing the message. The length of the message is provided by the
response `content-length` HTTP header. Otherwise, HTTP status `404` is returned,
with body content `no message`.

## Licence

MIT licence. See LICENSE.txt.
