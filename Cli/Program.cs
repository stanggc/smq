using System.Buffers;
using Cli;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Smq.Library;

const string channelHeaderName = "x-channel";
var certFile = Path.Combine(Directory.GetCurrentDirectory(), "cert.crt");
var certKeyFile = Path.Combine(Directory.GetCurrentDirectory(), "cert.key");

var cwd = Directory.GetCurrentDirectory();
var builder = WebApplication.CreateEmptyBuilder(new WebApplicationOptions
{
    Args = args,
    ApplicationName = "smq",
    EnvironmentName = "Production",
    ContentRootPath = cwd,
    WebRootPath = cwd
});
builder.Configuration.AddJsonFile("config.json", optional: true, reloadOnChange: false);
builder.WebHost.UseKestrelCore();
builder.WebHost.UseKestrelHttpsConfiguration();

var httpsMode = File.Exists(certFile) && File.Exists(certKeyFile);
var protocol = "http";

if (httpsMode)
{
    protocol = "https";
    builder.WebHost.ConfigureKestrel(serverOpts =>
    {
        serverOpts.ConfigureHttpsDefaults(httpsOpts =>
        {
            var cert = X509CertUtil.LoadFromPemFile(certFile, certKeyFile);
            httpsOpts.ServerCertificate = cert;
        });
    });
}

builder.Logging.AddConsole();
builder.Services.AddRouting();
builder.Services.AddSingleton(new MessageQueueGroup());
builder.Services.Configure<Configuration>(builder.Configuration.GetSection(Configuration.SectionName));

var app = builder.Build();
var port = 8080;
// Initialise using values from configuration.
using (var scope = app.Services.CreateScope())
{
    var cfgVal = scope.ServiceProvider.GetRequiredService<IOptions<Configuration>>();
    var qGrp = scope.ServiceProvider.GetRequiredService<MessageQueueGroup>();
    qGrp.DefaultInitialCapacity = cfgVal.Value.InitialCapacity;
    port = cfgVal.Value.Port;
}

app.UseAuthCheck();
app.UseChannelNameHeaderCheck();

app.MapGet("/", (IOptions<Configuration> configVal, [FromServices] MessageQueueGroup qGrp) =>
{
    var config = configVal.Value;
    return
        $"Configured initial capacity: {config.InitialCapacity}.\nEffective initial capacity: {qGrp.DefaultInitialCapacity}.\n";
});

app.MapGet("/msg", (HttpRequest req, HttpResponse resp, MessageQueueGroup qGrp) =>
{
    try
    {
        var chanName = req.Headers[channelHeaderName].First();
        var msg = qGrp.Dequeue(chanName!);
        resp.StatusCode = 200;
        resp.ContentType = "application/octet-stream";
        resp.ContentLength = msg.Length;
        resp.BodyWriter.Write(msg);
    }
    catch (QueueEmptyException)
    {
        resp.StatusCode = 404;
        resp.ContentType = "text/plain";
        resp.BodyWriter.Write("no message"u8);
    }
});

app.MapPost("/msg", async (HttpRequest req, HttpResponse resp, MessageQueueGroup qGrp) =>
{
    var chanName = req.Headers[channelHeaderName].First();
    var memory = new MemoryStream();
    await req.Body.CopyToAsync(memory);
    if (memory.Length > 0)
    {
        var content = memory.ToArray();
        qGrp.Enqueue(chanName!, content);
        resp.StatusCode = 200;
        resp.BodyWriter.Write("ok"u8);
    }
    else
    {
        resp.StatusCode = 400;
        resp.ContentType = "text/plain";
        resp.BodyWriter.Write("message required"u8);
    }
});

var listenEndpoint = $"{protocol}://*:{port}";
Console.WriteLine($"Listening at {listenEndpoint}");
app.Run(listenEndpoint);