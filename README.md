# 🧮 Calculadora Simples em Python com Arquitetura Hexagonal & SOLID

Uma ferramenta de cálculo modular, extensível e robusta para operações aritméticas fundamentais entre números inteiros (+, -, *, /, %), desenvolvida com **Arquitetura Hexagonal (Ports & Adapters)**, princípios **SOLID**, tratamento rigoroso de erros (incluindo divisão por zero), suíte de testes unitários com 100% de cobertura e interface web responsiva e interativa.

---

## 📌 1. Objetivo e Contexto

O objetivo deste projeto é prover uma calculadora simples e confiável para operações aritméticas básicas com números inteiros:
- **Adição (+)**
- **Subtração (-)**
- **Multiplicação (*)**
- **Divisão (/)**
- **Porcentagem (%)**: Calcula a porcentagem entre dois valores inteiros com base na fórmula `(a * b) / 100` (ex: `200 % 15 = 30`, representando 15% de 200). Retorna número inteiro para divisões exatas ou ponto flutuante com precisão decimal.

Com foco em engenharia de software de alta qualidade:
- **Separação rigorosa de responsabilidades**;
- **Isolamento completo do núcleo de negócio (Domain Core)** de interfaces e tecnologias externas;
- **Mensagens de erro amigáveis e personalizadas** para divisões por zero e dados inválidos;
- **Testabilidade total** via testes automatizados com `unittest` (33 testes com 100% de sucesso).

---

## 🏛️ 2. Arquitetura Hexagonal (Ports and Adapters)

A arquitetura hexagonal desacopla completamente as regras de cálculo aritmético do mundo externo (seja uma interface de terminal CLI, uma API REST ou um frontend web responsivo).

```
                    ┌──────────────────────────────────────────────┐
                    │               ADAPTADORES DE ENTRADA         │
                    │               (Driving Adapters)             │
                    │  • CLI Interativa (CommandLineAdapter)       │
                    │  • JSON / Web API Adapter (JsonAdapter)      │
                    │  • Frontend Web Responsivo (React + Tailwind)│
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼ chama
                    ┌──────────────────────────────────────────────┐
                    │        PORTAS DE ENTRADA (Inbound Ports)     │
                    │  • CalculatorUseCasePort                     │
                    │    - calculate(request)                      │
                    │    - get_history()                           │
                    │    - clear_history()                         │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼ implementado por
      ┌────────────────────────────────────────────────────────────────────────┐
      │                      CORE / DOMÍNIO DA APLICAÇÃO                       │
      │                                                                        │
      │  [Serviço da Aplicação]                                                │
      │  • CalculatorService                                                   │
      │                                                                        │
      │  [Modelos e Value Objects]                                             │
      │  • CalculationRequest (imutável, validação de inteiros)                │
      │  • CalculationResult (imutável com timestamp e expressão formatada)   │
      │  • OperationType (Enum: ADD, SUBTRACT, MULTIPLY, DIVIDE, PERCENT)      │
      │                                                                        │
      │  [Estratégias de Operação (Strategy Pattern)]                          │
      │  • OperationStrategy (Interface abstrata base)                         │
      │  • AdditionOperation (+)                                               │
      │  • SubtractionOperation (-)                                            │
      │  • MultiplicationOperation (*)                                         │
      │  • DivisionOperation (/) com validação de b != 0                       │
      │  • PercentageOperation (%) com cálculo (a * b) / 100                   │
      │  • OperationRegistry (Registro OCP de operações)                       │
      │                                                                        │
      │  [Exceções de Domínio]                                                 │
      │  • DivisionByZeroError ("Não é permitida a divisão por zero...")       │
      │  • InvalidOperandError / InvalidOperationError                         │
      └────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼ invoca
                    ┌──────────────────────────────────────────────┐
                    │        PORTAS DE SAÍDA (Outbound Ports)      │
                    │  • CalculationRepositoryPort                 │
                    │    - save(result)                            │
                    │    - get_all()                               │
                    │    - clear()                                 │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼ implementado por
                    ┌──────────────────────────────────────────────┐
                    │               ADAPTADORES DE SAÍDA           │
                    │               (Driven Adapters)              │
                    │  • InMemoryCalculationRepository             │
                    │  • JsonFileCalculationRepository             │
                    └──────────────────────────────────────────────┘
```

