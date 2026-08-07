# Alerta Travessia IA

Plataforma de monitoramento e previsão probabilística de risco para a travessia de
balsa entre **São Sebastião** e **Ilhabela**.

> Esta previsão possui caráter informativo e não substitui os comunicados oficiais.
> A decisão sobre a operação da travessia é sempre da operadora responsável — o
> Índice de Risco da Travessia (IRT) nunca deve ser confundido com o Status Oficial.

---

## Regra de ouro do produto

Duas coisas que o app **nunca** mistura, em nenhuma tela:

1. **Status Oficial** (`officialStatusService.ts`) — fato, definido por humano/API oficial.
2. **MPT / Índice de Risco** (`riskEngine.ts`) — estimativa probabilística de IA.

São dois serviços independentes, com tipos diferentes (`OfficialStatus` vs
`MptResult`), renderizados em componentes visualmente distintos (`StatusPanel` vs
`RiskGauge`/`AIExplanation`). A única exceção documentada é a sobreposição de "tempo
de espera zerado" (ver seção própria abaixo) — e mesmo essa só altera o que é
**exibido**, nunca o valor real salvo no Admin.

---

## Estado real de cada módulo

| Módulo | Status | Observação |
|---|---|---|
| Leituras meteorológicas | **Real** (Open-Meteo) | Sem chave de API; cai para simulado se a chamada falhar |
| Maré | **Real**, mas parcial | Tábua oficial (Marinha/CHM) 2026, cobrindo só 21-27/jul/2026. Fora disso, `tideM` é `null` — nunca inventado |
| Câmeras oficiais | **Real** | 9 câmeras, infraestrutura própria do governo (`dhapp3.azurewebsites.net`) |
| Tempo de espera + balsas em operação | **Real**, via scraping | `api/dh-status/route.ts` lê `semil.sp.gov.br` por regex (sem API JSON oficial) |
| Status Oficial | Manual (Admin) | Sobreposto automaticamente quando tempo de espera zera nos dois lados (ver abaixo) |
| Firebase / Firestore | **Real**, não é mais stub | Grava e lê de verdade quando configurado; ver seção própria |
| Alerta Antecipado Regional | **Real**, parcialmente validado | Ver seção própria — Paraty e aquecimento pré-frontal ainda sem validação numérica completa |
| Autenticação / Usuários | Não implementado | Precisaria de Firebase Auth |
| Notificações (Push/WhatsApp/Telegram) | Não implementado | — |
| Radar/ondas/nuvens no mapa | Removido (era placeholder) | Mapa tirado do Dashboard por falta de função real |
| Contador de acesso | **Real quando o Firebase está configurado** | Firestore (`meta/visit_count`, incremento atômico); sem Firebase configurado cai para memória e zera a cada deploy/reinício — Admin exibe aviso quando isso acontece |

---

## Motor de Risco (MPT) — arquitetura e recalibração

`computeRiskIndex()` (em `riskEngine.ts`) **não é** uma média ponderada simples.
Isso foi uma decisão corrigida depois de um problema real: com média ponderada, um
usuário reportou que o medidor mostrava "risco baixo" no mesmo momento em que o
gráfico de rajadas já mostrava "Risco de Interrupção" — porque nenhum fator sozinho
conseguia superar seu próprio peso na média, mesmo com rajada crítica de verdade
acontecendo.

**Estrutura atual:**
- **Rajada de vento é a base dominante** (80% do cálculo), numa escala já alinhada
  aos limiares reais validados: **20km/h** (Operando→Alerta), **35km/h**
  (Alerta→Risco), **46km/h** (limiar oficial de fechamento — confirmado via 2
  notícias independentes citando a Semil: "25 nós", que equivale a 46km/h).
- Fatores secundários (vento sustentado, onda, período, visibilidade, chuva)
  ajustam os 20% restantes.
- **Nevoeiro** e **alerta oficial** são reforços somados diretamente por cima da
  base — cada um capaz de elevar o índice sozinho, sem depender de outros fatores.
  Nevoeiro tem peso alto porque o DH relatou que ~90% das paralisações recentes
  foram causadas por neblina.

Cenários validados manualmente antes de aplicar esta calibração:

| Cenário | IRT resultante | Classificação |
|---|---|---|
| Dia calmo (rajada 15km/h) | 15 | Baixo |
| Rajada exatamente no limiar crítico (46km/h) | 80 | Alto (já mostra "Risco de Interrupção") |
| Rajada severa (70km/h) | 85 | Muito Alto |
| Nevoeiro sozinho, vento calmo | 41 | Atenção |

