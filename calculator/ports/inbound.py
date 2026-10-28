"""Portas de Entrada (Driving / Inbound Ports) da Arquitetura Hexagonal.

Define os casos de uso expostos pelo núcleo da aplicação para qualquer adaptador
externo (CLI, REST API, Web, etc.).
"""

from abc import ABC, abstractmethod
from typing import List

from calculator.domain.models import CalculationRequest, CalculationResult


class CalculatorUseCasePort(ABC):
    """Porta de entrada principal para casos de uso de cálculo aritmético."""

    @abstractmethod
    def calculate(self, request: CalculationRequest) -> CalculationResult:
        """Executa um cálculo aritmético a partir de uma solicitação."""
        pass

    @abstractmethod
    def get_history(self) -> List[CalculationResult]:
        """Recupera o histórico de cálculos realizados."""
        pass

    @abstractmethod
    def clear_history(self) -> None:
        """Limpa o histórico de cálculos."""
        pass
