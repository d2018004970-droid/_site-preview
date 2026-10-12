# psiclaudiatilemann.com.br — guia do projeto

Site da psicóloga Claudia Tilemann (CRP 14/10201). Este arquivo existe para
que qualquer pessoa (ou qualquer assistente de IA, em outra conversa) que
precise trabalhar nesta pasta entenda rapidamente como tudo funciona, sem
precisar redescobrir do zero. Mantenha-o atualizado sempre que algo
estrutural mudar (novo arquivo importante, nova variável de ambiente, novo
fluxo).

Última atualização: 12/10/2026.

## Visão geral

- Site estático (HTML/CSS/JS puro, sem framework, sem build step) hospedado
  na Netlify.
- Deploy contínuo via GitHub: esta própria pasta **é** o repositório git
  ligado à Netlify. Um `git push` na branch `main` publica direto em
  produção (`psiclaudiatilemann.com.br`). Não existe ambiente de
  "homologação" separado — o cuidado ao editar é o que evita problemas em
  produção.
- Quem faz os commits/push hoje: Renata e um colaborador que aparece no
  histórico do git como `d2018004970-droid <d2018004970@unifei.edu.br>`
  (provavelmente "João").

## Mapa de pastas e arquivos

```
index.html                    página principal do site
jornadadesi.html               landing page "Jornada de Si" (funil de vendas)
politica-de-privacidade.html   política de privacidade geral do site
netlify.toml                   publish = ".", functions = "netlify/functions"
css/style.css                  CSS compartilhado por todo o site, inclusive
                                o padrão de scroll-reveal (.reveal / .reveal.in,
                                ver seção própria abaixo)
images/                        imagens do site (várias subpastas)
quiz/                          Quiz "O que está pedindo mais atenção em você?"
  index.html                   página do quiz (vive em /quiz/)
  privacidade.html             aviso de privacidade ESPECÍFICO do quiz
  css/quiz.css                 estilos do quiz
  js/core.js                   configuração central: fases, perguntas, pontuação
  js/app.js                    interface do quiz (telas, progresso, envio)
  js/email.js                  monta o HTML/texto do e-mail de resultado
netlify/functions/
  enviar-resultado.mjs         recebe as respostas, calcula o resultado,
                                envia o e-mail e salva propriedades no Resend
  exportar-contatos.mjs        exporta todos os contatos do Resend (com
                                propriedades) em CSV — ver seção própria
quiz-jornada/                  PASTA ANTIGA/DESCARTADA. Está no .gitignore,
                                nunca foi enviada ao git nem ao site. É um
                                protótipo anterior do quiz (tem seu próprio
                                LEIA-ME.md e testes) que foi substituído pelo
                                que está em quiz/ hoje. Ignore esta pasta a
                                menos que alguém peça explicitamente para
                                recuperar algo de lá — não é código "vivo".
```

## O Quiz (versão 2)

- Config central em `quiz/js/core.js`. `QUIZ_VERSION = 2` — o servidor
  (`enviar-resultado.mjs`) recusa envios de uma versão antiga do quiz
  (resposta `409 outdated`), para proteger contra alterações de pontuação
  no meio do caminho.
- 10 perguntas (`p1`–`p10`):
  - `p1`: funil/perfil (não pontua fase, personaliza o convite final do
    e-mail).
  - `p2`–`p6`: pontuam uma das 5 fases (`faseOpt`) — cada opção soma 1
    ponto para uma fase.
  - `p7`–`p10`: funil (`funilOpt`), não pontuam fase. São as perguntas sobre
    formato preferido, tempo disponível, obstáculo e prontidão — hoje
    também usadas para personalizar conteúdos de marketing (ver seção do
    Resend).
- 5 fases possíveis (`PHASES`): Raízes, Libertação, Fortalecimento,
  Acolhimento, Visão de futuro — cada uma com nome, descrição, atividade
  reflexiva e prompts, usados para montar o e-mail de resultado.
- `resolveResult` decide a fase final (ou um "empate" entre fases, com tela
  de desempate no front-end) e `getProfile` lê a resposta de `p1` para
  personalizar o convite comercial no fim do e-mail.
- `quiz/js/app.js` monta a interface (telas de pergunta, telas
  intermediárias/interstitials, barra de progresso, formulário final) e
  guarda progresso em `sessionStorage` sob a chave `jornada-quiz-v2`.
