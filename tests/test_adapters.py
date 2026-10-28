"""Testes Unitários para os Adaptadores (Inbound Adapters).

Valida a formatação de entradas JSON, respostas estruturadas e tratamento de erros.
"""

import unittest

from calculator.adapters.in_memory_repository import InMemoryCalculationRepository
from calculator.adapters.json_adapter import JsonAdapter
from calculator.services.calculator_service import CalculatorService


class TestJsonAdapter(unittest.TestCase):
    """Testa o adaptador JSON que conecta interfaces externas ao núcleo da aplicação."""

    def setUp(self):
        repo = InMemoryCalculationRepository()
        service = CalculatorService(repository=repo)
        self.adapter = JsonAdapter(service)

    def test_successful_multiplication(self):
        """Valida processamento com sucesso de operação válida."""
        payload = {"operand_a": 8, "operand_b": 9, "operation": "*"}
        res = self.adapter.process_request(payload)

        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["result"], 72)
        self.assertEqual(res["data"]["formatted_expression"], "8 * 9 = 72")

    def test_successful_percentage(self):
        """Valida processamento com sucesso da operação de porcentagem."""
        payload = {"operand_a": 200, "operand_b": 15, "operation": "%"}
        res = self.adapter.process_request(payload)

        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["result"], 30)
        self.assertEqual(res["data"]["formatted_expression"], "200 % 15 = 30")

    def test_division_by_zero_error_response(self):
        """Valida que divisão por zero retorna payload de erro customizado com código explicativo."""
        payload = {"operand_a": 50, "operand_b": 0, "operation": "/"}
        res = self.adapter.process_request(payload)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], "DIVISION_BY_ZERO")
        self.assertIn("Não é permitida a divisão por zero", res["error"])

    def test_invalid_operands_handling(self):
        """Valida tratamento amigável quando operandos não são inteiros."""
        payload = {"operand_a": "não_numero", "operand_b": 5, "operation": "+"}
        res = self.adapter.process_request(payload)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], "INVALID_OPERAND")

    def test_invalid_operation_symbol(self):
        """Valida quando o símbolo da operação não é suportado."""
        payload = {"operand_a": 10, "operand_b": 5, "operation": "^"}
        res = self.adapter.process_request(payload)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], "INVALID_OPERATION")
        self.assertIn("A operação '^' não é suportada", res["error"])

    def test_process_json_string_integration(self):
        """Valida fluxo completo convertendo string JSON para string JSON de saída."""
        json_in = '{"operand_a": 100, "operand_b": 25, "operation": "/"}'
        json_out = self.adapter.process_json_string(json_in)

        self.assertIn('"success": true', json_out)
        self.assertIn('"result": 4', json_out)


if __name__ == "__main__":
    unittest.main()