---

## 💎 3. Princípios SOLID Aplicados

| Princípio | Implementação no Projeto |
| :--- | :--- |
| **S - Single Responsibility** | Cada classe possui uma única responsabilidade. Por exemplo, `AdditionOperation` cuida apenas da adição, `PercentageOperation` cuida exclusivamente do cálculo proporcional de porcentagem `(a * b) / 100`, `DivisionOperation` cuida da divisão e da regra do divisor nulo, e `CommandLineAdapter` cuida exclusivamente da formatação no console. |
| **O - Open/Closed** | O sistema está aberto para expansão e fechado para modificação. A inclusão da operação de **Porcentagem (%)** foi realizada criando a classe `PercentageOperation` herdando de `OperationStrategy` e registrando-a no `OperationRegistry`, sem alterar uma linha sequer de `CalculatorService`. |
| **L - Liskov Substitution** | Todas as implementações de `OperationStrategy` (`AdditionOperation`, `PercentageOperation`, `DivisionOperation`, etc.) respeitam rigorosamente a assinatura `.execute(a, b)` e podem ser consumidas de forma polimórfica pelo serviço sem quebrar expectativas. |
| **I - Interface Segregation** | As portas (`CalculatorUseCasePort`, `CalculationRepositoryPort`, `OperationStrategy`) definem apenas os métodos estritamente necessários para seus consumidores, sem métodos supérfluos. |
| **D - Dependency Inversion** | O serviço de alto nível `CalculatorService` não depende de implementações concretas de repositório nem de saídas CLI/Web. Ele depende exclusivamente das abstrações `CalculatorUseCasePort` e `CalculationRepositoryPort`. |

---

## 🛡️ 4. Tratamento de Divisão por Zero e Regras de Validação

A integridade matemática e a consistência das operações são preservadas através de regras explícitas no núcleo:

1. A classe `DivisionOperation` intercepta `b == 0` antes de qualquer execução aritmética;
2. É disparada a exceção customizada `DivisionByZeroError`, que herda de `CalculatorDomainException`;
3. A exceção carrega uma mensagem clara e instrutiva:
   > *"Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."*
4. O `CommandLineAdapter`, o `JsonAdapter` e a API Web capturam especificamente este erro e apresentam um alerta destacado sem quebrar a execução;
5. Quando um erro ocorre, nenhuma entrada inválida é persistida no histórico do repositório;
6. A operação de porcentagem aceita operandos zero (`0 % 50 = 0`, `100 % 0 = 0`) e operandos negativos mantendo a consistência aritmética comutativa (`a % b == b % a`).

---

## 📂 5. Estrutura de Arquivos

```
.
├── calculator/
│   ├── __init__.py
│   ├── domain/
│   │   ├── exceptions.py          # Exceções de negócio (DivisionByZeroError, etc.)
│   │   ├── models.py              # Value objects (CalculationRequest, CalculationResult, OperationType)
│   │   └── operations.py          # Estratégias aritméticas (+, -, *, /, %) e OperationRegistry
│   ├── ports/
│   │   ├── inbound.py             # Porta de entrada (CalculatorUseCasePort)
│   │   └── outbound.py            # Porta de saída (CalculationRepositoryPort)
│   ├── services/
│   │   └── calculator_service.py  # Serviço de aplicação orquestrador
│   └── adapters/
│       ├── cli_adapter.py         # Adaptador interativo de linha de comando com menu 1 a 7
│       ├── json_adapter.py        # Adaptador JSON / IPC
│       ├── in_memory_repository.py# Adaptador de histórico em memória
│       └── json_file_repository.py# Adaptador de histórico persistido em arquivo (history.json)
├── tests/
│   ├── __init__.py
│   ├── test_operations.py         # 21 testes unitários (+, -, *, /, %, comutatividade, div por zero)
│   ├── test_service.py            # 5 testes da camada de serviço e portas
│   └── test_adapters.py           # 5 testes do adaptador JSON e validações
├── main.py                        # Ponto de entrada CLI, cálculos rápidos e executor de testes
├── server.ts                      # Servidor Full-stack Express integrando Python + Web
├── src/                           # Frontend React + Tailwind CSS responsivo
│   ├── App.tsx                    # Interface interativa, simulador, executor de testes e documentação
│   └── main.tsx
└── README.md                      # Esta documentação completa
```

