"""Portas de Saída (Driven / Outbound Ports) da Arquitetura Hexagonal.

Define as interfaces para persistência e serviços externos sem acoplamento a
bancos de dados específicos ou sistemas de arquivos.
"""

from abc import ABC, abstractmethod
from typing import List

from calculator.domain.models import CalculationResult


class CalculationRepositoryPort(ABC):
    """Porta de saída para persistência do histórico de cálculos."""

    @abstractmethod
    def save(self, result: CalculationResult) -> None:
        """Salva um resultado de cálculo no repositório."""
        pass

    @abstractmethod
    def get_all(self) -> List[CalculationResult]:
        """Retorna todos os cálculos armazenados."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Limpa todos os registros do repositório."""
        pass