O gráfico de **Linha do Tempo Preditiva** usa os mesmos limiares (20/35/46km/h)
sobre a **rajada prevista** (não vento sustentado) hora a hora, via Open-Meteo —
por isso medidor e gráfico agora concordam.

---

## Sobreposição: tempo de espera zerado nos dois lados

**Observação prática, ainda não confirmada em documento oficial** (tratada como
heurística revisável, documentada em `src/app/page.tsx`): o Departamento
Hidroviário parece zerar o tempo de espera dos dois lados (0min/0min) quando a
travessia está de fato **parada** — não quando está fluindo sem fila.

Quando isso é detectado, tanto o `RiskGauge` quanto o `StatusPanel` exibido são
sobrepostos para "Risco de Interrupção" / "Interrompida" — sem alterar o valor real
salvo no Admin. Se algum dia aparecer um contra-exemplo (0min/0min num dia normal,
sem fila), esta regra precisa ser revista.

---

## Alerta Antecipado — Monitor Regional

O IRT "Agora" nunca é afetado por isto — só os horizontes futuros de previsão.
`regionalWatchService.ts` monitora 4 sinais:

| Sinal | Direção/Local | Confiança | Status de validação |
|---|---|---|---|
| Santos | SO, ~97km | Alta | Fundamentado climatologicamente (frentes frias vêm de SO nesta costa) |
| Paraty | NE, ~95km | **Baixa** | Sinal de "região instável", não de sistema viajando de um lado pro outro |
| Ponto oceânico | L, ~100km em alto-mar | Alta | Detecta ciclone extratropical via vento+onda, não chuva |
| Aquecimento pré-frontal | Local (canal) | Alta (mas não validado) | Repassado por velejador experiente; script de validação pronto mas ainda não rodado com dado real |

**Achado importante do backtest** (`analise-historica.mjs`, contra os 7 fechamentos
reais mapeados): nenhum dos 3 pontos regionais detectou com antecedência os
fechamentos "de rotina" por vento — a rajada que fecha a balsa parece se formar/
intensificar **localmente no canal**, não vindo de fora com antecedência
detectável por esses pontos. Isso não invalida a ideia (pode ajudar em eventos raros
e severos), mas é uma limitação real, não escondida.

---

## Nevoeiro como sinal categórico

O MPT não trata nevoeiro como "visibilidade baixa contínua" — lê o código de tempo
(WMO) do Open-Meteo, identifica os códigos 45/48 (nevoeiro) e aplica um peso extra
(`fogBoost`), porque o DH relatou que ~90% das paralisações recentes tiveram essa
causa.

---

## Maré — cálculo local, sem API

Maré é 100% previsível astronomicamente: com a tábua oficial da Marinha (CHM) para
o ano corrente, não é preciso chamar API nenhuma — é interpolação matemática sobre
uma tabela (`tideService.ts`).

Existe uma regra oficial: **caminhões de 3+ eixos são proibidos de embarcar quando
a maré cai abaixo de 0,5m** (`LOW_TIDE_TRUCK_RESTRICTION_M`).

**Estado atual dos dados:** `sampleTideExtremes.ts` contém dados **reais** da edição
2026 (extraídos por coordenadas de texto do PDF, não por leitura visual), cobrindo
só 21-27/jul/2026. Fora disso, `tideM` é `null`. Para cobrir o ano inteiro, repetir a
extração pros demais meses do mesmo PDF.

---

## Janela de Embarque para Caminhões (`/caminhoes`)

Funcionalidade B2B: mostra, por categoria de veículo e sentido, se o embarque está
liberado — combinando a **Resolução Semil nº 79/2023** (horários fixos) com a maré
medida em tempo real (regra dos 0,5m). Serviço deliberadamente separado do MPT
(`truckRestrictionService.ts`): é regra determinística da lei, não estimativa de IA.

**Limitação documentada:** não considera vésperas de feriado prolongado (exigiria
calendário de feriados nacionais/estaduais) — ver `TODO` no arquivo.

---

## Câmeras, Tempo de Espera e Balsas em Operação

9 câmeras oficiais (5 São Sebastião, 4 Ilhabela), com legenda de distância até a
balsa sempre visível. Tempo de espera e número de balsas em operação vêm de
`api/dh-status/route.ts`, uma rota de servidor que lê `semil.sp.gov.br` por regex
(não existe API JSON oficial documentada).

