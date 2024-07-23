using Microsoft.Extensions.Options;

namespace Cli;

public class AuthCheckMiddleware(RequestDelegate next)
{
    private const string AuthKeyName = "x-auth";

    public async Task InvokeAsync(HttpContext context, IOptions<Configuration> cfgVal)
    {
        if (cfgVal.Value.AuthKey != null)
        {
            if (context.Request.Headers[AuthKeyName].Count > 0)
            {
                var authKey = cfgVal.Value.AuthKey!;
                var authVal = context.Request.Headers[AuthKeyName].First();
                if (authVal != null && authKey.Equals(authVal))
                {
                    await next.Invoke(context);
                }
                else
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("invalid auth");
                }
            }
            else
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("auth required");
            }
        }
        else
        {
            await next.Invoke(context);
        }
    }
}