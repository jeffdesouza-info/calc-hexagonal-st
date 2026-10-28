"""Testes Unitários para as Estratégias de Operações Aritméticas (SOLID - SRP/LSP).

Valida cada operação de forma isolada, com foco especial no tratamento da divisão por zero e cálculo de porcentagem.
"""

import unittest

from calculator.domain.exceptions import DivisionByZeroError
from calculator.domain.models import OperationType
from calculator.domain.operations import (
    AdditionOperation,
    DivisionOperation,
    MultiplicationOperation,
    OperationRegistry,
    PercentageOperation,
    SubtractionOperation,
)


class TestArithmeticOperations(unittest.TestCase):
    """Bateria de testes unitários para as operações aritméticas fundamentais."""

    def setUp(self):
        self.add_op = AdditionOperation()
        self.sub_op = SubtractionOperation()
        self.mul_op = MultiplicationOperation()
        self.div_op = DivisionOperation()
        self.pct_op = PercentageOperation()

    # --- Testes de Adição ---
    def test_addition_positive_numbers(self):
        """Valida adição de dois números positivos."""
        self.assertEqual(self.add_op.execute(10, 5), 15)

    def test_addition_with_negative_number(self):
        """Valida adição com número negativo."""
        self.assertEqual(self.add_op.execute(10, -3), 7)
        self.assertEqual(self.add_op.execute(-10, -5), -15)

    def test_addition_with_zero(self):
        """Valida elemento neutro da adição (zero)."""
        self.assertEqual(self.add_op.execute(42, 0), 42)
        self.assertEqual(self.add_op.execute(0, 0), 0)

    # --- Testes de Subtração ---
    def test_subtraction_positive_numbers(self):
        """Valida subtração básica."""
        self.assertEqual(self.sub_op.execute(15, 5), 10)

    def test_subtraction_resulting_in_negative(self):
        """Valida subtração cujo resultado é negativo."""
        self.assertEqual(self.sub_op.execute(5, 12), -7)

    def test_subtraction_with_negatives(self):
        """Valida subtração envolvendo números negativos."""
        self.assertEqual(self.sub_op.execute(-5, -5), 0)
        self.assertEqual(self.sub_op.execute(10, -5), 15)

    def test_subtraction_with_zero(self):
        """Valida subtração com zero."""
        self.assertEqual(self.sub_op.execute(10, 0), 10)
        self.assertEqual(self.sub_op.execute(0, 10), -10)

    # --- Testes de Multiplicação ---
    def test_multiplication_positive_numbers(self):
        """Valida multiplicação de números positivos."""
        self.assertEqual(self.mul_op.execute(6, 7), 42)

    def test_multiplication_with_zero(self):
        """Valida multiplicação por zero (elemento absorvente)."""
        self.assertEqual(self.mul_op.execute(100, 0), 0)
        self.assertEqual(self.mul_op.execute(0, -50), 0)

    def test_multiplication_with_negative_numbers(self):
        """Valida regra de sinais da multiplicação."""
        self.assertEqual(self.mul_op.execute(4, -3), -12)
        self.assertEqual(self.mul_op.execute(-4, -3), 12)

    # --- Testes de Divisão e Divisão por Zero ---
    def test_division_exact(self):
        """Valida divisão exata de inteiros."""
        self.assertEqual(self.div_op.execute(20, 4), 5)
        self.assertEqual(self.div_op.execute(-20, 4), -5)
        self.assertEqual(self.div_op.execute(-20, -4), 5)

    def test_division_inexact(self):
        """Valida divisão inexata retornando valor decimal com precisão."""
        self.assertAlmostEqual(self.div_op.execute(10, 3), 3.333333, places=5)
        self.assertAlmostEqual(self.div_op.execute(1, 2), 0.5)

    def test_division_by_zero_raises_custom_exception(self):
        """Valida que a tentativa de dividir por zero lança DivisionByZeroError com mensagem personalizada."""
        with self.assertRaises(DivisionByZeroError) as context:
            self.div_op.execute(10, 0)

        self.assertIn("Não é permitida a divisão por zero", str(context.exception))
        self.assertIn("O divisor deve ser diferente de 0", str(context.exception))

    def test_division_zero_by_number(self):
        """Valida que zero dividido por qualquer número diferente de zero resulta em zero."""
        self.assertEqual(self.div_op.execute(0, 5), 0)

    # --- Testes de Porcentagem ---
    def test_percentage_exact_integer(self):
        """Valida porcentagem com resultado inteiro exato."""
        self.assertEqual(self.pct_op.execute(200, 15), 30)
        self.assertEqual(self.pct_op.execute(500, 10), 50)
        self.assertEqual(self.pct_op.execute(100, 25), 25)
        self.assertEqual(self.pct_op.execute(80, 50), 40)

    def test_percentage_inexact_decimal(self):
        """Valida porcentagem cujo resultado possui casas decimais."""
        self.assertEqual(self.pct_op.execute(25, 10), 2.5)
        self.assertEqual(self.pct_op.execute(50, 3), 1.5)
        self.assertEqual(self.pct_op.execute(125, 33), 41.25)

    def test_percentage_with_zero(self):
        """Valida porcentagem quando um dos operandos é zero."""
        self.assertEqual(self.pct_op.execute(0, 50), 0)
        self.assertEqual(self.pct_op.execute(100, 0), 0)
        self.assertEqual(self.pct_op.execute(0, 0), 0)

    def test_percentage_with_negative_numbers(self):
        """Valida cálculo de porcentagem envolvendo valores negativos."""
        self.assertEqual(self.pct_op.execute(-200, 15), -30)
        self.assertEqual(self.pct_op.execute(200, -15), -30)
        self.assertEqual(self.pct_op.execute(-50, -10), 5)

    def test_percentage_commutativity(self):
        """Valida a comutatividade da operação de porcentagem: a % b == b % a."""
        self.assertEqual(self.pct_op.execute(200, 15), self.pct_op.execute(15, 200))
        self.assertEqual(self.pct_op.execute(80, 25), self.pct_op.execute(25, 80))

    # --- Teste de Registro OCP ---
    def test_operation_registry_retrieval(self):
        """Valida recuperação correta das estratégias no registro desacoplado."""
        registry = OperationRegistry()
        self.assertIsInstance(registry.get(OperationType.ADD), AdditionOperation)
        self.assertIsInstance(registry.get(OperationType.SUBTRACT), SubtractionOperation)
        self.assertIsInstance(registry.get(OperationType.MULTIPLY), MultiplicationOperation)
        self.assertIsInstance(registry.get(OperationType.DIVIDE), DivisionOperation)
        self.assertIsInstance(registry.get(OperationType.PERCENT), PercentageOperation)


if __name__ == "__main__":
    unittest.main()
