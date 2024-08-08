package stanggc.smq;

import org.junit.jupiter.api.Test;

public class MsgQueueGroupTest {
    @Test
    public void testScalability() {
        var queueGroup = new MsgQueueGroup(1_000_000);
        String chName = "test";
        for (int i = 0; i < 5_000_000; ++i) {
            queueGroup.addMsg(chName, Integer.toString(i).getBytes());
        }

        // Dequeue.
        for (; ; ) {
            try {
                byte[] content = queueGroup.getMsg(chName);
                for (int i = 0; i < 5; ++i) {
                    String s = new String(content);
                    if (s.equals(Integer.toString(i * 1_000_000))) {
                        System.out.printf("%dM mark\n", i);
                    }
                }
            } catch (QueueEmptyException e) {
                break;
            }
        }
    }
}
