# Avaliação de UX: heurística, arquitetura da informação e usabilidade

Data: 2026-11-13. Avaliador: Claude, atuando como designer de interação. Objeto: home (`/pt`, `/en`) e estudo de caso do Koinonia, em 1440 × 900 e iPhone 13.

## Método

- **Inspeção heurística** pelas 10 heurísticas de Nielsen, com severidade de 0 (não é problema) a 4 (catastrófico).
- **Arquitetura da informação**: organização, rotulação, navegação e encontrabilidade.
- **Usabilidade por tarefas** (walkthrough cognitivo) para três perfis: recrutador, cliente da SOU Studio e visitante com teclado ou leitor de tela.
- **Evidência automática**: axe-core 4.10 (WCAG 2.1 AA), percurso completo com Tab, nomes acessíveis lidos da árvore de acessibilidade, alvos de toque e capturas de página inteira.

Limite: não houve teste com usuários reais. Severidades são julgamento de especialista, não dados de comportamento.

## Ponto de partida

O axe-core não encontrou nenhuma violação nas três páginas. Foco visível em todos os 28 elementos navegáveis, alvos de toque com pelo menos 44 px, um só H1 e títulos em ordem. A base técnica de acessibilidade é sólida. Os problemas estão na clareza, na estrutura e no esforço para encontrar o que importa.

## Avaliação heurística

| # | Heurística | Problema encontrado | Sev. | Situação |
|---|---|---|---|---|
| 1 | Visibilidade do estado | As fotos trocam sozinhas e não há como parar (também falha o WCAG 2.2.2). | 3 | Corrigido |
| 1 | Visibilidade do estado | No celular, o conteúdo rolava por baixo do nome "Iury Umbelino" no topo, sem fundo, e os dois textos se sobrepunham. | 2 | Corrigido |
| 2 | Correspondência com o mundo real | O menu chamava a primeira seção de "Índice", termo de livro; para o visitante ela é o início da página. | 2 | Corrigido ("Início") |
| 3 | Controle e liberdade | As fotos continuavam trocando sozinhas depois que o visitante escolhia uma carta, tirando dele a escolha. | 2 | Corrigido |
| 4 | Consistência e padrões | Nos projetos, só a seta ↗ indicava que alguns nomes eram links; nos demais, nada distinguia "clicável" de "não clicável". | 3 | Corrigido |
| 6 | Reconhecer em vez de lembrar | Os projetos mostravam só nome, status e tags; para saber o que cada um faz era preciso abrir. O resumo já existia nos dados e não aparecia. | 3 | Corrigido |
| 7 | Flexibilidade e eficiência | Quem chega para contratar precisava rolar a página inteira para achar o contato. | 3 | Corrigido |
| 7 | Flexibilidade e eficiência | No teclado eram 28 paradas até o botão de e-mail; o baralho sozinho tinha 8. | 2 | Corrigido (23 e 5) |
| 8 | Estética e minimalismo | No celular, quatro quadros "imagem em breve" ocupavam telas inteiras de rolagem sem informação nova. | 3 | Corrigido |
| 8 | Estética e minimalismo | Na Abordagem, a nota "Cinco passos…" ficava isolada no canto direito, longe da frase que ela explica. | 1 | Corrigido |
| 10 | Ajuda e documentação | O gato assistente responde perguntas, mas só por roteiro; o limite já é dito na resposta de fallback. | 0 | Sem mudança |

Heurísticas 5 (prevenção de erros) e 9 (recuperação de erros): sem problemas relevantes. O site quase não tem entrada de dados, e o 404 explica o erro.

## Arquitetura da informação

- **Organização**: a ordem Início → Perfil → Projetos → Abordagem → Contato segue o raciocínio de quem avalia alguém (quem é, o que fez, como pensa, como falar). Está boa.
- **Rotulação**: "Perfil" funciona melhor que "Sobre" para o conteúdo atual. "Índice" no menu foi trocado por "Início".
- **Navegação**: o menu cobre as quatro seções, e o link "pular para o conteúdo" existe. Faltava um atalho para o contato logo no início; agora o Hero oferece "Conheça a pessoa" e "Fale comigo".
- **Encontrabilidade**: os projetos agora dizem o que são e qual ação levam ("Ler o estudo de caso", "Ver o site"). Os projetos sem destino não fingem ser links.
- **Nomes para leitores de tela**: cada cargo da trajetória era anunciado como um bloco de cerca de 30 palavras, e cada projeto como nome, status, tags e resumo juntos. Agora o nome é curto ("Jovem Aprendiz, abril de 2024 – julho de 2025"; "Koinonia. Ler o estudo de caso") e o resto vira descrição.

## Usabilidade por tarefas

| Tarefa | Antes | Depois |
|---|---|---|
| Recrutador: entender em 10 s quem é o Iury | O Hero diz o cargo e o que faz; o Perfil traz resumo e feitos logo abaixo. | Sem mudança necessária. |
| Recrutador: entrar em contato | Rolar a página inteira até o Contato. | "Fale comigo" no Hero. |
| Cliente: ver o que ele já entregou | Abrir projeto por projeto para saber do que se trata. | Resumo e ação explícita em cada projeto. |
| Celular: percorrer os projetos | Quatro telas de placeholders. | Só capas reais; a seção ficou com cerca de 1.550 px. |
| Teclado: chegar ao e-mail | 28 paradas de Tab. | 23 paradas. |
| Ver as fotos com calma | Elas trocavam sozinhas o tempo todo. | Botão "Pausar fotos"; e, depois que a pessoa escolhe uma, elas param. |

## Pendências (dependem de conteúdo, não de código)

1. **Capas reais** para Via Hebraica, Copiloto, Central de Tendências, Zeff e UMB. Sem elas, o efeito de imagem ao passar o mouse mostra pôsteres tipográficos.
2. **Resumo** para Central de Tendências, Zeff e UMB: os dados estão vazios, e a regra do projeto é não inventar.
3. **Trajetória**: os textos ainda são rascunhos (`confirmed: false`) à espera de revisão.
4. **Teste com usuários**: 3 a 5 sessões curtas com recrutadores ou clientes reais validariam as severidades acima.
