"""Serviço de Aplicação da Calculadora.

Implementa a porta de entrada CalculatorUseCasePort e orquestra as regras
do domínio com as portas de saída (repositório).
"""

from typing import List, Optional

from calculator.domain.models import CalculationRequest, CalculationResult
from calculator.domain.operations import OperationRegistry
from calculator.ports.inbound import CalculatorUseCasePort
from calculator.ports.outbound import CalculationRepositoryPort


class CalculatorService(CalculatorUseCasePort):
    """Serviço principal que orquestra os cálculos aritméticos."""

    def __init__(
        self,
        repository: CalculationRepositoryPort,
        registry: Optional[OperationRegistry] = None,
    ):
        """Injeção de dependências respeitando o DIP."""
        self._repository = repository
        self._registry = registry or OperationRegistry()

    def calculate(self, request: CalculationRequest) -> CalculationResult:
        """Executa a operação aritmética solicitada e registra o resultado."""
        strategy = self._registry.get(request.operation)
        result_value = strategy.execute(request.operand_a, request.operand_b)

        formatted_expr = f"{request.operand_a} {request.operation.value} {request.operand_b} = {result_value}"

        calculation_result = CalculationResult(
            operand_a=request.operand_a,
            operand_b=request.operand_b,
            operation=request.operation,
            result=result_value,
            formatted_expression=formatted_expr,
        )

        # Persiste o resultado via porta de saída
        self._repository.save(calculation_result)

        return calculation_result

    def get_history(self) -> List[CalculationResult]:
        """Obtém o histórico de cálculos através do repositório."""
        return self._repository.get_all()

    def clear_history(self) -> None:
        """Limpa o histórico de cálculos."""
        self._repository.clear()