- `quiz/js/email.js` monta o assunto, HTML e texto do e-mail de resultado.
- **Importante sobre testar localmente**: o quiz usa `<script type="module">`,
  que o navegador bloqueia por CORS se você só der duplo-clique no arquivo
  (`file://...`). Para testar localmente é preciso servir por HTTP, por
  exemplo `python3 -m http.server` dentro da pasta e abrir
  `http://localhost:8000/quiz/`. Fora isso, o jeito mais simples de ver o
  resultado real é publicar (`git push`) e testar direto em produção.

## Netlify Functions

Ambas são "serverless functions" que só funcionam depois de deploy via git
(deploy por arrastar-e-soltar não confia nas functions, segundo a própria
documentação da Netlify) — outro motivo para sempre publicar via git push.

### `enviar-resultado.mjs` — `/api/enviar-resultado`

Recebe as respostas do quiz, recalcula o resultado no servidor (nunca
confia no cálculo feito no navegador), envia o e-mail pelo Resend e,
se a pessoa autorizou receber conteúdos futuros, salva/atualiza o contato
no Resend com propriedades customizadas:

- `fase_quiz`, `fase_quiz_modo` (sempre, se `RESEND_SEGMENT_ID` existir)
- `quiz_formato`, `quiz_tempo`, `quiz_obstaculo`, `quiz_prontidao` (respostas
  de `p7`–`p10`, só se essas 4 propriedades já existirem cadastradas no
  Resend — ver abaixo)

Tem um fallback: tenta salvar as 6 propriedades juntas; se falhar (ex.: as
4 novas ainda não foram cadastradas no Resend), tenta de novo só com as 2
antigas, para nunca quebrar o que já funcionava.

Variáveis de ambiente (Netlify > Site configuration > Environment variables):
- `RESEND_API_KEY` (obrigatória)
- `EMAIL_FROM` (obrigatória, domínio precisa estar verificado no Resend)
- `EMAIL_REPLY_TO` (opcional)
- `RESEND_SEGMENT_ID` (opcional — sem ela, não salva nada no Resend)
- `ALLOWED_ORIGINS` (opcional, default é o próprio domínio do site)

**Atenção, pré-requisito no painel do Resend**: toda "contact property"
customizada precisa ser criada antes em Contacts → Properties (ou via API
`POST /contact-properties`) para aceitar valores. `fase_quiz` e
`fase_quiz_modo` já existiam; `quiz_formato`, `quiz_tempo`,
`quiz_obstaculo`, `quiz_prontidao` foram criadas por Renata em 12/10/2026.

### `exportar-contatos.mjs` — `/api/exportar-contatos?token=...`

Ferramenta permanente (não é algo de uso único) para exportar todos os
contatos do Resend com todas as propriedades em um CSV — algo que o próprio
painel do Resend não oferece (a exportação de lá não inclui propriedades
customizadas; só é possível ver propriedade por propriedade, abrindo
contato por contato).

- Protegida por uma variável de ambiente `EXPORT_TOKEN` (marcada como
  "Contains secret values" no Netlify). Sem ela, ou com o token errado na
  URL, responde 403/503.
- Usa a `RESEND_API_KEY` já configurada — não precisa de nenhuma chave nova.
- Basta abrir a URL com o token certo no navegador: o CSV é baixado na
  hora, sempre com os dados mais atuais (não é um arquivo fixo — cada clique
  busca tudo de novo no Resend).
- **Por que esta function foi necessária**: de dentro de um ambiente de IA
  em nuvem (como o Claude Code / Cowork rodando em container), chamadas
  diretas para `api.resend.com` podem ser bloqueadas pela política de rede
  do ambiente (confirmado em 12/10/2026 — erro `connect_rejected`/403 no
  proxy de saída). A Netlify, por outro lado, já consegue falar com a API
  do Resend normalmente (é assim que `enviar-resultado.mjs` sempre
  funcionou). Então, sempre que uma tarefa precisar chamar uma API externa
  que o ambiente de IA não conseguir acessar diretamente, o padrão é: criar
  ou reaproveitar uma Netlify Function para fazer a chamada, e acessá-la
  por uma URL protegida por token — em vez de tentar repetidamente contornar
  o bloqueio de rede.

## `jornadadesi.html` — efeito de rolagem (scroll-reveal)

