"""Testes Unitários para a Camada de Aplicação / Arquitetura Hexagonal.

Valida portas, injeção de dependência e persistência desacoplada.
"""

import unittest

from calculator.adapters.in_memory_repository import InMemoryCalculationRepository
from calculator.domain.exceptions import DivisionByZeroError
from calculator.domain.models import CalculationRequest, OperationType
from calculator.services.calculator_service import CalculatorService


class TestCalculatorService(unittest.TestCase):
    """Testes do serviço central que implementa a porta de entrada CalculatorUseCasePort."""

    def setUp(self):
        self.repository = InMemoryCalculationRepository()
        self.service = CalculatorService(repository=self.repository)

    def test_calculate_addition_and_persists_history(self):
        """Valida que o cálculo é executado e salvo automaticamente no repositório."""
        req = CalculationRequest(operand_a=15, operand_b=25, operation=OperationType.ADD)
        res = self.service.calculate(req)

        self.assertEqual(res.result, 40)
        self.assertEqual(res.formatted_expression, "15 + 25 = 40")

        history = self.service.get_history()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].result, 40)

    def test_calculate_percentage_and_persists_history(self):
        """Valida cálculo de porcentagem e sua persistência no histórico."""
        req = CalculationRequest(operand_a=200, operand_b=15, operation=OperationType.PERCENT)
        res = self.service.calculate(req)

        self.assertEqual(res.result, 30)
        self.assertEqual(res.formatted_expression, "200 % 15 = 30")

        history = self.service.get_history()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].result, 30)
        self.assertEqual(history[0].operation, OperationType.PERCENT)

    def test_calculate_division_by_zero_does_not_corrupt_history(self):
        """Valida que divisão por zero lança exceção personalizada e não polui o histórico."""
        req = CalculationRequest(operand_a=100, operand_b=0, operation=OperationType.DIVIDE)

        with self.assertRaises(DivisionByZeroError) as ctx:
            self.service.calculate(req)

        self.assertIn("Não é permitida a divisão por zero", str(ctx.exception))
        self.assertEqual(len(self.service.get_history()), 0)

    def test_clear_history(self):
        """Valida o método de limpeza do histórico de cálculos."""
        req1 = CalculationRequest(operand_a=2, operand_b=3, operation=OperationType.MULTIPLY)
        req2 = CalculationRequest(operand_a=10, operand_b=4, operation=OperationType.SUBTRACT)

        self.service.calculate(req1)
        self.service.calculate(req2)
        self.assertEqual(len(self.service.get_history()), 2)

        self.service.clear_history()
        self.assertEqual(len(self.service.get_history()), 0)

    def test_rejects_non_integer_operands(self):
        """Garante validação estrita de tipos para operandos inteiros no modelo de domínio."""
        with self.assertRaises(TypeError):
            CalculationRequest(operand_a=10.5, operand_b=2, operation=OperationType.ADD)  # type: ignore

        with self.assertRaises(TypeError):
            CalculationRequest(operand_a="10", operand_b=2, operation=OperationType.ADD)  # type: ignore

        with self.assertRaises(TypeError):
            CalculationRequest(operand_a=True, operand_b=2, operation=OperationType.ADD)  # type: ignore


if __name__ == "__main__":
    unittest.main()
