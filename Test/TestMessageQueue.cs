using System.Text;
using Smq.Library;

namespace Test;

[TestClass]
public class TestMessageQueue
{
    [TestMethod]
    public void TestScalability()
    {
        var q = new MessageQueue("test", 0);
        for (var i = 0; i < 3_000_000; ++i)
        {
            q.Enqueue(Encoding.UTF8.GetBytes(i.ToString()));
        }

        for (;;)
        {
            if (q.Length <= 0) break;
            var num = q.Dequeue();
            // Console.WriteLine(Encoding.UTF8.GetString(num));
        }
    }
}