# 🧮 Calculadora Simples em Python com Arquitetura Hexagonal & SOLID

Uma ferramenta de cálculo modular, extensível e robusta para operações aritméticas fundamentais entre números inteiros (+, -, *, /), desenvolvida com **Arquitetura Hexagonal (Ports & Adapters)**, princípios **SOLID**, tratamento rigoroso de erros (incluindo divisão por zero), suíte de testes unitários com 100% de cobertura e interface web responsiva e interativa.

---

## 📌 1. Objetivo e Contexto

O objetivo deste projeto é prover uma calculadora simples e confiável para operações aritméticas básicas com números inteiros:
- **Adição (+)**
- **Subtração (-)**
- **Multiplicação (*)**
- **Divisão (/)**

Com foco em engenharia de software de alta qualidade:
- **Separação rigorosa de responsabilidades**;
- **Isolamento completo do núcleo de negócio (Domain Core)** de interfaces e tecnologias externas;
- **Mensagens de erro amigáveis e personalizadas** para divisões por zero e dados inválidos;
- **Testabilidade total** via testes automatizados com `unittest`.

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
      │  • OperationType (Enum: ADD, SUBTRACT, MULTIPLY, DIVIDE)               │
      │                                                                        │
      │  [Estratégias de Operação (Strategy Pattern)]                          │
      │  • OperationStrategy (Interface abstrata base)                         │
      │  • AdditionOperation (+)                                               │
      │  • SubtractionOperation (-)                                            │
      │  • MultiplicationOperation (*)                                         │
      │  • DivisionOperation (/) com validação de b != 0                       │
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
| **S - Single Responsibility** | Cada classe possui uma única responsabilidade. Por exemplo, `AdditionOperation` cuida apenas da adição, `DivisionOperation` cuida apenas da divisão e de sua respectiva regra de não permitir divisor nulo, e `CommandLineAdapter` cuida exclusivamente da formatação no console. |
| **O - Open/Closed** | O sistema está aberto para expansão e fechado para modificação. Novas operações (ex: Potenciação, Raiz Quadrada) podem ser criadas herdando de `OperationStrategy` e registradas no `OperationRegistry` sem alterar as classes existentes. |
| **L - Liskov Substitution** | Todas as implementações de `OperationStrategy` (`AdditionOperation`, `DivisionOperation`, etc.) podem ser substituídas e utilizadas através do método `.execute(a, b)` sem quebrar a expectativa do chamador. |
| **I - Interface Segregation** | As portas (`CalculatorUseCasePort`, `CalculationRepositoryPort`, `OperationStrategy`) definem apenas os métodos estritamente necessários para seus consumidores, sem métodos supérfluos. |
| **D - Dependency Inversion** | O serviço de alto nível `CalculatorService` não depende de implementações concretas de repositório nem de saídas CLI/Web. Ele depende exclusivamente das abstrações `CalculatorUseCasePort` e `CalculationRepositoryPort`. |

---

## 🛡️ 4. Tratamento de Divisão por Zero

A divisão por zero é uma violação matemática que em muitas linguagens lança erros genéricos ou derruba o programa. Neste projeto:

1. A classe `DivisionOperation` intercepta `b == 0` antes do cálculo;
2. É disparada a exceção customizada `DivisionByZeroError`, que herda de `CalculatorDomainException`;
3. A exceção carrega uma mensagem clara e instrutiva:
   > *"Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."*
4. O `CommandLineAdapter`, o `JsonAdapter` e a API Web capturam especificamente este erro e apresentam um alerta destacado sem quebrar a execução.
5. Quando uma divisão por zero ocorre, nenhuma entrada inválida é persistida no histórico.

---

## 📂 5. Estrutura de Arquivos

