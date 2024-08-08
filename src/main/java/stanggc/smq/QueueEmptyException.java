package stanggc.smq;

public class QueueEmptyException extends Exception {
    public String channelName;

    public QueueEmptyException(String channelName) {
        super(channelName);
        this.channelName = channelName;
    }
}
