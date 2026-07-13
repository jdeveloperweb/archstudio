package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiServiceExtractTest {

    private final AiService svc = new AiService(null, null, new ObjectMapper());

    private static final String SPEC = "{\"name\":\"X\",\"nodes\":[{\"id\":\"a\",\"type\":\"api\"}],"
            + "\"edges\":[]}";

    @Test
    void blocoArchstudioFechado() {
        var ex = svc.extract("Aqui está.\n```archstudio\n" + SPEC + "\n```\nPronto!");
        assertNotNull(ex.spec());
        assertEquals("a", ex.spec().at("/nodes/0/id").asText());
        assertFalse(ex.reply().contains("nodes"), "bloco deve sair da resposta visível");
        assertTrue(ex.reply().contains("Pronto!"));
    }

    @Test
    void blocoJsonGenerico() {
        var ex = svc.extract("Segue:\n```json\n" + SPEC + "\n```");
        assertNotNull(ex.spec());
        assertFalse(ex.reply().contains("nodes"));
    }

    @Test
    void fenceSemFechamentoMasJsonCompleto() {
        var ex = svc.extract("Desenhei o sistema:\n```archstudio\n" + SPEC);
        assertNotNull(ex.spec(), "JSON completo com fence aberto deve ser aceito");
        assertEquals("X", ex.spec().get("name").asText());
        assertTrue(ex.reply().contains("Desenhei"));
        assertFalse(ex.reply().contains("nodes"));
    }

    @Test
    void respostaTruncadaNoMeioDoJson() {
        var ex = svc.extract("Vou desenhar:\n```archstudio\n{\"name\":\"X\",\"nodes\":[{\"id\":\"a\",");
        assertNull(ex.spec(), "JSON truncado não vira spec");
        assertEquals("Vou desenhar:", ex.reply(), "o lixo truncado sai da resposta visível");
    }

    @Test
    void jsonSoltoSemFence() {
        var ex = svc.extract("O diagrama é " + SPEC + " — avise se quiser mudar.");
        assertNotNull(ex.spec());
        assertTrue(ex.reply().contains("avise se quiser mudar"));
        assertFalse(ex.reply().contains("nodes"));
    }

    @Test
    void jsonQueNaoEhSpecNaoDispara() {
        var ex = svc.extract("Config: {\"retry\": 3, \"timeout\": 30} como combinado.");
        assertNull(ex.spec(), "objeto sem nodes/boxes não é spec");
        assertTrue(ex.reply().contains("como combinado"));
    }

    @Test
    void textoPuroSemSpec() {
        var ex = svc.extract("SQS entre a API e o worker desacopla e absorve picos.");
        assertNull(ex.spec());
        assertTrue(ex.reply().startsWith("SQS"));
    }

    @Test
    void chavesDentroDeStringNaoQuebramBalanceamento() {
        String tricky = "{\"nodes\":[{\"id\":\"a\",\"label\":\"chaves { } e aspas \\\" no rótulo\"}]}";
        assertEquals(tricky, AiService.balancedJson(tricky + " resto"));
    }

    @Test
    void promptNomeiaAriEReforcaEvolucaoDoDesenho() {
        String prompt = SystemPrompt.build("{\"nodes\":[{\"id\":\"api\",\"type\":\"api\"}]}");
        assertTrue(prompt.contains("Ari"));
        assertTrue(prompt.contains("melhorar"));
        assertTrue(prompt.contains("DIAGRAMA ATUAL"));
    }
}