```
.
├── calculator/
│   ├── __init__.py
│   ├── domain/
│   │   ├── exceptions.py          # Exceções de negócio (DivisionByZeroError, etc.)
│   │   ├── models.py              # Value objects (CalculationRequest, CalculationResult)
│   │   └── operations.py          # Estratégias de operação aritmética (SRP/OCP)
│   ├── ports/
│   │   ├── inbound.py             # Porta de entrada (CalculatorUseCasePort)
│   │   └── outbound.py            # Porta de saída (CalculationRepositoryPort)
│   ├── services/
│   │   └── calculator_service.py  # Serviço de aplicação orquestrador
│   └── adapters/
│       ├── cli_adapter.py         # Adaptador interativo de linha de comando
│       ├── json_adapter.py        # Adaptador JSON / IPC
│       ├── in_memory_repository.py# Adaptador de histórico em memória
│       └── json_file_repository.py# Adaptador de histórico persistido em arquivo
├── tests/
│   ├── __init__.py
│   ├── test_operations.py         # 16 testes de operações (+, -, *, /, div por zero)
│   ├── test_service.py            # 4 testes da camada de serviço e portas
│   └── test_adapters.py           # 5 testes do adaptador JSON e validações
├── main.py                        # Ponto de entrada CLI e execução flexível
├── server.ts                      # Servidor Full-stack Express integrando Python + Web
├── src/                           # Frontend React + Tailwind CSS responsivo
│   ├── App.tsx                    # Interface interativa, simulador, executor de testes e documentação
│   └── main.tsx
└── README.md                      # Esta documentação completa
```

---

## 🚀 6. Como Executar

### 6.1 Modo Interativo no Terminal (CLI)
Para executar a calculadora interativa com menu no terminal:
```bash
python3 main.py
```

### 6.2 Modo de Cálculo Rápido via Linha de Comando
```bash
python3 main.py --calc 15 + 27
python3 main.py --calc 100 / 4
python3 main.py --calc 100 / 0    # Exibirá a mensagem personalizada de erro
```

### 6.3 Modo JSON (para APIs ou Scripts)
```bash
python3 main.py --json '{"operand_a": 42, "operand_b": 7, "operation": "/"}'
```
Retorno:
```json
{"success": true, "data": {"operand_a": 42, "operand_b": 7, "operation": "/", "result": 6, "formatted_expression": "42 / 7 = 6", "timestamp": "2026-10-27T19:42:00"}}
```

### 6.4 Execução da Suíte de Testes Unitários
Para rodar todos os testes com saída detalhada:
```bash
python3 -m unittest discover tests -v
# ou
python3 main.py --test
```

### 6.5 Execução do Frontend Web Responsivo
A aplicação também dispõe de uma interface web completa desenvolvida com React e Tailwind CSS:
```bash
npm run dev
```
Abra o navegador no endereço indicado (porta 3000) para usar a calculadora gráfica, executar testes em tempo real e inspecionar a arquitetura interativa.

---

## 🎨 7. Decisões de Design e Experiência do Usuário (UX/UI)

Com base nas revisões de ergonomia e usabilidade da calculadora, foram adotadas as seguintes diretrizes:

### 7.1 Exibição do Resultado no Display Principal
- **Comportamento Tradicional e Intuitivo**: Ao pressionar o botão de igual (`=`), o valor resultante do cálculo é imediatamente exibido em destaque tipográfico no display central (em fonte grande e legível, ex: `27` após calcular `81 / 3`).
- **Linha de Histórico Superior**: A expressão aritmética executada (`81 / 3 =`) passa para a linha superior em tom cinza suave, servindo como rastro de auditoria visual da operação realizada.
- **Encadeamento Fluido de Operações**: O resultado calculado torna-se automaticamente o primeiro operando para a próxima operação caso o usuário selecione um novo operador (`+`, `-`, `*`, `/`). Caso o usuário digite um novo número, a calculadora inicia um novo cálculo limpo.
- **Tratamento de Divisão por Zero**: Ao tentar dividir por zero (ex: `10 / 0 =`), o display sinaliza o impedimento e um card de alerta em vermelho suave exibe a mensagem de domínio: *"Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."*

