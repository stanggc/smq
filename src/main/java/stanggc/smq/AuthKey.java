package stanggc.smq;

import lombok.Getter;

public class AuthKey {
    @Getter
    private String value;

    public AuthKey(String key) {
        value = key;
    }

    public boolean isAuthRequired() {
        return value != null && !value.isEmpty();
    }
}