O site já tem um mecanismo de scroll-reveal pronto, reaproveitado (não
duplicado) ao implementar o efeito nesta página:
- CSS em `css/style.css`: classes `.reveal` (estado inicial, opacidade 0 e
  deslocado) e `.reveal.in` (estado visível, aplicado via JS).
- A ativação usa `IntersectionObserver`, já embutido no `<script>` inline
  de `jornadadesi.html` — adiciona a classe `.reveal` nos blocos de seção
  e a classe `.in` é adicionada quando o bloco entra na viewport.
- Se for adicionar scroll-reveal em outra página, reaproveite esse mesmo
  padrão em vez de criar um novo.

## Privacidade / LGPD

- `politica-de-privacidade.html`: política geral do site.
- `quiz/privacidade.html`: aviso específico do quiz, com uma seção
  "Autorização para conteúdos futuros (opcional)" que já descreve
  explicitamente que, quando marcada, guardamos e-mail, nome, a fase do
  resultado E as respostas de `p7`–`p10` — e que, sem essa marcação, nada é
  guardado. Se o conjunto de dados coletados mudar de novo, esse texto
  precisa ser atualizado também (é a base legal / transparência do
  consentimento, art. 7º, I da LGPD).
- Perguntas de funil (formato/tempo/obstáculo/prontidão) não são "dados
  sensíveis" pela LGPD (art. 11 cobre dado racial/saúde/religião/biometria
  etc., não preferências gerais como essas).

## Como trabalhar nesta pasta a partir de uma sessão de IA em nuvem

Pontos específicos deste projeto, aprendidos na prática, que valem para
qualquer assistente de IA que continue este trabalho a partir de uma sessão
em nuvem (sem acesso a shell no computador do usuário):

1. **Esta pasta é, ao mesmo tempo, a cópia de trabalho E o repositório git
   de produção.** Editar e sincronizar arquivos aqui é seguro e reversível,
   mas isso **não** publica nada — só o `git add` + `commit` + `push` (feito
   por Renata ou João) publica de fato. Depois de sincronizar qualquer
   arquivo, deixe claro para a pessoa que ainda falta esse passo.
2. **Sem `device_bash`/shell no dispositivo**: normalmente não é possível
   rodar comandos (incluindo git) no computador da Renata. Toda edição
   precisa ser feita escrevendo o arquivo e enviando via as ferramentas de
   sincronização de arquivo disponíveis (que de modo geral escrevem na pasta
   `/mnt/user-data/outputs/` antes de serem efetivamente copiadas para o
   dispositivo).
3. **Sempre reverifique a sincronização byte a byte.** Uma ferramenta de
   sincronização pode reportar sucesso mesmo quando o conteúdo final no
   dispositivo não é o esperado (já aconteceu nesta conversa: sucesso
   relatado, mas o arquivo no dispositivo ficou com o conteúdo antigo).
   Depois de copiar, leia o arquivo de volta do dispositivo e confira que
   bate (tamanho em bytes no mínimo, idealmente hash/diff) antes de dizer
   que terminou.
4. **Chamadas de rede para APIs externas (ex.: Resend) podem estar
   bloqueadas** a partir do ambiente de IA em nuvem, mesmo quando a mesma
   chamada funciona normalmente a partir da Netlify. Não insista tentando
   contornar — o padrão que funcionou aqui foi: fazer a chamada de dentro de
   uma Netlify Function (que já tem acesso) e expor isso por uma URL
   protegida por token, visitada manualmente pela Renata no navegador.
5. **Não deixe segredos (chaves de API, tokens) escritos direto no código
   fonte.** Use variáveis de ambiente da Netlify. Tokens de acesso temporário
   que a Renata compartilhar no chat para uma tarefa pontual devem ser
   tratados como descartáveis — avise para revogar depois que não forem mais
   necessários (e, quando possível, prefira uma solução que nem precise
   deles, como foi o caso do `exportar-contatos.mjs`, que usa a chave já
   configurada em produção em vez de uma nova).
6. **Teste a lógica pura (funções sem I/O) com `node --test` sempre que
   possível** antes de publicar algo que toca e-mail/API/dados de contato —
   isso pegou bugs reais neste projeto. Esses testes não ficam hoje
   versionados nesta pasta (ficam em pastas de rascunho da sessão de IA); se
   for útil manter cobertura de teste de forma permanente, considere criar
   uma pasta `tests/` aqui e commitar.