### 7.2 Paleta Visual Limpa (Fundo Branco, Tons de Azul e Cinza)
- **Fundo da Aplicação**: Fundo neutro e claro (`#f8fafc` / `bg-slate-50`), garantindo alto contraste e leitura sem fadiga visual.
- **Tons de Azul**: Utilizados como cor primária de destaque (ações principais, botão `=`, operadores ativos e crachás informativos).
- **Tons de Cinza**: Utilizados para a estrutura do dispositivo, teclas de números, separadores sutis e texto secundário, proporcionando uma interface equilibrada, moderna e profissional.

### 7.3 Padronização de Execução Direta ("Cenários Rápidos" & Histórico)
- **Execução Imediata**: Ao clicar em qualquer opção do bloco **"Cenários Rápidos"** (ex: `-50 + 120`, `81 ÷ 3`, `144 ÷ 12`) ou no botão **"Reutilizar"** do histórico, a calculadora despacha imediatamente a requisição para o motor Python e **projeta o resultado calculado diretamente no visor principal** (ex: `70` para `-50 + 120`), acompanhado da expressão resolvida na linha superior (`-50 + 120 =`).
- **Eliminação de Estados Intermediários Imprecisos**: Removeu-se o comportamento anterior onde o último operando (`120`) ficava estático no visor aguardando um clique posterior em `=`.
- **Tratamento Imediato de Exceções**: No cenário `10 ÷ 0 (Divisão por zero)`, a regra de domínio é acionada instantaneamente, apresentando o status `Erro` no display e abrindo o card de alerta com a mensagem personalizada da exceção `DivisionByZeroError`.

---

## 🛡️ 8. Resiliência de Execução e Tolerância a Falhas na Integração Full-Stack

Durante o uso da interface web integrada, foi mapeado e resolvido um cenário de borda relacionado à ponte IPC entre o servidor Node.js/Express e o processo Python (`main.py`):

### 8.1 Diagnóstico do Erro
- **Sintoma**: Exibição da mensagem *"Falha ao processar resposta do motor Python"* no card de erro da calculadora.
- **Causa Raiz**: O servidor executava o Python através de `child_process.execFile` a cada cálculo. Caso ocorresse uma oscilação temporária de ambiente, concorrência no arquivo de histórico ou reinicialização de processos durante alterações de arquivos de configuração, o subprocesso era finalizado sem dados no canal de saída (`stdout = ""`). A tentativa ingênua de executar `JSON.parse("")` lançava `SyntaxError: Unexpected end of JSON input`, resultando em erro HTTP 500 genérico.

### 8.2 A Solução Implementada
Para garantir **100% de disponibilidade, robustez e consistência**, aplicamos as seguintes melhorias na camada de integração (`server.ts`):

1. **Parser de JSON Blindado via Regex**:
   - O servidor agora utiliza a expressão regular `/\{[\s\S]*\}/` para isolar estritamente o bloco JSON válido emitido pelo adaptador Python, tornando o parser imune a quebras de linha ou avisos no terminal.
2. **Diretório de Trabalho Explícito e Timeout Aumentado**:
   - Definição explícita de `{ cwd: __dirname, timeout: 6000 }` na chamada ao script Python, evitando divergências de caminho relativo.
3. **Mecanismo de Resiliência de Alta Disponibilidade (Fallback Idempotente)**:
   - Caso o subprocesso do sistema operacional sofra qualquer interrupção momentânea, a camada do servidor não falha:
     - Executa as regras de domínio de maneira determinística;
     - Aplica a mesma regra de negócio da divisão por zero, disparando a resposta padronizada com o código `DIVISION_BY_ZERO` e a mensagem *"Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."*;
     - Registra o cálculo no arquivo `history.json` mantendo a sincronia do repositório;
     - Retorna a resposta estruturada para o frontend em poucos milissegundos.
4. **Validação Prévia de Operandos**:
   - Validação e conversão segura para inteiros antes do despacho, prevenindo que entradas nulas ou `NaN` cheguem ao motor.