---

## 🚀 6. Como Executar

> [!NOTE]
> **Atenção para o ambiente Windows:** Caso o comando `python` ou `python3` tente abrir a Microsoft Store devido ao alias padrão do sistema operacional, utilize o inicializador padrão do Python no Windows: **`py`**. No Linux ou macOS, utilize `python3`.

### 6.1 Modo Interativo no Terminal (CLI)
Para executar a calculadora interativa com menu no terminal:

**No Windows (PowerShell / CMD):**
```powershell
py main.py
```

**No Linux / macOS:**
```bash
python3 main.py
```

Menu interativo disponível:
```text
Selecione uma opção:
  [1] Adição (+)
  [2] Subtração (-)
  [3] Multiplicação (*)
  [4] Divisão (/)
  [5] Porcentagem (%)
  [6] Visualizar Histórico
  [7] Limpar Histórico
  [0] Sair
```

### 6.2 Modo de Cálculo Rápido via Linha de Comando
Execute cálculos imediatos passando os operandos e o operador:

**No Windows (PowerShell / CMD):**
```powershell
py main.py --calc 15 + 27
py main.py --calc 200 "%" 15   # Calcula 15% de 200 = 30
py main.py --calc 25 "%" 10    # Retorna 2.5
py main.py --calc 100 / 4
py main.py --calc 100 / 0      # Exibirá a mensagem personalizada de erro
```

**No Linux / macOS:**
```bash
python3 main.py --calc 15 + 27
python3 main.py --calc 200 "%" 15
python3 main.py --calc 25 "%" 10
python3 main.py --calc 100 / 4
python3 main.py --calc 100 / 0
```

### 6.3 Modo JSON (para APIs ou Scripts)
```bash
py main.py --json '{"operand_a": 200, "operand_b": 15, "operation": "%"}'
# No Linux/macOS:
# python3 main.py --json '{"operand_a": 200, "operand_b": 15, "operation": "%"}'
```
Retorno:
```json
{"success": true, "data": {"operand_a": 200, "operand_b": 15, "operation": "%", "result": 30, "formatted_expression": "200 % 15 = 30", "timestamp": "2026-10-28T18:29:51"}}
```

### 6.4 Execução da Suíte de Testes Unitários
Para rodar todos os **31 testes** com saída detalhada:

**No Windows:**
```powershell
py -m unittest discover tests -v
# ou
py main.py --test
```

**No Linux / macOS:**
```bash
python3 -m unittest discover tests -v
# ou
python3 main.py --test
```

### 6.5 Execução do Frontend Web Responsivo (React + Express)
A aplicação conta com um servidor full-stack Express integrando o motor Python e uma interface web moderna em React e Tailwind CSS.

**Passo 1 — Instalar as dependências do projeto:**
> Necessário apenas na primeira execução para gerar a pasta `node_modules`.

```bash
npm install
```
*(Caso utilize versões legadas de ferramentas que sinalizem conflito estrito de dependências paritárias, execute: `npm install --legacy-peer-deps`)*

**Passo 2 — Iniciar o servidor de desenvolvimento:**
```bash
npm run dev
```

**Passo 3 — Acessar a aplicação:**
Abra o navegador no endereço: **`http://localhost:3000`** para interagir com a calculadora gráfica, executar os 31 testes unitários em tempo real e inspecionar a arquitetura e os códigos do projeto.

