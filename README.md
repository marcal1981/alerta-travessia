# Alerta Travessia IA

Plataforma de monitoramento e previsão probabilística de risco para a travessia de
balsa entre **São Sebastião** e **Ilhabela**.

> Esta previsão possui caráter informativo e não substitui os comunicados oficiais.
> A decisão sobre a operação da travessia é sempre da operadora responsável — o
> Índice de Risco da Travessia (IRT) nunca deve ser confundido com o Status Oficial.

## O que este projeto entrega (Fase 1)

Esta é uma **Fase 1 real e funcional**, não um mockup estático: o app roda, calcula
o índice de risco a partir de leituras meteorológicas, projeta 4 horizontes de
previsão, e tem um painel administrativo com pesos de algoritmo ajustáveis.

O que **não** é real ainda, por decisão deliberada (para não fingir uma integração
que não existe):

| Módulo | Status na Fase 1 | Para virar real |
|---|---|---|
| Leituras meteorológicas | **Real**, via Open-Meteo (`src/services/providers/openMeteoProvider.ts`) — combina a Forecast API (temperatura, pressão, umidade, vento, chuva, visibilidade) e a Marine API (altura/período de onda). Sem chave de API. Cai para dado simulado automaticamente se a chamada falhar. | Adicionar outros provedores (INMET, StormGlass, NOAA) seguindo o mesmo padrão de `WeatherProvider` |
| Maré | **Real**, edição 2026 (Marinha/CHM), cobrindo 21-27 de julho de 2026 | Extrair os demais meses do mesmo PDF pra cobrir o ano inteiro |
| Status Oficial da travessia | Atualização manual (em memória) | Ligar a uma API oficial da operadora/porto em `src/services/officialStatusService.ts` |
| Histórico | Array em memória | Firestore, quando `.env.local` tiver as credenciais (ver `.env.example`) |
| Autenticação / Usuários / Logs do Admin | Não implementado | Firebase Auth + Firestore |
| Notificações (Push/WhatsApp/Telegram/Email) | Não implementado | Cloud Messaging + integrações de mensageria |
| Radar, ondas, nuvens, chuva no mapa | Placeholders desabilitados no `MapPanel` | Provedores de tile externos (ex. RainViewer, Windy Map API) |
| PWA completo (ícones, service worker) | `manifest.json` mínimo | Gerar ícones e adicionar `next-pwa`/Workbox |

Essa tabela é o contrato: qualquer pessoa (ou eu, numa próxima sessão) sabe exatamente
o que trocar e onde, sem precisar reler todo o código.

## Por que a arquitetura foi feita assim

O ponto central do produto é a separação entre duas coisas que o brief pede para
**nunca misturar**:

1. **Status Oficial** (`officialStatusService.ts`) — fato, definido por humano/API oficial.
2. **MPT / Índice de Risco** (`riskEngine.ts`) — estimativa probabilística de IA.

Por isso são dois serviços independentes, com tipos diferentes (`OfficialStatus` vs
`MptResult`), e a UI (`StatusPanel` vs `RiskGauge`/`AIExplanation`) os renderiza em
componentes visualmente distintos, nunca fundidos num único número.

O motor de risco (`computeRiskIndex`) é uma combinação ponderada e **explicável**
(não uma caixa-preta): cada peso é editável no Admin, e `extractRiskFactors` sempre
consegue apontar qual variável mais empurrou o índice — é isso que alimenta a frase
gerada em `AIExplanation` ("O risco foi classificado como... principalmente devido a...").

## Nevoeiro como sinal categórico

O Departamento Hidroviário (DH), órgão que opera a travessia, divulgou publicamente que
cerca de **90% das paralisações recentes foram causadas por neblina/nevoeiro** — não por
vento ou ondas, que costumam ser o que se imagina primeiro. Por isso, o MPT não trata
nevoeiro como só "visibilidade baixa contínua": ele lê o código de tempo (WMO) que o
Open-Meteo já retorna, identifica os códigos 45/48 (nevoeiro) e aplica um peso extra
(`fogBoost`, editável no Admin) especificamente para esse sinal categórico. Isso está em
`src/services/providers/openMeteoProvider.ts` (leitura do `weather_code`) e
`src/services/riskEngine.ts` (uso do `isFog` no cálculo e como fator explicado ao usuário).

## Maré — cálculo local, sem API

