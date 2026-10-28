"""Estratégias de Operações Aritméticas fundamentadas nos princípios SOLID.

- SRP: Cada classe tem apenas a responsabilidade de executar a sua respectiva operação.
- OCP: Novas operações podem ser adicionadas criando novas classes sem alterar as existentes.
- LSP: Todas as estratégias respeitam o contrato da interface base OperationStrategy.
"""

from abc import ABC, abstractmethod
from typing import Dict, Union

from calculator.domain.exceptions import DivisionByZeroError
from calculator.domain.models import OperationType


class OperationStrategy(ABC):
    """Interface abstrata base para qualquer estratégia de operação aritmética (ISP / LSP)."""

    @abstractmethod
    def execute(self, a: int, b: int) -> Union[int, float]:
        """Executa a operação aritmética entre dois números inteiros."""
        pass


class AdditionOperation(OperationStrategy):
    """Estratégia responsável exclusivamente pela operação de Adição (SRP)."""

    def execute(self, a: int, b: int) -> int:
        return a + b


class SubtractionOperation(OperationStrategy):
    """Estratégia responsável exclusivamente pela operação de Subtração (SRP)."""

    def execute(self, a: int, b: int) -> int:
        return a - b


class MultiplicationOperation(OperationStrategy):
    """Estratégia responsável exclusivamente pela operação de Multiplicação (SRP)."""

    def execute(self, a: int, b: int) -> int:
        return a * b


class DivisionOperation(OperationStrategy):
    """Estratégia responsável exclusivamente pela operação de Divisão (SRP).
    
    Trata a regra crítica de negócio: divisão por zero é proibida.
    """

    def execute(self, a: int, b: int) -> Union[int, float]:
        if b == 0:
            raise DivisionByZeroError(
                "Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."
            )
        # Se for divisão exata, retorna inteiro, caso contrário float formatado
        if a % b == 0:
            return a // b
        return round(a / b, 6)


class OperationRegistry:
    """Registro desacoplado de operações (Open/Closed Principle).
    
    Permite registrar novas operações sem modificar o código do serviço central.
    """

    def __init__(self):
        self._strategies: Dict[OperationType, OperationStrategy] = {
            OperationType.ADD: AdditionOperation(),
            OperationType.SUBTRACT: SubtractionOperation(),
            OperationType.MULTIPLY: MultiplicationOperation(),
            OperationType.DIVIDE: DivisionOperation(),
        }

    def register(self, op_type: OperationType, strategy: OperationStrategy) -> None:
        """Registra ou estende uma nova estratégia de operação."""
        self._strategies[op_type] = strategy

    def get(self, op_type: OperationType) -> OperationStrategy:
        """Obtém a estratégia de operação correspondente."""
        strategy = self._strategies.get(op_type)
        if not strategy:
            raise ValueError(f"Estratégia não encontrada para a operação {op_type.value}")
        return strategy
