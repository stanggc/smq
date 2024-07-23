# smq

This is the C# implementation of smq, using .NET 8 runtime.

Other implementations:

[Java (Spring Boot)](https://github.com/stanggc/smq/tree/java-spring) | [JavaScript/TypeScript (Deno)](https://github.com/stanggc/smq/tree/js-deno)

## Introduction

smq is a simple high-performance messaging queue service.

It supports enqueuing and dequeuing messages on different message channels.

It is capable of dealing with at least one million messages (1,000,000) per second.
Note that this excludes HTTP communication overheads.

## Requirements

smq is implemented using [.NET 8] and ASP.NET Core.

The latest version of .NET is recommended.

[.NET 8]: https://dotnet.microsoft.com/en-us/download/dotnet/8.0

## Configuration

Configuration for smq is specified in a `config.json` file, which smq will read from
the current working directory it is invoked in.

By default, smq does not require authentication from clients, but can be configured to do so.

Specify `Port` for the server port to listen on.

Specify `InitialCapacity` for per-channel initial number of message storage capacity to cater for.

Specify `AuthKey` to enable authentication. To disable, set its value to `null`.

Example configuration:

```json
{
  "Smq": {
    "Port": 8080,
    "InitialCapacity": 1000000,
    "AuthKey": "ThisIsSecretKey"
  }
}
```

## Usage

Clone this repository, `cd` to `Cli` and invoke `dotnet run`.

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

Specify the `AuthKey` property in `config.json` to a desired string value and restart
smq.

Once smq is operating in authentication mode, a `x-auth` request HTTP header
will need to be provided in client requests.

Example with `AuthKey` in `config.json` set to `ThisIsSecretKey`:

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

## HTTPS

By convention, if `cert.crt` and `cert.key` exists in the directory smq is invoked in,
smq will listen over HTTPS, instead of HTTP.

### Generating self-signed cert to test HTTPS

If you are not already using `dotnet dev-certs https` for other projects, you can make use of it to do so.

You will need to remove any existing ones first, before you can generate one in PEM format.

```shell
# Be in `Cli` directory.
$ cd Cli

# Remove existing dev cert.
$ dotnet dev-certs https --clean

# Generate and output dev cert and its private key in PEM format.
$ dotnet dev-certs https -ep cert.crt -np --format PEM
```

The above command generates `cert.crt` and its corresponding `cert.key`.

Alternatively, you can use the following OpenSSL command:

```shell
$ openssl req -newkey rsa:2048 -nodes -keyout cert.key -x509 -days 365 -out cert.crt
```

Once invoked, answer the interactive prompts. Note that this particular OpenSSL command does not
generate certs that supports Subject Alternative Name (SAN).

## Testing

To test, `cd` to `Test` and invoke `dotnet test`.

## Licence

MIT licence. See LICENSE.txt.
