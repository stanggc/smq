namespace Cli;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseAuthCheck(this IApplicationBuilder builder) =>
        builder.UseMiddleware<AuthCheckMiddleware>();

    public static IApplicationBuilder UseChannelNameHeaderCheck(this IApplicationBuilder builder) =>
        builder.UseMiddleware<ChannelNameHeaderCheckMiddleware>();
}