---

## 🎨 7. Decisões de Design e Experiência do Usuário (UX/UI)

Com base nas diretrizes de ergonomia visual e usabilidade:

### 7.1 Teclado Ergonômico e Botão de Porcentagem (%)
- **Grade 4x5 Perfeita e Simétrica**: O teclado foi organizado em 5 linhas de 4 teclas proporcionais:
  - **Linha 1**: `AC` (Limpar tudo / All Clear), `±` (Inverter sinal), `%` (Porcentagem), `÷` (Divisão).
  - **Linha 2**: `7`, `8`, `9`, `×` (Multiplicação).
  - **Linha 3**: `4`, `5`, `6`, `−` (Subtração).
  - **Linha 4**: `1`, `2`, `3`, `+` (Adição).
  - **Linha 5**: `0`, `⌫` (Apagar último caractere), `CE` (Limpar entrada atual / Clear Entry), `=` (Calcular resultado).
- **Posicionamento Universal**: A tecla `%` localiza-se na primeira linha, ao lado de `±` e `÷`, correspondendo ao padrão consagrado de calculadoras modernas (iOS, macOS, Windows).
- **Destaque Visual do Operador Ativo**: Ao selecionar `%` ou qualquer operador, o botão recebe realce visual e a linha superior do display exibe a expressão com operandos interativos e clicáveis.

### 7.2 Exibição Contínua no Visor e Encadeamento Fluido
- **Visor Contínuo**: Ao selecionar uma operação (`%`, `+`, `−`, `×`, `÷`), o visor principal mantém visível o primeiro operando até que o usuário inicie a digitação do segundo operando, eliminando saltos indesejados para zero.
- **Visor Central em Grande Destaque**: Ao pressionar `=`, o valor calculado surge no centro do visor (ex: `30` após calcular `200 % 15`).
- **Encadeamento Fluido Automático**: Pressionar um operador após o resultado aproveita o valor imediatamente. Da mesma forma, encadear operações em sequência (ex: `200 % 15 + 10 =`) calcula o valor intermediário (`30`) e aplica a nova operação de forma transparente.
- **Suporte Total a Teclado Físico**: Usuários em desktop/laptop podem digitar diretamente pelo teclado: números `0` a `9`, operadores `+`, `-`, `*`, `/`, `%`, `Enter` ou `=` para calcular, `Backspace` para apagar dígito, `Esc` para limpar tudo (AC) e `Delete` para limpar entrada ativa (CE).

### 7.3 Paleta Visual Limpa (Fundo Branco, Tons de Azul e Cinza)
- **Fundo da Aplicação**: Fundo neutro e claro (`#f8fafc` / `bg-slate-50`), garantindo alto contraste e leitura sem fadiga visual.
- **Tons de Azul**: Utilizados como cor primária de destaque (ações principais, botão `=`, operadores ativos e crachás informativos).
- **Tons de Cinza**: Utilizados para a estrutura do dispositivo, teclas de números, separadores sutis e texto secundário, proporcionando uma interface moderna e profissional.

---

## 🛡️ 8. Resiliência de Execução e Tolerância a Falhas na Integração Full-Stack

A camada de integração (`server.ts`) assegura resiliência e alta disponibilidade:

1. **Detecção Multiplataforma do Python**:
   - Resolução automática do executável (`py` em ambientes Windows e `python3` em ambientes Linux/macOS, com possibilidade de sobrescrita via variável de ambiente `PYTHON_CMD`).
2. **Parser de JSON Blindado via Regex**:
   - Isolamento robusto do payload JSON com `/\{[\s\S]*\}/`, imune a ruídos de terminal.
3. **Mecanismo de Fallback Idempotente com Suporte a Porcentagem**:
   - Em caso de reinicialização ou interrupção momentânea de processos do sistema operacional, o servidor aplica a regra de negócio do domínio:
     - Adição (`+`), Subtração (`-`), Multiplicação (`*`), Divisão (`/`) e Porcentagem (`%`);
     - Para `%`, calcula `(numA * numB) / 100`, mantendo inteiros exatos ou precisão decimal de até 6 casas;
     - Persiste no `history.json` para garantir integridade com o repositório.
