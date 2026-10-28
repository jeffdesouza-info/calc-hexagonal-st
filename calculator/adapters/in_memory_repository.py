"""Adaptador de Repositório em Memória (Driven Adapter).

Armazena os cálculos em memória durante a execução.
"""

from typing import List

from calculator.domain.models import CalculationResult
from calculator.ports.outbound import CalculationRepositoryPort


class InMemoryCalculationRepository(CalculationRepositoryPort):
    """Implementação em memória da porta CalculationRepositoryPort."""

    def __init__(self):
        self._storage: List[CalculationResult] = []

    def save(self, result: CalculationResult) -> None:
        self._storage.append(result)

    def get_all(self) -> List[CalculationResult]:
        return list(self._storage)

    def clear(self) -> None:
        self._storage.clear()
