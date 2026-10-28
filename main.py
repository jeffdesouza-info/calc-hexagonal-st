"""Ponto de Entrada Principal da Aplicação Calculadora Hexagonal em Python.

Permite:
- Execução interativa via CLI: `python3 main.py`
- Execução rápida por argumentos: `python3 main.py --calc 15 * 4`
- Modo JSON para integração com APIs / Frontend: `python3 main.py --json '{"operand_a": 10, "operand_b": 2, "operation": "/"}'`
- Execução direta dos testes unitários: `python3 main.py --test`
"""

import argparse
import sys
import unittest

from calculator.adapters.cli_adapter import CommandLineAdapter
from calculator.adapters.in_memory_repository import InMemoryCalculationRepository
from calculator.adapters.json_adapter import JsonAdapter
from calculator.adapters.json_file_repository import JsonFileCalculationRepository
from calculator.domain.models import CalculationRequest, OperationType
from calculator.services.calculator_service import CalculatorService


def bootstrap_calculator_service(persist_file: bool = True) -> CalculatorService:
    """Configura e injeta as dependências da Calculadora (Dependency Injection)."""
    if persist_file:
        repository = JsonFileCalculationRepository("history.json")
    else:
        repository = InMemoryCalculationRepository()
    return CalculatorService(repository=repository)


def main():
    parser = argparse.ArgumentParser(
        description="Calculadora simples em Python com Arquitetura Hexagonal e Princípios SOLID."
    )
    parser.add_argument(
        "--json",
        type=str,
        help="Executa uma operação a partir de um payload JSON e retorna JSON na saída padrão.",
    )
    parser.add_argument(
        "--calc",
        nargs=3,
        metavar=("A", "OP", "B"),
        help="Executa um cálculo rápido. Exemplo: --calc 20 / 4",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Executa a suíte de testes unitários.",
    )

    args = parser.parse_args()
    service = bootstrap_calculator_service(persist_file=True)

    if args.test:
        loader = unittest.TestLoader()
        suite = loader.discover("tests")
        runner = unittest.TextTestRunner(verbosity=2)
        test_result = runner.run(suite)
        sys.exit(0 if test_result.wasSuccessful() else 1)

    if args.json:
        adapter = JsonAdapter(service)
        output = adapter.process_json_string(args.json)
        print(output)
        return

    if args.calc:
        a_str, op_str, b_str = args.calc
        adapter = JsonAdapter(service)
        payload = {"operand_a": a_str, "operand_b": b_str, "operation": op_str}
        res = adapter.process_request(payload)
        if res["success"]:
            print(res["data"]["formatted_expression"])
        else:
            print(f"❌ {res['error']}")
            sys.exit(1)
        return

    # Modo Interativo CLI padrão
    cli = CommandLineAdapter(service)
    cli.run_interactive()


if __name__ == "__main__":
    main()
