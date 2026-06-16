package uk.rossarnold.newschart.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import uk.rossarnold.newschart.callout.CalloutService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that GlobalExceptionHandler returns a structured 400 for invalid enum params.
 */
class GlobalExceptionHandlerTest {

    private MockMvcTester mockMvc;

    @BeforeEach
    void setUp() {
        CalloutService calloutService = mock(CalloutService.class);
        when(calloutService.calloutsForDay(any(), any())).thenReturn(List.of());
        when(calloutService.availableDays(any())).thenReturn(List.of());

        mockMvc = MockMvcTester.of(
                List.of(new CalloutController(calloutService)),
                builder -> builder.setControllerAdvice(new GlobalExceptionHandler()).build()
        );
    }

    @Test
    void InvalidSourceOnCalloutsForDayReturns400WithMessage() {
        assertThat(mockMvc.get().uri("/api/news/calloutsForDay/2024-01-01").param("source", "NOT_IN_ENUM"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.error").asString()
                .contains("NOT_IN_ENUM")
                .contains("source");
    }

    @Test
    void InvalidSourceOnCalloutsForDayListsValidValues() {
        assertThat(mockMvc.get().uri("/api/news/calloutsForDay/2024-01-01").param("source", "NOT_IN_ENUM"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.error").asString()
                .contains("NEW_YORK_TIMES");
    }

    @Test
    void InvalidSourceOnAvailableDaysReturns400WithMessage() {
        assertThat(mockMvc.get().uri("/api/news/availableDays").param("source", "NOT_IN_ENUM"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.error").asString()
                .contains("NOT_IN_ENUM")
                .contains("source");
    }

    @Test
    void missingSourceOnCalloutsForDayReturns200() {
        assertThat(mockMvc.get().uri("/api/news/calloutsForDay/2024-01-01"))
                .hasStatusOk();
    }

    @Test
    void missingSourceOnAvailableDaysReturns200() {
        assertThat(mockMvc.get().uri("/api/news/availableDays"))
                .hasStatusOk();
    }
}
