package uk.rossarnold.newschart.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @SuppressWarnings("unused") // invoked reflectively by Spring MVC via @ExceptionHandler
    public Map<String, String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        Class<?> type = ex.getRequiredType();
        String message;
        if (type != null && type.isEnum()) {
            String valid = Arrays.stream(type.getEnumConstants())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            message = "Invalid value '%s' for parameter '%s'. Valid values: %s"
                    .formatted(ex.getValue(), ex.getName(), valid);
        } else {
            message = "Invalid value for parameter '%s'".formatted(ex.getName());
        }
        return Map.of("error", message);
    }
}
