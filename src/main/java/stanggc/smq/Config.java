package stanggc.smq;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Config {
    @Bean
    public MsgQueueGroup queueGroup(@Value("${smq.initial-capacity}") int initialCapacity) {
        return new MsgQueueGroup(initialCapacity);
    }

    @Bean
    public AuthKey authKey(@Value("${smq.auth-key:}") String key) {
        return new AuthKey(key);
    }

    @Bean
    public Log logger() {
        return LogFactory.getLog(Config.class);
    }
}
