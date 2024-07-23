namespace Smq.Library;

public class MessageQueueGroup(int defaultInitialCapacity = 0)
{
    private readonly Dictionary<string, MessageQueue> _channels = new();

    public int DefaultInitialCapacity { get; set; } = defaultInitialCapacity;

    public void Enqueue(string channelName, byte[] content)
    {
        if (!_channels.ContainsKey(channelName))
        {
            _channels[channelName] = new MessageQueue(channelName, DefaultInitialCapacity);
        }

        _channels[channelName].Enqueue(content);
    }

    public byte[] Dequeue(string channelName)
    {
        if (!_channels.TryGetValue(channelName, out var channel)) throw new QueueEmptyException(channelName);
        return channel.Dequeue();
    }
}

public class QueueEmptyException : Exception
{
    public QueueEmptyException(string channelName) : base($"channel: {channelName}")
    {
    }

    public QueueEmptyException()
    {
    }
}