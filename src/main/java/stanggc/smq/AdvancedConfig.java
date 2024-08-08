package stanggc.smq;

import org.apache.commons.logging.Log;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdvancedConfig implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;
    private final ChannelNameHeaderInterceptor channelNameHeaderInterceptor;
    private final Log logger;

    public AdvancedConfig(AuthInterceptor authInterceptor, ChannelNameHeaderInterceptor cnhInterceptor, Log logger) {
        this.authInterceptor = authInterceptor;
        this.channelNameHeaderInterceptor = cnhInterceptor;
        this.logger = logger;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor);
        logger.info("Auth interceptor added.");
        registry.addInterceptor(channelNameHeaderInterceptor);
        logger.info("Channel name header interceptor added.");
    }
}
