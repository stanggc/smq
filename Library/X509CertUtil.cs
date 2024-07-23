using System.Security.Cryptography.X509Certificates;

namespace Smq.Library;

public static class X509CertUtil
{
    public static X509Certificate2 LoadFromPem(ReadOnlySpan<char> certPemFormat, ReadOnlySpan<char> key)
    {
        // NOTE
        // See https://github.com/dotnet/runtime/issues/86328#issuecomment-1549891213 for more info regarding this
        // workaround.
        //
        // From the same URL, it seems merely using X509Certificate2.CreateFromPemFile() does not work,
        // as the private key does not get included as part of the X509Certificate2 instance.
        //

        var certFromPem =
            X509Certificate2.CreateFromPem(certPemFormat, key);
        return new X509Certificate2(certFromPem.Export(X509ContentType.Pfx), "",
            X509KeyStorageFlags.PersistKeySet);
    }

    public static X509Certificate2 LoadFromPemFile(string certFilePath, string certKeyFilePath)
    {
        return LoadFromPem(File.ReadAllText(certFilePath), File.ReadAllText(certKeyFilePath));
    }
}