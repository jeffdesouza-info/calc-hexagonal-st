"""Adaptador JSON / IPC (Driving Adapter).

Permite invocar os casos de uso a partir de strings JSON ou dicionários,
facilitando a integração com APIs HTTP, scripts e frontends modernos.
"""

import json
from typing import Any, Dict

from calculator.domain.exceptions import (
    CalculatorDomainException,
    DivisionByZeroError,
    InvalidOperandError,
    InvalidOperationError,
)
from calculator.domain.models import CalculationRequest, OperationType
from calculator.ports.inbound import CalculatorUseCasePort


class JsonAdapter:
    """Adaptador que serializa e desserializa requisições e respostas em JSON."""

    def __init__(self, use_case: CalculatorUseCasePort):
        self._use_case = use_case

    def process_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Processa um dicionário contendo os dados do cálculo e retorna o resultado estruturado."""
        try:
            raw_a = payload.get("operand_a")
            raw_b = payload.get("operand_b")
            raw_op = payload.get("operation")

            if raw_a is None or raw_b is None or raw_op is None:
                return {
                    "success": False,
                    "error": "Parâmetros obrigatórios ausentes: operand_a, operand_b e operation são necessários.",
                    "code": "MISSING_PARAMETERS",
                }

            # Validação estrita de inteiros
            try:
                if isinstance(raw_a, bool) or isinstance(raw_b, bool):
                    raise ValueError()
                val_a = int(raw_a)
                val_b = int(raw_b)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "error": "Erro: Os operandos devem ser números inteiros válidos.",
                    "code": "INVALID_OPERAND",
                }

            try:
                op_enum = OperationType.from_string(str(raw_op))
            except ValueError:
                return {
                    "success": False,
                    "error": f"Erro: A operação '{raw_op}' não é suportada. Use: +, -, * ou /.",
                    "code": "INVALID_OPERATION",
                }

            request = CalculationRequest(operand_a=val_a, operand_b=val_b, operation=op_enum)
            result = self._use_case.calculate(request)

            return {
                "success": True,
                "data": {
                    "operand_a": result.operand_a,
                    "operand_b": result.operand_b,
                    "operation": result.operation.value,
                    "result": result.result,
                    "formatted_expression": result.formatted_expression,
                    "timestamp": result.timestamp,
                },
            }

        except DivisionByZeroError as exc:
            return {
                "success": False,
                "error": exc.message,
                "code": "DIVISION_BY_ZERO",
                "details": "Tentativa de divisão onde o denominador é igual a zero.",
            }
        except CalculatorDomainException as exc:
            return {
                "success": False,
                "error": str(exc),
                "code": "DOMAIN_ERROR",
            }
        except Exception as exc:
            return {
                "success": False,
                "error": f"Erro inesperado no servidor: {str(exc)}",
                "code": "INTERNAL_ERROR",
            }

    def process_json_string(self, json_str: str) -> str:
        """Processa string JSON e retorna string JSON."""
        try:
            data = json.loads(json_str)
            result = self.process_request(data)
            return json.dumps(result, ensure_ascii=False)
        except json.JSONDecodeError:
            return json.dumps(
                {"success": False, "error": "Formato JSON inválido", "code": "JSON_PARSE_ERROR"},
                ensure_ascii=False,
            )