A maré é 100% previsível astronomicamente: uma vez com a tábua oficial da Marinha
(CHM) para o ano corrente, não é preciso chamar API nenhuma pra "saber a maré agora" —
é só interpolação matemática sobre uma tabela (`src/services/tideService.ts`).

Existe uma regra oficial usada pela operadora da travessia: **caminhões de 3+ eixos
são proibidos de embarcar quando a maré cai abaixo de 0,5m** (rampas ficam íngremes
demais). Isso está codificado em `LOW_TIDE_TRUCK_RESTRICTION_M` (`src/types/index.ts`)
e aparece como aviso destacado no Painel Meteorológico quando ativo.

**Estado atual dos dados:** `src/data/sampleTideExtremes.ts` contém dados **reais** da
edição 2026 da tábua oficial (Marinha/CHM), extraídos por coordenadas de texto do PDF
(não por leitura visual, pra evitar erro de dígito) — mas cobrindo apenas 21 a 27 de
julho de 2026. Fora dessa janela, `tideM` volta a ser `null`. Para cobrir o ano inteiro,
repetir o mesmo processo de extração pros demais meses do mesmo PDF e anexar os pontos
ao array, no mesmo formato.

Fora do intervalo coberto pelos dados carregados, `tideM` permanece `null` — o app
nunca inventa um valor de maré.

## Janela de Embarque para Caminhões (`/caminhoes`)

Funcionalidade B2B pra transportadoras: mostra, por categoria de veículo (leve, VUC/toco,
3 eixos, 4+ eixos) e por sentido, se o embarque está liberado agora — combinando a
**Resolução Semil nº 79/2023** (horários fixos por categoria/dia/sentido) com a
**maré medida em tempo real** (regra dos 0,5m).

Isso é deliberadamente um serviço separado do MPT (`truckRestrictionService.ts`, não
`riskEngine.ts`): é uma regra determinística da lei, não uma estimativa de IA — misturar
os dois seria enganoso.

**Limitação documentada:** a resolução também estende os horários de restrição em
vésperas de feriado prolongado e no primeiro dia útil após — isso exige um calendário
de feriados nacionais/estaduais que ainda não está implementado (ver `TODO` no final de
`truckRestrictionService.ts`). Fora de feriados, a regra semanal está completa e testada.

## Câmeras e Tempo de Espera Oficiais

O Dashboard mostra as 9 câmeras oficiais do Departamento Hidroviário (5 em São
Sebastião, 4 em Ilhabela) e o tempo de espera publicado por eles, direto da
infraestrutura própria do governo (`dhapp3.azurewebsites.net`) — não usa nenhum proxy
de terceiro.

**Como funciona:** as câmeras são `<img>` simples (URLs oficiais, sem necessidade de
CORS). Já o tempo de espera não tem API JSON documentada — `src/app/api/dh-status/route.ts`
é uma rota de servidor que busca a página oficial (`semil.sp.gov.br/travessias/...`) e
extrai o texto "Tempo de Espera X minutos" por regex. Isso roda no servidor (não no
navegador do usuário) especificamente pra evitar bloqueio de CORS.

**Limitação documentada, não escondida:** por não ser uma API oficial e sim leitura de
HTML público, se o Departamento Hidroviário mudar o layout do site, essa extração pode
parar de funcionar silenciosamente até ser ajustada — por isso a rota sempre retorna
`null`s em vez de quebrar o Dashboard quando falha. O próprio site já mostrou um aviso
de "sistema instável" durante o desenvolvimento — esse aviso é repassado ao usuário
quando presente.

**Recomendação pra próxima fase:** ao propor a solução pro governo, pedir acesso oficial
a um endpoint estável (JSON) pra fila e câmeras é um pedido concreto e razoável — muito
mais sustentável que depender de scraping de HTML.

## Alerta Antecipado — Monitor Regional (Santos, Paraty, Oceano)

O IRT "Agora" continua 100% baseado em medição local do canal — isso nunca muda. Mas
os horizontes futuros de previsão (1h/2h/3h/5h) podem ser reforçados quando
`regionalWatchService.ts` detecta chuva forte, vento forte ou mar agitado em 3 pontos
de referência, cada um cobrindo um vetor físico diferente:

- **Santos** (SO, ~97km, confiança alta): frentes frias nesta costa se deslocam de
  Sul/Sudoeste para Nordeste — padrão climatológico bem documentado.
