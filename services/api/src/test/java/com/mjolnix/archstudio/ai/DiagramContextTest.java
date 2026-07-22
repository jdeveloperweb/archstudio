package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DiagramContextTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private static final String DOC = """
        {"format":"archstudio","version":3,"state":{
          "seq":9,
          "nodes":[
            {"id":1,"type":"api","label":"API Pedidos","x":100,"y":100,"aid":"api_pedidos"},
            {"id":2,"type":"db","label":"Postgres","x":300,"y":100},
            {"id":3,"type":"cache","label":"Redis","x":700,"y":400}
          ],
          "edges":[{"id":4,"from":1,"to":2,"label":"SQL"},
                   {"id":5,"from":1,"to":2,"label":"replica","dash":true}],
          "boxes":[{"id":6,"x":60,"y":60,"w":400,"h":200,"label":"AWS us-east-1"}],
          "texts":[{"id":7,"text":"Consumidor idempotente","size":14}]
        }}""";

    @Test
    void descreve_componentes_conexoes_grupos_e_orfaos() throws Exception {
        String out = DiagramContext.describe(mapper.readTree(DOC));
        assertNotNull(out);

        // usa o id do agente quando existe, e o rótulo que o usuário vê
        assertTrue(out.contains("[api_pedidos]"), out);
        assertTrue(out.contains("\"API Pedidos\" (api)"), out);
        assertTrue(out.contains("\"Postgres\" (db)"), out);

        // agrupamento por caixa é inferido pela posição
        assertTrue(out.contains("dentro de: AWS us-east-1"), out);

        // conexões legíveis, marcando a assíncrona
        assertTrue(out.contains("CONEXÕES (2)"), out);
        assertTrue(out.contains("SQL"), out);
        assertTrue(out.contains("tracejada/assíncrona"), out);

        // anotação do canvas entra no contexto
        assertTrue(out.contains("Consumidor idempotente"), out);

        // o Redis está solto -> vira gancho para a Ari propor a ligação
        assertTrue(out.contains("SEM NENHUMA CONEXÃO"), out);
        assertTrue(out.contains("Redis"), out);
    }

    @Test
    void canvas_vazio_nao_gera_contexto() throws Exception {
        assertNull(DiagramContext.describe(mapper.readTree("{\"state\":{\"nodes\":[]}}")));
        assertNull(DiagramContext.describe(null));
    }

    @Test
    void prompt_inclui_o_desenho_e_pede_leitura() {
        String p = SystemPrompt.build("COMPONENTES (1):\n- \"API\" (api)\n", "{\"state\":{}}");
        assertTrue(p.contains("DESENHO ATUAL DO USUÁRIO"), "deve destacar o desenho atual");
        assertTrue(p.contains("COMPONENTES (1)"));
        // canvas vazio muda a instrução
        assertTrue(SystemPrompt.build(null, null).contains("O CANVAS ESTÁ VAZIO"));
    }

    @Test
    void pergunta_da_ari_e_reconhecida_para_nao_forcar_desenho() {
        assertTrue(AiService.endsWithQuestion("Posso ligar o Redis na API Pedidos ou no Worker?"));
        assertTrue(AiService.endsWithQuestion("Entendi o desenho.\n\nLigo no Worker de Pagamento?"));
        assertFalse(AiService.endsWithQuestion("Adicionei o Redis ao lado da API."));
        assertFalse(AiService.endsWithQuestion(""));
        assertFalse(AiService.endsWithQuestion(null));
    }
}
