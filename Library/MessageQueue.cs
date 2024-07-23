namespace Smq.Library;

public class MessageQueue(string name, int initialCapacity = 0)
{
    private readonly Queue<byte[]> _queue = new(initialCapacity);

    public string Name => name;
    public int Capacity => initialCapacity;
    public int Length => _queue.Count;

    public void Enqueue(byte[] content)
    {
        _queue.Enqueue(content);
    }

    public byte[] Dequeue()
    {
        try
        {
            return _queue.Dequeue();
        }
        catch (InvalidOperationException)
        {
            throw new QueueEmptyException(name);
        }
    }
}