- **Paraty** (NE, ~95km, confiança **baixa**, marcado explicitamente na UI): a mesma
  faixa de litoral costuma ficar instável junto com São Sebastião/Ilhabela, mas não
  necessariamente por um sistema "viajando" de um pro outro — é mais um sinal de "a
  região toda está instável" do que uma previsão direcional confiável.
- **Ponto oceânico** (L, ~100km em alto-mar, confiança alta): ciclones extratropicais
  se formam no próprio oceano e avançam pra costa perpendicular a ela — fenômeno real
  e documentado (a Marinha do Brasil tem um serviço oficial só pra isso). Detectado por
  vento forte + onda alta no ponto (Marine API), não por chuva.

O reforço cresce gradualmente até o ETA estimado (distância ÷ velocidade do vento) —
nunca afeta o horizonte "Agora". Deliberadamente **não** se aplica a nevoeiro: neblina
se forma localmente, não se desloca como uma célula de chuva.

**Coleta de histórico (Etapa 1 da auto-calibração):** todo alerta detectado é registrado
em `firebase/firestore.ts` (`logRegionalAlert`), visível no Admin. Ainda **não** há
ajuste automático de confiança — com histórico zerado, isso seria só ruído estatístico.
A Etapa 2 (comparar o que foi previsto com o que realmente aconteceu, e recalibrar a
confiança de cada ponto com base na taxa de acerto real) só faz sentido depois de meses
de dado acumulado, e precisa do Firebase configurado de verdade — sem isso, o log se
perde a cada recarregamento.

## Layout do Dashboard (revisão)

- Mapa removido — a versão anterior não tinha função clara além de mostrar 2 pontos
  fixos, e os 4 botões de camadas (Radar/Ondas/Nuvens/Chuva) nunca chegaram a funcionar.
  Pode voltar numa Fase futura com uma função concreta (ex. mostrar a localização de
  cada câmera no mapa).
- Tempo de espera oficial fundido no painel de Status Oficial, com texto grande —
  informação considerada de alta prioridade pelo usuário.
- Painel Meteorológico reposicionado para logo depois da Previsão.
- Legendas das câmeras (distância até a balsa) agora sempre visíveis, não só no hover.
- Cartões de previsão simplificados para 1h/2h/3h/5h (removidos "Agora" e "30 minutos",
  redundantes com o medidor de risco principal).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional na Fase 1 — o app roda sem isso, com dados simulados
npm run dev
```

Abra `http://localhost:3000` para a Home, `/dashboard` para o painel principal e
`/admin` para o painel administrativo.

## Estrutura de pastas

```
src/
  app/            # rotas (Next.js App Router): home, /dashboard, /admin
  components/     # UI: Hero, RiskGauge, StatusPanel, ForecastCards, WeatherPanel, MapPanel, AIExplanation
  services/       # weatherService, riskEngine (MPT), officialStatusService
  hooks/          # useCrossingRisk (polling + orquestração de estado)
  firebase/       # config.ts (stub) e firestore.ts (histórico)
  types/          # contrato de dados único, usado por serviços e componentes
  context/        # reservado para Fase 2 (ex. contexto de autenticação)
  utils/          # reservado para Fase 2
```

## Design

Tema escuro fixo (o brief pede dark theme como identidade, não como opção alternável).
Paleta: fundo azul-marinho profundo (`abyss`/`navy`), branco e cinza para texto/dados,
laranja e vermelho para os dois níveis mais altos de risco, e um acento ciano (`tide`)
para dados meteorológicos — inspirado no vocabulário visual de Windy/instrumentos
náuticos. O elemento de assinatura é o `RiskGauge`: um instrumento circular graduado
em 4 zonas com ponteiro animado, no espírito de um painel de bordo/aeronáutico,
porque é literalmente o que o brief pediu ("velocímetro animado") — só que tratado
como uma peça de design deliberada, não um componente genérico de biblioteca.

## Próximos passos sugeridos (Fase 2)

1. Escolher e implementar **um** provedor meteorológico real primeiro (Open-Meteo é o
   mais simples, sem chave de API) para validar o `MPT` com dado real.
2. Configurar o projeto Firebase e ligar `firestore.ts` + Firebase Auth.
3. Definir o processo de atualização do Status Oficial com a operadora da balsa.
4. Cloud Function agendada (Cloud Scheduler) rodando `runMpt` periodicamente e
   gravando no histórico, em vez do polling client-side atual.
5. Camadas de radar/ondas no mapa, cadastro de notificações, PWA completo.
