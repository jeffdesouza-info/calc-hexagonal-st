"""Adaptador de Linha de Comando (CLI Driving Adapter).

Permite ao usuário interagir com a calculadora através do terminal.
"""

import sys
from calculator.domain.exceptions import CalculatorDomainException, DivisionByZeroError
from calculator.domain.models import CalculationRequest, OperationType
from calculator.ports.inbound import CalculatorUseCasePort


class CommandLineAdapter:
    """Adaptador de Interface de Linha de Comando para o caso de uso da Calculadora."""

    def __init__(self, use_case: CalculatorUseCasePort):
        self._use_case = use_case

    def run_interactive(self) -> None:
        """Executa o loop interativo da CLI no terminal."""
        print("=" * 60)
        print("🧮 CALCULADORA SIMPLES EM PYTHON - ARQUITETURA HEXAGONAL")
        print("   Operações aritméticas fundamentais com números inteiros")
        print("=" * 60)

        while True:
            print("\nSelecione uma opção:")
            print("  [1] Adição (+)")
            print("  [2] Subtração (-)")
            print("  [3] Multiplicação (*)")
            print("  [4] Divisão (/)")
            print("  [5] Visualizar Histórico")
            print("  [6] Limpar Histórico")
            print("  [0] Sair")

            escolha = input("\nDigite o número da opção desejada: ").strip()

            if escolha == "0":
                print("\nEncerrando a calculadora. Até breve!")
                break

            if escolha in ("1", "2", "3", "4"):
                op_map = {
                    "1": OperationType.ADD,
                    "2": OperationType.SUBTRACT,
                    "3": OperationType.MULTIPLY,
                    "4": OperationType.DIVIDE,
                }
                op = op_map[escolha]
                self._handle_calculation(op)

            elif escolha == "5":
                self._display_history()

            elif escolha == "6":
                self._use_case.clear_history()
                print("\n✅ Histórico limpo com sucesso!")

            else:
                print("\n⚠️ Opção inválida! Escolha uma das opções entre 0 e 6.")

    def _handle_calculation(self, op: OperationType) -> None:
        """Solicita os operandos inteiros e executa a operação tratando exceções."""
        try:
            val_a_str = input("Digite o primeiro número inteiro: ").strip()
            val_b_str = input("Digite o segundo número inteiro: ").strip()

            try:
                num_a = int(val_a_str)
                num_b = int(val_b_str)
            except ValueError:
                print("\n❌ ERRO: Por favor, digite apenas números inteiros válidos!")
                return

            request = CalculationRequest(operand_a=num_a, operand_b=num_b, operation=op)
            result = self._use_case.calculate(request)

            print("\n" + "-" * 40)
            print(f"🎉 Resultado: {result.formatted_expression}")
            print("-" * 40)

        except DivisionByZeroError as exc:
            print("\n" + "!" * 50)
            print(f"🛑 {exc.message}")
            print("!" * 50)
        except CalculatorDomainException as exc:
            print(f"\n❌ Erro de Negócio: {exc}")
        except Exception as exc:
            print(f"\n❌ Erro inesperado: {exc}")

    def _display_history(self) -> None:
        """Exibe os cálculos anteriores persistidos."""
        history = self._use_case.get_history()
        print("\n📜 --- HISTÓRICO DE CÁLCULOS ---")
        if not history:
            print("Nenhum cálculo realizado até o momento.")
            return

        for idx, item in enumerate(history, start=1):
            print(f"  {idx}. [{item.timestamp[:19]}] {item.formatted_expression}")
        print("---------------------------------")