**Bug real corrigido:** o número de balsas em operação nunca aparecia, porque a
página oficial escreve por **extenso** ("quatro embarcações em operação"), não em
dígito — o regex antigo só procurava dígito. Corrigido com suporte a ambos os
formatos. Agora exibido no `StatusPanel`, com nota explicando que menos balsas
costuma significar fila maior mesmo sem mau tempo — confirmado com um caso real ao
vivo (fila de 120min num dia com só 4 balsas rodando, sem vento forte envolvido).

**Limitação documentada:** por depender de leitura de HTML (não API), se o DH mudar
o layout do site, a extração pode parar de funcionar até ser ajustada — por isso a
rota sempre retorna `null`s em vez de quebrar o Dashboard.

---

## Firebase — implementação real

`firebase/firestore.ts` grava e lê do Firestore de verdade quando configurado
(coleções `history`, `regional_alert_log`, `forecast_snapshots`). Enquanto não
configurado, opera em memória (perde tudo ao recarregar a página).

**Passo a passo para ativar:**
1. Criar projeto em https://console.firebase.google.com
2. Ativar Firestore Database (região `southamerica-east1` recomendada)
3. "Configurações do projeto" → "Seus apps" → adicionar app Web → copiar credenciais
4. Preencher como variáveis de ambiente `NEXT_PUBLIC_FIREBASE_*` no painel Node.js
   da Hostinger
5. Configurar regras de segurança do Firestore (por padrão bloqueia tudo)

## Validação de Acurácia de Antecedência

A API que permite reconstruir previsões passadas (Single Runs API do Open-Meteo) só
tem arquivo a partir de abril/2026 — só 1 dos 7 fechamentos reais mapeados é recente
o suficiente pra testar (ver `teste-antecedencia.mjs`). A validação de verdade é
**prospectiva**: `forecastSnapshotService.ts` captura um retrato da previsão a cada
hora, guardado via Firebase — depois de semanas acumuladas, dá pra comparar previsto
x realizado. Só funciona de verdade com Firebase configurado.

---

## Hospedagem: Hostinger (Node.js), não Vercel

O projeto roda num plano Node.js da Hostinger com processo persistente — isso é
diferente de plataformas serverless (Vercel) e importa para uma feature:

- **Contador de acesso** (`api/visit-count/route.ts`): grava no Firestore
  (`firebase/firestore.ts`), não em arquivo — um arquivo dentro da pasta do projeto
  não sobreviveria a um deploy que apaga a pasta inteira antes de extrair o zip novo
  (foi exatamente isso que zerou o contador no passado). Sem `NEXT_PUBLIC_FIREBASE_*`
  configurado no painel Node.js da Hostinger, o contador cai para memória do processo
  — sobrevive a requisições normais, mas zera a cada deploy/reinício, já que o
  processo Node é substituído. O Admin (`/admin`) mostra um aviso quando está nesse
  estado não-persistente.
- **Cache-Control:** as páginas usam `no-store, must-revalidate` (exceto
  `/_next/static/*`, que tem nome de arquivo único por versão e pode cachear com
  segurança). Isso corrigiu um caso real onde celular e PC mostravam versões
  diferentes do site simultaneamente, mesmo em aba anônima — sinal de cache
  intermediário (proxy/operadora) guardando a página pelo endereço exato.

**Processo de deploy:** mantém sempre a mesma pasta local (evita reinicializar
histórico do Git); extrai o zip novo por cima da pasta existente, sem apagar `.git`.
Comandos: `git add -A` / `git commit -m "..."` / `git push origin master`.

---

## Layout do Dashboard

- **Página inicial removida** — o Dashboard é a própria raiz (`/`). `/dashboard`
  apenas redireciona para `/`, para não quebrar links antigos.
- Mapa removido (sem função real além de mostrar 2 pontos fixos).
- Tempo de espera e balsas em operação fundidos no painel de Status Oficial.
- Painel Meteorológico posicionado depois da Previsão.
- Gráfico de Linha do Tempo (00h-23h, rajada real hora a hora) substituiu os antigos
  cartões estáticos de previsão.
- Legenda de cores do gráfico (Operando/Alerta/Risco de Interrupção) fica **fora**
  do SVG, como uma legenda comum — texto embutido no gráfico causava deformação em
  telas estreitas.
- Nome "Alerta Travessia IA" com fonte responsiva (menor no celular).
- Ícone: barco (favicon + logo), não mais onda.
- Rodapé com créditos: Dev. Alekson Marçal.

---

## Correção de bug real: cor do gráfico não batia com o valor

O gráfico usava um gradiente de preenchimento com `gradientUnits` padrão do SVG
(`objectBoundingBox`), cuja referência de 0-100% é a **caixa delimitadora da própria
curva** (o pico do dia), não a escala fixa do eixo Y — então num dia com pico de
42km/h (abaixo do limiar real de 46km/h), a cor vermelha (crítica) já aparecia
visualmente. Um usuário reportou isso, com print confirmando.

