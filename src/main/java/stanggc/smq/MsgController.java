package stanggc.smq;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.io.IOException;
import java.io.InputStream;

@Controller
public class MsgController {
    private final MsgQueueGroup queueGroup;

    public MsgController(MsgQueueGroup queueGroup) {
        this.queueGroup = queueGroup;
    }

    @PostMapping("/msg")
    public ResponseEntity<byte[]> postMsg(
            @RequestHeader("x-channel") String channelName,
            InputStream reqBody
    ) {
        try {
            var msg = reqBody.readAllBytes();
            queueGroup.addMsg(channelName, msg);
            return new ResponseEntity<>("ok".getBytes(), null, 200);
        } catch (IOException e) {
            return new ResponseEntity<>("unable to read request body".getBytes(), null, 400);
        }
    }

    @GetMapping("/msg")
    public ResponseEntity<byte[]> getMsg(
            @RequestHeader("x-channel") String channelName
    ) {
        try {
            var msg = queueGroup.getMsg(channelName);
            return new ResponseEntity<>(msg, null, 200);
        } catch (QueueEmptyException e) {
            return new ResponseEntity<>("no message".getBytes(), null, 404);
        }
    }
}
