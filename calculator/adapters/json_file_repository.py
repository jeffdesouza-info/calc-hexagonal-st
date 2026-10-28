"""Adaptador de Repositório em Arquivo JSON (Driven Adapter).

Persiste o histórico de cálculos em um arquivo local para continuidade.
"""

import json
import os
from typing import List

from calculator.domain.models import CalculationResult, OperationType
from calculator.ports.outbound import CalculationRepositoryPort


class JsonFileCalculationRepository(CalculationRepositoryPort):
    """Implementação baseada em arquivo JSON da porta CalculationRepositoryPort."""

    def __init__(self, file_path: str = "history.json"):
        self.file_path = file_path
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def save(self, result: CalculationResult) -> None:
        history = self.get_all()
        history.append(result)
        data = [
            {
                "operand_a": item.operand_a,
                "operand_b": item.operand_b,
                "operation": item.operation.value,
                "result": item.result,
                "formatted_expression": item.formatted_expression,
                "timestamp": item.timestamp,
            }
            for item in history
        ]
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_all(self) -> List[CalculationResult]:
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [
                    CalculationResult(
                        operand_a=item["operand_a"],
                        operand_b=item["operand_b"],
                        operation=OperationType(item["operation"]),
                        result=item["result"],
                        formatted_expression=item["formatted_expression"],
                        timestamp=item["timestamp"],
                    )
                    for item in data
                ]
        except (json.JSONDecodeError, KeyError, ValueError):
            return []

    def clear(self) -> None:
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump([], f)
