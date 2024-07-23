namespace Cli;

public class ChannelNameHeaderCheckMiddleware(RequestDelegate next)
{
    private const string ChannelHeaderName = "x-channel";

    public async Task InvokeAsync(HttpContext context)
    {
        var urlPath = context.Request.Path.Value;
        if (urlPath!.Equals("/msg"))
        {
            if (context.Request.Headers[ChannelHeaderName].Count > 0)
            {
                await next(context);
            }
            else
            {
                context.Response.StatusCode = 400;
                context.Response.ContentType = "text/plain";
                await context.Response.WriteAsync("channel name required");
            }
        }
        else
        {
            await next(context);
        }
    }
}