# smq

This is the JavaScript/TypeScript implementation of smq, with [Deno](https://deno.com) as runtime.

Other implementations:

[C# (.NET)](https://github.com/stanggc/smq/tree/c%23-dotnet) | [Java (Spring Boot)](https://github.com/stanggc/smq/tree/java-spring)

## Introduction

smq is a simple high-performance messaging queue service.

It supports enqueing and dequeing messages on different message channels.

It is capable of enqueuing and dequeuing one million messages in one second (for
a total of about 2,000,000 messages/second), with each message being around 20
bytes, on an Apple M3 chip. Note that this excludes HTTP communication
overheads.

## Requirements

smq uses Deno as its runtime. The latest version of Deno is recommended.

## Configuration

Configuration for smq is specified in a `config.json`, which smq will read from
the current working directory it is invoked from.

smq needs a message channel capacity to be specified, as well as a per-message
maximum size, in order to start operation. Optionally, smq can be configured to
require authentication from clients.

Specify `MessageMaxSize` for the per-message maximum size in bytes.

Specify `Capacity` for per-channel maximum number of messages that can be held.

Example configuration:

```json
{
  "Port": 8080,
  "MessageMaxSize": 256,
  "Capacity": 1000000,
  "AuthKey": "ThisIsSecretKey"
}
```

## Usage

Invoke `deno task run` to start smq.

smq stores messages in byte arrays (Uint8Array), and responds with
`content-length` as `application/octet-stream` during message retrievals. This
means you can send binary messages, besides sending text messages.

For all responses other than message retrievals, smq responds with
`content-type` of `text/plain`.

The URL path to both adding and getting messages is `/msg`.

The route to add message to a channel is `POST /msg`.

The route to get a message from a channel is `GET /msg`.

If `x-channel` is not specified, smq responds with HTTP status 400. However, if
authentication mode is enabled for the same situation, and incorrect
authentication is provided, smq responds with HTTP status 403 instead.

### Authentication mode

smq can be configured to require authentication for its operations.

Specify the `authKey` property in `config.json` to a desired value and restart
smq.

Once smq is operating in authentication mode, a `x-auth` request HTTP header
will need to be provided.

Example with `AuthKey` in `config.json` set to `ThisIsSecretKey`:

```http
GET /msg
x-channel: abc
x-auth: ThisIsSecretKey
```

Should the authentication key be incorrect, smq will always fail with HTTP
status 403 first, even if it would have failed with HTTP status 400 instead when
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

If there is a message, smq responds with HTTP status 200, and with the response
body containing the message. The length of the message is provided by the
response `content-length` HTTP header.

## Testing

To test, invoke `deno test`.

## Licence

MIT licence. See LICENSE.txt.
