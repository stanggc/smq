namespace Cli;

public class Configuration
{
    public static string SectionName = "Smq";

    public int Port { get; set; } = 8080;
    public int InitialCapacity { get; set; } = 10_000;
    public string? AuthKey { get; set; } = null;
}