**Correção validada visualmente** (renderizada de verdade com Recharts + Playwright,
não só no código): trocado para `gradientUnits="userSpaceOnUse"` com coordenadas em
pixel absoluto (`y1={8} y2={250}`, calculadas a partir da altura real do gráfico
280px, descontando margem superior e altura do eixo X) — mantém o preenchimento em
formato de "montanha" (subindo/descendo com a curva, visual preferido pelo usuário),
mas agora a cor é ancorada na escala real do eixo, não no pico do dia. Testado e
confirmado pelo usuário com print antes/depois.

## Números do eixo Y para dentro do gráfico + métrica alternativa de balsas

Os números do eixo Y da Linha do Tempo agora ficam **dentro** da área do gráfico
(translúcidos, mesma fonte), liberando o espaço lateral que antes era reservado só
pros números — o gráfico ganha mais largura útil.

**Balsas em operação — segunda métrica adicionada:** achamos que a Semil às vezes
reporta por **contagem** ("quatro embarcações em operação") e às vezes por
**percentual de capacidade** ("opera com 49% da capacidade operacional") — são
métricas diferentes, não convertíveis uma na outra sem saber o tamanho da frota do
dia. `api/dh-status/route.ts` agora tenta os dois padrões; o `StatusPanel` mostra
qualquer um dos dois que vier disponível.

## Medidor: espaçamento e legibilidade do texto interno

O texto de classificação ("Risco de Interrupção" etc.) abaixo do número central
ficava próximo demais do topo/agulha do medidor. Empurrado para baixo (`pt-14`),
testado visualmente antes de aplicar (renderizado com o componente real via
Playwright, com o valor de exemplo 68 que um usuário reportou).

## Gráfico: números do eixo em valores exatos + palavras nas faixas

- Eixo Y agora mostra números **exatamente** nos limiares reais (0/20/35/46/topo),
  não mais valores redondos genéricos escolhidos automaticamente pelo Recharts —
  eliminou a confusão de "por que a faixa verde é maior que a amarela" (é porque os
  limiares reais não são espaçados igualmente, e agora os números provam isso).
- Números subiram (ficavam colados na linha tracejada, difícil de ler).
- Palavras "OPERANDO"/"ALERTA"/"RISCO DE INTERRUPÇÃO" agora aparecem direto dentro de
  cada faixa de cor, para leitura rápida sem precisar checar a legenda separada.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional — o app roda sem isso, com dados simulados
npm run dev
```

Abra `http://localhost:3000` para o Dashboard (raiz), `/caminhoes` para a janela de
embarque de caminhões, e `/admin` para o painel administrativo.

## Estrutura de pastas

```
src/
  app/            # rotas (Next.js App Router): / (dashboard), /caminhoes, /admin, /api/*
  components/     # UI: RiskGauge, StatusPanel, PredictiveTimelineChart, CamerasPanel, etc.
  services/       # riskEngine (MPT), weatherService, tideService, regionalWatchService, etc.
  hooks/          # useCrossingRisk (polling + orquestração de estado)
  firebase/       # config.ts e firestore.ts (implementação real)
  types/          # contrato de dados único, usado por serviços e componentes
  data/           # sampleTideExtremes.ts (dados reais de maré, cobertura parcial)
```

## Design

Tema escuro fixo. Paleta: fundo azul-marinho profundo (`abyss`/`navy`), branco e
cinza para texto/dados, laranja e vermelho para os níveis mais altos de risco, e um
acento ciano (`tide`) para dados meteorológicos. O elemento de assinatura é o
`RiskGauge`: instrumento circular graduado em zonas (Operando/Alerta/Risco de
Interrupção) com ponteiro animado, no espírito de um painel de bordo náutico.

## Próximos passos sugeridos

1. Rodar `analise-historica.mjs` (seção de temperatura) para validar ou descartar o
   sinal de aquecimento pré-frontal com dado real.
2. Cobrir o ano inteiro de dados de maré (repetir a extração do PDF por mês).
3. Reconsiderar o papel de Paraty como sinal regional, dado que o backtest não
   confirmou utilidade para fechamentos de rotina.
4. Configurar o Firebase de verdade (Console + variáveis de ambiente) para que o
   histórico, os alertas regionais e os retratos de previsão parem de se perder a
   cada recarregamento.
5. Calendário de feriados para completar a regra de restrição de caminhões.
6. Notificações (Push/WhatsApp/Telegram) e autenticação de usuários.