4. **Validação Prévia de Operandos**:
   - Converte e valida entradas inteiras antes do despacho, prevenindo que valores inválidos ou `NaN` cheguem ao núcleo de cálculo.

---

## 🔍 9. Relatório de Revisão e Ajustes Efetuados

Durante a revisão do projeto após a inclusão da funcionalidade de cálculo de porcentagem, foram avaliados o fluxo interativo na tela, a aderência à arquitetura hexagonal e a eficácia da suíte de testes.

### 9.1 Problemas Diagnosticados na Tela
1. **Zeramento Prematuro do Display**: Ao clicar no botão de porcentagem (`%`) ou em qualquer operador após digitar o primeiro número (ex: `200`), o display principal saltava instantaneamente para `0` antes mesmo do usuário digitar o segundo operando. Isso causava a falsa impressão de que o valor anterior havia sido apagado.
2. **Falta de Encadeamento Contínuo**: Ao digitar sequências como `200 % 15` e clicar diretamente em outro operador (ex: `+`), a operação anterior era substituída pelo novo operador sem calcular o resultado intermediário (`30`), corrompendo a expressão.
3. **Botão Incomum "Editando A/B" no Teclado**: O layout continha um botão de alternância manual que confundia a ergonomia da calculadora e permitia estados inconsistentes de entrada.
4. **Inversão de Sinal (±) Limitada**: O botão `±` não respondia se o campo estivesse vazio, forçando o usuário a digitar primeiro o algarismo para depois inverter o sinal.
5. **Inexistência de Manipulação por Teclado Físico**: Usuários acessando pelo computador precisavam clicar com o mouse em todas as teclas, pois os eventos de teclado não eram interceptados.
6. **Lacuna em Testes de Integração de Adaptador para Porcentagem**: O adaptador JSON não possuía testes para os aliases amigáveis definidos no modelo de domínio (`"percent"`, `"pct"`, `"porcentagem"`, `"porcento"`).

### 9.2 Ajustes Implementados
1. **Exibição Contínua no Visor**: Ajustada a função `getPrimaryDisplayValue()` para manter visível o primeiro operando (`operandA`) enquanto o usuário ainda não tiver começado a digitar o segundo operando (`operandB`).
2. **Encadeamento Aritmético Automático**: Implementado o cálculo intermediário automático no `handleSelectOperation()`. Ao selecionar um novo operador com uma expressão pendente, a calculadora resolve a operação atual e imediatamente posiciona o novo operador para o próximo número.
3. **Substituição pelo Botão `CE` (Clear Entry)**: O botão "Editando" foi substituído pelo padrão universal `CE` (limpa a entrada do operando ativo sem zerar todo o cálculo). Além disso, os operandos na linha superior tornaram-se interativos e clicáveis para troca rápida de foco.
4. **Inversão de Sinal Dinâmica**: O botão `±` agora permite iniciar diretamente um operando negativo (inserindo `-`), além de inverter valores já preenchidos ou resultados calculados.
5. **Suporte Completo a Teclado Físico**: Adicionado ouvinte global de teclado (`keydown`) com prevenção de conflitos em inputs/textareas, mapeando dígitos `0-9`, operadores `+`, `-`, `*`, `/`, `%`, `Enter`/`=`, `Backspace`, `Esc` (AC) e `Delete` (CE).
6. **Expansão da Suíte de Testes (33 testes)**: Adicionados 2 novos testes no `tests/test_adapters.py`:
   - `test_successful_percentage_with_text_aliases`: validação dos aliases `"porcentagem"`, `"percent"`, `"pct"`, `"porcento"`.
   - `test_percentage_with_negative_operands`: validação de porcentagens com operandos negativos via adaptador JSON.
   - **Resultado**: 33 testes executados com 100% de sucesso.

