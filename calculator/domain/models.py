"""Modelos de Domínio e Value Objects da Calculadora.

Representa os conceitos fundamentais do domínio de cálculo aritmético.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Union


class OperationType(str, Enum):
    """Enumeração com os tipos de operações aritméticas suportadas."""
    ADD = "+"
    SUBTRACT = "-"
    MULTIPLY = "*"
    DIVIDE = "/"

    @classmethod
    def from_string(cls, value: str) -> "OperationType":
        """Converte uma string representativa para o membro do Enum correspondente."""
        clean_val = value.strip().lower()
        mapping = {
            "+": cls.ADD,
            "add": cls.ADD,
            "soma": cls.ADD,
            "adicao": cls.ADD,
            "adição": cls.ADD,
            "-": cls.SUBTRACT,
            "sub": cls.SUBTRACT,
            "subtracao": cls.SUBTRACT,
            "subtração": cls.SUBTRACT,
            "*": cls.MULTIPLY,
            "x": cls.MULTIPLY,
            "mul": cls.MULTIPLY,
            "multiplicacao": cls.MULTIPLY,
            "multiplicação": cls.MULTIPLY,
            "/": cls.DIVIDE,
            "div": cls.DIVIDE,
            "divisao": cls.DIVIDE,
            "divisão": cls.DIVIDE,
        }
        if clean_val in mapping:
            return mapping[clean_val]
        raise ValueError(f"Operação desconhecida: {value}")


@dataclass(frozen=True)
class CalculationRequest:
    """Objeto de valor que encapsula a solicitação de cálculo.
    
    Imutável (frozen=True) para respeitar o princípio da imutabilidade de Value Objects.
    """
    operand_a: int
    operand_b: int
    operation: OperationType

    def __post_init__(self):
        if not isinstance(self.operand_a, int) or isinstance(self.operand_a, bool):
            raise TypeError("O primeiro operando deve ser um número inteiro.")
        if not isinstance(self.operand_b, int) or isinstance(self.operand_b, bool):
            raise TypeError("O segundo operando deve ser um número inteiro.")


@dataclass(frozen=True)
class CalculationResult:
    """Objeto de valor que representa o resultado auditável de uma operação de cálculo."""
    operand_a: int
    operand_b: int
    operation: OperationType
    result: Union[int, float]
    formatted_expression: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
