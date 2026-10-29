package br.com.studymate.config;

import static org.junit.jupiter.api.Assertions.*;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class NotificacaoPolicyTests {
    private NotificacaoPolicy policy(String zone, int lead, int eve, int day, double ratio, int users, int rows) {
        return new NotificacaoPolicy(zone, lead, eve, day, ratio, true, users, rows);
    }
    @Test void valoresPadraoDocumentadosEExtremosValidos() {
        var normal = policy("America/Sao_Paulo",24,18,8,0.75,100,200);
        assertEquals(ZoneId.of("America/Sao_Paulo"),normal.zone());
        assertEquals(24,normal.taskLeadHours()); assertEquals(18,normal.eveHour()); assertEquals(8,normal.dayHour());
        assertEquals(0.75,normal.absenceRatio()); assertTrue(normal.averageEnabled());
        assertDoesNotThrow(() -> policy("UTC",1,0,23,0.01,1,1000));
        assertDoesNotThrow(() -> policy("UTC",168,23,0,0.99,1000,1));
    }
    @Test void razaoInvalidaNaoCriaAvisosSemFaltasOuThresholdInalcancavel() {
        for (double ratio : new double[]{0,-1,1,2,Double.NaN,Double.POSITIVE_INFINITY,Double.NEGATIVE_INFINITY}) {
            assertThrows(IllegalArgumentException.class, () -> policy("UTC",24,18,8,ratio,100,200));
        }
    }
    @Test void antecedenciaHorariosELotesTemLimites() {
        for (int lead : new int[]{-1,0,169}) assertThrows(IllegalArgumentException.class, () -> policy("UTC",lead,18,8,.75,100,200));
        for (int hour : new int[]{-1,24}) {
            assertThrows(IllegalArgumentException.class, () -> policy("UTC",24,hour,8,.75,100,200));
            assertThrows(IllegalArgumentException.class, () -> policy("UTC",24,18,hour,.75,100,200));
        }
        for (int size : new int[]{0,-1,1001}) {
            assertThrows(IllegalArgumentException.class, () -> policy("UTC",24,18,8,.75,size,200));
            assertThrows(IllegalArgumentException.class, () -> policy("UTC",24,18,8,.75,100,size));
        }
    }
    @Test void fusoInvalidoFalhaAntesDeAgendar() {
        assertThrows(java.time.DateTimeException.class, () -> policy("Fuso/Inexistente",24,18,8,.75,100,200));
    }
}
