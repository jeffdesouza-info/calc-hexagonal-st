/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  Layers,
  Code2,
  Terminal,
  History,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface CalculationResultData {
  operand_a: number;
  operand_b: number;
  operation: string;
  result: number;
  formatted_expression: string;
  timestamp: string;
}

interface TestRunResult {
  success: boolean;
  output: string;
  totalTests: number;
  passedTests: number;
  durationMs: number;
  summary: string;
}

interface CodeFile {
  name: string;
  path: string;
  category: string;
  content: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'tests' | 'architecture' | 'code' | 'cli'>('calculator');
  
  // Calculator state
  const [operandA, setOperandA] = useState<string>('');
  const [operation, setOperation] = useState<'+' | '-' | '*' | '/' | null>(null);
  const [operandB, setOperandB] = useState<string>('');
  const [activeInput, setActiveInput] = useState<'A' | 'B'>('A');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Novo estado de controle: indica que o display principal está exibindo o resultado calculado
  const [isShowingCalculatedResult, setIsShowingCalculatedResult] = useState<boolean>(false);
  const [lastCompletedExpression, setLastCompletedExpression] = useState<string | null>(null);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useState<CalculationResultData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Tests state
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Code Explorer state
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchCodeFiles();
    runAutomatedTests();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchCodeFiles = async () => {
    try {
      const res = await fetch('/api/code-files');
      if (res.ok) {
        const data = await res.json();
        setCodeFiles(data.files || []);
        if (data.files && data.files.length > 0) {
          const defaultFile = data.files.find((f: CodeFile) => f.name === 'operations.py') || data.files[0];
          setSelectedFile(defaultFile);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar arquivos de código:', e);
    }
  };

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/run-tests', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (e) {
      console.error('Erro ao executar testes:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/clear-history', { method: 'POST' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      console.error('Erro ao limpar histórico:', e);
    }
  };

  // Funções de manipulação do teclado da calculadora
  const handleDigit = (digit: string) => {
    setErrorMessage(null);
    setErrorCode(null);

    // Se acabou de calcular e pressiona um dígito novo, inicia um novo cálculo do zero
    if (isShowingCalculatedResult) {
      setIsShowingCalculatedResult(false);
      setLastCompletedExpression(null);
      setCalculatedValue(null);
      setOperandA(digit);
      setOperation(null);
      setOperandB('');
      setActiveInput('A');
      return;
    }

    if (activeInput === 'A') {
      if (digit === '0' && operandA === '0') return;
      if (operandA === '0') {
        setOperandA(digit);
      } else {
        setOperandA(prev => prev + digit);
      }
    } else {
      if (digit === '0' && operandB === '0') return;
      if (operandB === '0') {
        setOperandB(digit);
      } else {
        setOperandB(prev => prev + digit);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    setErrorCode(null);

    if (isShowingCalculatedResult) {
      setIsShowingCalculatedResult(false);
      return;
    }

    if (activeInput === 'A') {
      setOperandA(prev => prev.slice(0, -1));
    } else {
      if (operandB.length > 0) {
        setOperandB(prev => prev.slice(0, -1));
      } else {
        setOperation(null);
        setActiveInput('A');
      }
    }
  };

  const handleToggleSign = () => {
    setErrorMessage(null);
    setErrorCode(null);

    if (isShowingCalculatedResult && calculatedValue !== null) {
      const inverted = -calculatedValue;
      setCalculatedValue(inverted);
      setOperandA(String(inverted));
      return;
    }

    if (activeInput === 'A' && operandA) {
      setOperandA(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
    } else if (activeInput === 'B' && operandB) {
      setOperandB(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
    }
  };

  const handleSelectOperation = (op: '+' | '-' | '*' | '/') => {
    setErrorMessage(null);
    setErrorCode(null);

    // Se estiver exibindo o resultado anterior, encadeia a operação usando o resultado como operandA!
    if (isShowingCalculatedResult && calculatedValue !== null) {
      setOperandA(String(calculatedValue));
      setOperandB('');
      setOperation(op);
      setActiveInput('B');
      setIsShowingCalculatedResult(false);
      setLastCompletedExpression(`${calculatedValue} ${op}`);
      return;
    }

    if (!operandA) {
      setOperandA('0');
    }

    setOperation(op);
    setActiveInput('B');
    setIsShowingCalculatedResult(false);
  };

  const handleResetCalculator = () => {
    setOperandA('');
    setOperation(null);
    setOperandB('');
    setActiveInput('A');
    setIsShowingCalculatedResult(false);
    setLastCompletedExpression(null);
    setCalculatedValue(null);
    setErrorMessage(null);
    setErrorCode(null);
  };

  const executeCalculationWith = async (a: number, b: number, op: '+' | '-' | '*' | '/') => {
    setIsCalculating(true);
    setErrorMessage(null);
    setErrorCode(null);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operand_a: a,
          operand_b: b,
          operation: op,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // DECISÃO DE UX/UI: Exibir o resultado calculado DIRETAMENTE no display principal com grande destaque!
        setCalculatedValue(data.data.result);
        setIsShowingCalculatedResult(true);
        setLastCompletedExpression(`${a} ${op} ${b} =`);
        
        // Prepara operandA para permitir encadeamento automático do próximo cálculo
        setOperandA(String(data.data.result));
        setOperandB('');
        setOperation(null);
        setActiveInput('A');

        fetchHistory();
      } else {
        setIsShowingCalculatedResult(false);
        setCalculatedValue(null);
        setOperandA(String(a));
        setOperation(op);
        setOperandB(String(b));
        setLastCompletedExpression(`${a} ${op} ${b}`);
        setErrorMessage(data.error || 'Erro ao realizar o cálculo no motor Python.');
        setErrorCode(data.code || 'ERROR');
      }
    } catch (e: any) {
      setIsShowingCalculatedResult(false);
      setCalculatedValue(null);
      setErrorMessage(`Falha na requisição: ${e.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecuteCalculation = async () => {
    if (!operandA) {
      setErrorMessage('Por favor, informe o primeiro número inteiro.');
      return;
    }
    if (!operation) {
      setErrorMessage('Selecione uma operação aritmética (+, -, *, /).');
      return;
    }
    if (!operandB) {
      setErrorMessage('Por favor, informe o segundo número inteiro.');
      return;
    }

    await executeCalculationWith(parseInt(operandA, 10), parseInt(operandB, 10), operation);
  };

  const handleApplyPreset = (a: number, op: '+' | '-' | '*' | '/', b: number) => {
    // Padronização solicitada: Cenários Rápidos calculam DIRETAMENTE e exibem o resultado no display principal
    setOperandA(String(a));
    setOperation(op);
    setOperandB(String(b));
    setActiveInput('A');
    executeCalculationWith(a, b, op);
  };

  const copyToClipboard = (text: string, type: 'file' | string) => {
    navigator.clipboard.writeText(text);
    if (type === 'file') {
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    } else {
      setCopiedCli(type);
      setTimeout(() => setCopiedCli(null), 2000);
    }
  };

  // Valor a ser exibido no display principal
  const getPrimaryDisplayValue = () => {
    if (errorMessage && errorCode === 'DIVISION_BY_ZERO') {
      return 'Erro';
    }
    if (isShowingCalculatedResult && calculatedValue !== null) {
      return calculatedValue;
    }
    if (activeInput === 'B') {
      return operandB !== '' ? operandB : '0';
    }
    return operandA !== '' ? operandA : '0';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600/20 selection:text-blue-900">
      
      {/* Top Header - Fundo branco com bordas e detalhes em azul e cinza */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                  Calculadora Hexagonal
                </h1>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Python 3.10
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-mono rounded bg-slate-100 text-slate-700 border border-slate-200">
                  SOLID
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Operações aritméticas fundamentais com números inteiros • Arquitetura Hexagonal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'calculator'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'tests'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Testes Unitários</span>
              {testResult && testResult.success && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Arquitetura & SOLID</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Código-Fonte</span>
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'cli'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>CLI & README</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ============================================================== */}
        {/* TAB 1: CALCULADORA INTERATIVA                                 */}
        {/* ============================================================== */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Calculator Column */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              {/* Presets Bar */}
              <div className="w-full max-w-md mb-4 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Cenários Rápidos:
                  </span>
                  <span className="text-[11px] text-slate-400">Clique para testar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleApplyPreset(81, '/', 3)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    81 ÷ 3
                  </button>
                  <button
                    onClick={() => handleApplyPreset(10, '/', 0)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    <span>10 ÷ 0 (Divisão por zero)</span>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                  </button>
                  <button
                    onClick={() => handleApplyPreset(144, '/', 12)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    144 ÷ 12
                  </button>
                  <button
                    onClick={() => handleApplyPreset(45, '*', 15)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    45 × 15
                  </button>
                  <button
                    onClick={() => handleApplyPreset(-50, '+', 120)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    -50 + 120
                  </button>
                </div>
              </div>

              {/* Physical Calculator Shell - Fundo Branco e tons de Azul e Cinza */}
              <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 relative">
                
                {/* Brand / Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs shadow-blue-500"></span>
                    <span className="text-xs font-mono text-slate-600 font-semibold tracking-wider">HEXAGONAL ENGINE</span>
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    INT ONLY
                  </div>
                </div>

                {/* Display Screen Principal - Fundo cinza suave de alto contraste */}
                <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-inner">
                  
                  {/* Linha Superior: Expressão formatada / em andamento */}
                  <div className="min-h-6 flex items-center justify-end text-sm font-mono text-slate-500 space-x-1.5 overflow-x-auto">
                    {isShowingCalculatedResult && lastCompletedExpression ? (
                      <span className="text-slate-600 font-medium">
                        {lastCompletedExpression}
                      </span>
                    ) : errorMessage && lastCompletedExpression ? (
                      <span className="text-rose-600 font-medium">
                        {lastCompletedExpression}
                      </span>
                    ) : (
                      <>
                        {operandA !== '' && (
                          <span className={activeInput === 'A' ? 'text-blue-700 font-bold underline' : 'text-slate-600'}>
                            {operandA}
                          </span>
                        )}
                        {operation && (
                          <span className="text-blue-600 font-bold px-1">{operation}</span>
                        )}
                        {operandB !== '' && (
                          <span className={activeInput === 'B' ? 'text-blue-700 font-bold underline' : 'text-slate-600'}>
                            {operandB}
                          </span>
                        )}
                        {operandA === '' && (
                          <span className="text-slate-400 text-xs font-sans">Aguardando entrada de números inteiros...</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Valor Principal no Display: RESULTADO EM DESTAQUE GIGANTE QUANDO CALCULADO */}
                  <div className="mt-2 text-right">
                    <div
                      className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight overflow-x-auto scrollbar-none transition-all ${
                        errorMessage
                          ? 'text-rose-600'
                          : isShowingCalculatedResult
                          ? 'text-blue-700 drop-shadow-xs'
                          : 'text-slate-900'
                      }`}
                    >
                      {getPrimaryDisplayValue()}
                    </div>
                  </div>

                  {/* Subtítulo / Indicador do Estado do Display */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>
                      {isCalculating ? (
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          Processando via Python Core...
                        </span>
                      ) : errorMessage ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {errorCode === 'DIVISION_BY_ZERO' ? 'Divisão por Zero Bloqueada' : 'Erro de Validação'}
                        </span>
                      ) : isShowingCalculatedResult ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Resultado Calculado com Sucesso
                        </span>
                      ) : (
                        <span>Porta ativa: CalculatorUseCasePort</span>
                      )}
                    </span>
                    <span className="text-slate-400">Modo: Inteiro</span>
                  </div>
                </div>

                {/* Banner de Erro Personalizado (especialmente Divisão por Zero) */}
                {errorMessage && (
                  <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                          <span>{errorCode === 'DIVISION_BY_ZERO' ? '🛑 Regra de Negócio Violada' : '⚠️ Erro de Validação'}</span>
                          {errorCode && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-[10px] font-mono text-rose-700 border border-rose-200">
                              {errorCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 leading-relaxed text-rose-800 font-medium">{errorMessage}</p>
                        {errorCode === 'DIVISION_BY_ZERO' && (
                          <p className="mt-1.5 text-[11px] text-rose-700 border-t border-rose-200 pt-1 font-sans">
                            Disparado por <code className="font-mono text-rose-900 font-semibold">DivisionOperation</code> via <code className="font-mono text-rose-900 font-semibold">DivisionByZeroError</code>. O cálculo foi rejeitado antes da persistência.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Keypad Grid - Paleta limpa em Branco, Azul e Cinza */}
                <div className="grid grid-cols-4 gap-2.5">
                  {/* Row 1 */}
                  <button
                    onClick={handleResetCalculator}
                    className="p-3.5 rounded-xl font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all text-sm flex items-center justify-center shadow-xs"
                    title="Limpar tudo (Clear)"
                  >
                    AC
                  </button>
                  <button
                    onClick={handleToggleSign}
                    className="p-3.5 rounded-xl font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all text-sm shadow-xs"
                    title="Inverter sinal (±)"
                  >
                    ±
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="p-3.5 rounded-xl font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all text-sm flex items-center justify-center shadow-xs"
                    title="Apagar dígito"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSelectOperation('/')}
                    className={`p-3.5 rounded-xl font-mono font-bold text-lg active:scale-95 transition-all flex items-center justify-center ${
                      operation === '/'
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/30'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-xs'
                    }`}
                  >
                    ÷
                  </button>

                  {/* Row 2 */}
                  <button
                    onClick={() => handleDigit('7')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleDigit('8')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleDigit('9')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleSelectOperation('*')}
                    className={`p-3.5 rounded-xl font-mono font-bold text-lg active:scale-95 transition-all flex items-center justify-center ${
                      operation === '*'
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/30'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-xs'
                    }`}
                  >
                    ×
                  </button>

                  {/* Row 3 */}
                  <button
                    onClick={() => handleDigit('4')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleDigit('5')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleDigit('6')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleSelectOperation('-')}
                    className={`p-3.5 rounded-xl font-mono font-bold text-lg active:scale-95 transition-all flex items-center justify-center ${
                      operation === '-'
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/30'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-xs'
                    }`}
                  >
                    −
                  </button>

                  {/* Row 4 */}
                  <button
                    onClick={() => handleDigit('1')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleDigit('2')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleDigit('3')}
                    className="p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleSelectOperation('+')}
                    className={`p-3.5 rounded-xl font-mono font-bold text-lg active:scale-95 transition-all flex items-center justify-center ${
                      operation === '+'
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/30'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-xs'
                    }`}
                  >
                    +
                  </button>

                  {/* Row 5 */}
                  <button
                    onClick={() => handleDigit('0')}
                    className="col-span-2 p-3.5 rounded-xl font-mono font-semibold text-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition-all flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    onClick={() => {
                      if (activeInput === 'A') setActiveInput('B');
                      else setActiveInput('A');
                    }}
                    className="p-3.5 rounded-xl font-mono text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center"
                    title="Alternar entre primeiro e segundo operando"
                  >
                    <span className="text-[10px] uppercase text-slate-500">Editando</span>
                    <span className="font-bold text-blue-700">{activeInput}</span>
                  </button>
                  <button
                    onClick={handleExecuteCalculation}
                    disabled={isCalculating}
                    className="p-3.5 rounded-xl font-mono font-bold text-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 border border-blue-700"
                  >
                    =
                  </button>
                </div>
              </div>
            </div>

            {/* History and Core Info Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Architecture Pill Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Garantias do Núcleo Hexagonal & UX
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Resultado no display principal:</strong> Ao teclar <code className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded">=</code>, o resultado calculado surge grande e nítido no centro do visor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Divisão por zero tratada:</strong> lança <code className="text-rose-700 font-mono bg-rose-50 px-1 py-0.5 rounded">DivisionByZeroError</code> com mensagem personalizada em destaque.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Princípios SOLID:</strong> Estratégias isoladas (SRP), registro aberto (OCP), injeção via portas (DIP).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>24 Testes Unitários</strong> com <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">unittest</code> integrados e automatizados.</span>
                  </li>
                </ul>
              </div>

              {/* History Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Histórico de Cálculos</h3>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600 border border-slate-200">
                      {history.length}
                    </span>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {isLoadingHistory ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-mono">
                    Carregando histórico do repositório...
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Nenhum cálculo no histórico. Realize um cálculo na calculadora ao lado!
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {history.slice().reverse().map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
                      >
                        <div>
                          <div className="font-mono text-sm text-slate-900 font-semibold">
                            {item.formatted_expression}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(item.timestamp).toLocaleTimeString('pt-BR')} • {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyPreset(item.operand_a, item.operation as any, item.operand_b)}
                          className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shadow-xs"
                          title="Recalcular e exibir resultado no display principal"
                        >
                          Reutilizar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TESTES UNITÁRIOS (UNITTEST)                           */}
        {/* ============================================================== */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            
            {/* Header / Trigger */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Suíte de Testes Unitários (Python unittest)</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Validação automatizada das 4 operações aritméticas fundamentais, lançamento e mensagem personalizada de <code className="text-blue-700 font-mono font-medium">DivisionByZeroError</code>, portas e adaptadores.
                </p>
              </div>

              <button
                onClick={runAutomatedTests}
                disabled={isRunningTests}
                className="px-5 py-2.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 self-start md:self-auto border border-blue-700"
              >
                <Play className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
                <span>{isRunningTests ? 'Executando testes...' : 'Executar python3 -m unittest'}</span>
              </button>
            </div>

            {/* Test Metrics Overview */}
            {testResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Status Geral</div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{testResult.success ? '100% SUCESSO' : 'FALHA'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total de Testes</div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-900">
                    {testResult.totalTests} testes
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Testes Aprovados</div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-600">
                    {testResult.passedTests} / {testResult.totalTests}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Tempo de Execução</div>
                  <div className="text-xl font-bold font-mono mt-1 text-blue-700">
                    {testResult.durationMs} ms
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown of Test Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Test Module 1 */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      test_operations.py
                    </span>
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 16 testes OK
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">Operações & Divisão por Zero</h3>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    <li>• Adição de positivos, negativos e zero</li>
                    <li>• Subtração com inversão de sinal</li>
                    <li>• Multiplicação com fator absorvente (0)</li>
                    <li>• Divisão exata e inexata com precisão</li>
                    <li className="text-blue-800 font-semibold">• Lançamento e validação de DivisionByZeroError</li>
                    <li>• Registro dinâmico de estratégias (OCP)</li>
                  </ul>
                </div>
              </div>

              {/* Test Module 2 */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      test_service.py
                    </span>
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 4 testes OK
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">Camada de Aplicação & Portas</h3>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    <li>• Implementação de CalculatorUseCasePort</li>
                    <li>• Injeção de dependência do repositório</li>
                    <li>• Isolamento do histórico em caso de erro</li>
                    <li>• Validação de tipo estrita para inteiros</li>
                  </ul>
                </div>
              </div>

              {/* Test Module 3 */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      test_adapters.py
                    </span>
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 4 testes OK
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">Adaptadores de Entrada (JSON/CLI)</h3>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    <li>• Serialização e desserialização JSON</li>
                    <li>• Códigos padronizados (DIVISION_BY_ZERO)</li>
                    <li>• Proteção contra parâmetros ausentes</li>
                    <li>• Entrada robusta via linha de comando</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Real Terminal Output of Unittest */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold ml-2">
                    Terminal Output: python3 -m unittest discover tests -v
                  </span>
                </div>
                {testResult && (
                  <button
                    onClick={() => copyToClipboard(testResult.output, 'test-output')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    {copiedCli === 'test-output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar log</span>
                  </button>
                )}
              </div>

              <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto max-h-96 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                {testResult ? testResult.output : 'Clique em "Executar python3 -m unittest" acima para rodar a suíte.'}
              </pre>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ARQUITETURA HEXAGONAL & SOLID                          */}
        {/* ============================================================== */}
        {activeTab === 'architecture' && (
          <div className="space-y-8">
            
            {/* Overview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Arquitetura Hexagonal (Ports & Adapters)
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                A Arquitetura Hexagonal garante que o núcleo das regras de cálculo matemático permaneça <strong>100% puro e isolado</strong>, sem acoplamento a frameworks, servidores HTTP, banco de dados ou interfaces de usuário.
              </p>
            </div>

            {/* Architecture Visual Diagram */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-mono text-blue-700 font-semibold uppercase tracking-wider mb-6">
                Fluxo de Comunicação através das Portas e Adaptadores
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* Column 1: Driving Adapters */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        DRIVING ADAPTERS
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Entrada</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Adaptadores Primários</h3>
                    <p className="text-xs text-slate-600 mb-4">
                      Iniciam as ações chamando as portas de entrada do núcleo.
                    </p>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <strong className="text-blue-700">CommandLineAdapter</strong>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">Interface interativa de terminal</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <strong className="text-blue-700">JsonAdapter</strong>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">Entrada JSON para APIs e Web</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <strong className="text-blue-700">Web UI (React)</strong>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">Interface gráfica responsiva com display de alto contraste</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                    <span className="text-[11px] font-mono text-blue-700 font-medium flex items-center justify-center gap-1">
                      Invoca Inbound Port <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Column 2: Inbound Ports & Domain Core */}
                <div className="p-5 rounded-2xl bg-blue-50/40 border-2 border-blue-400 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        CORE / DOMÍNIO
                      </span>
                      <span className="text-[11px] text-blue-800 font-mono font-semibold">NÚCLEO PURO</span>
                    </div>

                    <div className="mb-3 p-2.5 rounded-lg bg-white border border-blue-200 text-xs font-mono text-blue-800 shadow-xs">
                      <strong>Porta de Entrada:</strong><br />
                      <code>CalculatorUseCasePort</code>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs">
                        <span className="font-semibold text-slate-900">CalculatorService</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Orquestra casos de uso e valida regras de negócio.</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs">
                        <span className="font-semibold text-slate-900">OperationStrategy & Registry</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Estratégias independentes para +, -, * e /.</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-rose-200 shadow-xs">
                        <span className="font-semibold text-rose-700">DivisionByZeroError</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Exceção de domínio com mensagem personalizada.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-blue-200 text-center">
                    <span className="text-[11px] font-mono text-blue-700 font-medium flex items-center justify-center gap-1">
                      Invoca Outbound Port <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Column 3: Driven Adapters */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                        DRIVEN ADAPTERS
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Saída</span>
                    </div>

                    <div className="mb-3 p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
                      <strong>Porta de Saída:</strong><br />
                      <code>CalculationRepositoryPort</code>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Adaptadores Secundários</h3>
                    <p className="text-xs text-slate-600 mb-4">
                      Implementam a persistência sem que o domínio conheça detalhes técnicos de armazenamento.
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <strong className="text-slate-800">InMemoryRepository</strong>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">Armazenamento volátil em lista</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <strong className="text-slate-800">JsonFileRepository</strong>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">Persistência contínua em history.json</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500 font-mono">
                    Totalmente desacoplado do Core
                  </div>
                </div>

              </div>
            </div>

            {/* SOLID Cards */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Princípios SOLID no Projeto</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* S */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-sm border border-blue-200">
                      S
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">Single Responsibility</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cada classe possui responsabilidade única: <code className="text-blue-700 font-semibold">AdditionOperation</code> cuida apenas de somar; <code className="text-blue-700 font-semibold">DivisionOperation</code> cuida da divisão e validação do divisor zero; <code className="text-blue-700 font-semibold">CommandLineAdapter</code> formata apenas a CLI.
                  </p>
                </div>

                {/* O */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-sm border border-blue-200">
                      O
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">Open/Closed Principle</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aberto para extensão, fechado para modificação. Novas operações podem ser adicionadas herdando de <code className="text-blue-700 font-semibold">OperationStrategy</code> e registradas no <code className="text-blue-700 font-semibold">OperationRegistry</code> sem alterar nenhuma linha do serviço central.
                  </p>
                </div>

                {/* L */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-sm border border-blue-200">
                      L
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">Liskov Substitution</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Qualquer subclasse de <code className="text-blue-700 font-semibold">OperationStrategy</code> pode ser utilizada de forma intercambiável pelo serviço sem quebrar a lógica de negócio. Todas obedecem rigorosamente à assinatura <code className="text-blue-700 font-semibold">execute(a, b)</code>.
                  </p>
                </div>

                {/* I */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-sm border border-blue-200">
                      I
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">Interface Segregation</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Portas enxutas e granulares. A interface <code className="text-blue-700 font-semibold">CalculationRepositoryPort</code> define apenas os métodos necessários de persistência (<code className="text-blue-700 font-semibold">save</code>, <code className="text-blue-700 font-semibold">get_all</code>, <code className="text-blue-700 font-semibold">clear</code>), sem poluição com métodos desnecessários.
                  </p>
                </div>

                {/* D */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors md:col-span-2 lg:col-span-2">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-sm border border-blue-200">
                      D
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">Dependency Inversion Principle</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    O módulo de alto nível <code className="text-blue-700 font-semibold">CalculatorService</code> não depende de implementações concretas de repositório nem de saídas CLI/Web. Ele depende exclusivamente da abstração <code className="text-blue-700 font-semibold">CalculationRepositoryPort</code>, que é injetada via construtor.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: EXPLORADOR DE CÓDIGO-FONTE                             */}
        {/* ============================================================== */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* File List Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  Arquivos do Projeto Python
                </span>
                <span className="text-xs font-mono text-slate-400">{codeFiles.length} arquivos</span>
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                {codeFiles.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                      selectedFile?.path === file.path
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-sans border border-slate-200">
                      {file.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Content View */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {selectedFile ? (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono font-bold text-slate-900">{selectedFile.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {selectedFile.path}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedFile.content, 'file')}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs"
                    >
                      {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile ? 'Copiado!' : 'Copiar Arquivo'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-white">
                    <pre className="p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-[550px] scrollbar-thin">
                      {selectedFile.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 text-sm">
                  Selecione um arquivo à esquerda para visualizar seu código-fonte.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: TERMINAL CLI & INSTRUÇÕES DE EXECUÇÃO                   */}
        {/* ============================================================== */}
        {activeTab === 'cli' && (
          <div className="space-y-6">
            
            {/* Guide Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                Guia de Execução no Terminal Local
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                O código foi concebido para ser <strong>pronto para execução imediata</strong> em qualquer máquina com Python 3.8+ instalado, sem nenhuma dependência externa necessária (usa apenas a biblioteca padrão do Python).
              </p>
            </div>

            {/* Quick Command Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Interactive CLI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Modo 1: Interativo (CLI)
                    </span>
                    <button
                      onClick={() => copyToClipboard('python3 main.py', 'cli-1')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedCli === 'cli-1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">Menu Interativo no Console</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Abre a calculadora no terminal com menu numérico (1 a 6) para calcular, ver histórico e limpar.
                  </p>
                  <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800">
                    python3 main.py
                  </pre>
                </div>
              </div>

              {/* Card 2: Quick Calculation */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Modo 2: Cálculo Rápido
                    </span>
                    <button
                      onClick={() => copyToClipboard('python3 main.py --calc 81 "/" 3', 'cli-2')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedCli === 'cli-2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">Passagem por Argumentos</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Executa o cálculo diretamente e exibe a expressão com resultado no stdout.
                  </p>
                  <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800">
                    python3 main.py --calc 81 '/' 3
                  </pre>
                </div>
              </div>

              {/* Card 3: Test Division By Zero */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Modo 3: Testar Divisão por Zero
                    </span>
                    <button
                      onClick={() => copyToClipboard('python3 main.py --calc 100 "/" 0', 'cli-3')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedCli === 'cli-3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">Mensagem de Erro Personalizada</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Testa a captura de divisão por zero e exibição da mensagem tratada no terminal.
                  </p>
                  <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-rose-400 border border-slate-800">
                    python3 main.py --calc 100 '/' 0
                  </pre>
                </div>
              </div>

              {/* Card 4: Run Unittest */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Modo 4: Suíte de Testes
                    </span>
                    <button
                      onClick={() => copyToClipboard('python3 -m unittest discover tests -v', 'cli-4')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedCli === 'cli-4' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">Executar Todos os 24 Testes</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Executa o runner padrão de testes unitários do Python com saída detalhada.
                  </p>
                  <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-blue-400 border border-slate-800">
                    python3 -m unittest discover tests -v
                  </pre>
                </div>
              </div>

            </div>

            {/* Complete README Viewer Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-slate-900">Arquivo README.md incluído na raiz</h3>
                </div>
                <button
                  onClick={() => {
                    const readme = codeFiles.find(f => f.name === 'README.md');
                    if (readme) {
                      copyToClipboard(readme.content, 'readme');
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedCli === 'readme' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar README.md</span>
                </button>
              </div>

              <div className="prose prose-slate max-w-none text-xs text-slate-800 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
                {codeFiles.find(f => f.name === 'README.md')?.content || 'README.md carregado com sucesso.'}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Calculadora Hexagonal em Python • SOLID & Testes Unitários</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-600">
            <span>Adição (+)</span>
            <span>Subtração (−)</span>
            <span>Multiplicação (×)</span>
            <span>Divisão (÷)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
