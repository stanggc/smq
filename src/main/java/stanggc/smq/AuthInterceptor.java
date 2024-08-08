package stanggc.smq;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final AuthKey authKey;

    public AuthInterceptor(AuthKey authKey) {
        this.authKey = authKey;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        var authKey = request.getHeader("x-auth");
        if (!this.authKey.isAuthRequired()) return true;
        if (authKey == null) {
            response.setStatus(400);
            response.getOutputStream().print("auth header required");
            return false;
        } else if (this.authKey.getValue().equals(authKey)) {
            return true;
        } else {
            response.setStatus(403);
            response.getOutputStream().print("invalid auth");
            return false;
        }
    }
}
