package stanggc.smq;

import org.apache.commons.logging.Log;
import org.springframework.stereotype.Component;

@Component
public class Informer {
    private AuthKey authKey;

    public Informer(AuthKey authKey, Log logger) {
        this.authKey = authKey;
        if (this.authKey.isAuthRequired()) {
            logger.info("Auth is enabled.");
        } else {
            logger.info("Auth is disabled.");
        }
    }
}
