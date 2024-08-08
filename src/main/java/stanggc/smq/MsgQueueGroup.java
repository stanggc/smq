package stanggc.smq;

import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.NoSuchElementException;

public class MsgQueueGroup {
    private final HashMap<String, ArrayDeque<byte[]>> queues;
    public final int initialCapacity;

    public MsgQueueGroup(int initialCapacity) {
        queues = new HashMap<>();
        this.initialCapacity = initialCapacity;
    }

    public synchronized void addMsg(String channelName, byte[] msg) {
        if (!queues.containsKey(channelName)) {
            queues.put(channelName, new ArrayDeque<>(initialCapacity));
        }
        var queue = queues.get(channelName);
        queue.add(msg);
    }

    public synchronized byte[] getMsg(String channelName) throws QueueEmptyException {
        if (!queues.containsKey(channelName)) {
            throw new QueueEmptyException(channelName);
        }

        var queue = queues.get(channelName);
        if (queue.isEmpty()) {
            throw new QueueEmptyException(channelName);
        }

        try {
            return queue.removeFirst();
        } catch (NoSuchElementException e) {
            throw new QueueEmptyException(channelName);
        }
    }
}
