"""Exceções de Domínio da Calculadora.

Define os erros de negócio desacoplados de qualquer framework ou interface.
"""


class CalculatorDomainException(Exception):
    """Exceção base para todas as falhas de domínio da calculadora."""
    pass


class DivisionByZeroError(CalculatorDomainException):
    """Exceção lançada quando ocorre tentativa de divisão por zero."""

    def __init__(self, message: str = "Erro: Não é permitida a divisão por zero. O divisor deve ser diferente de 0."):
        super().__init__(message)
        self.message = message


class InvalidOperandError(CalculatorDomainException):
    """Exceção lançada quando um operando não é um número inteiro válido."""

    def __init__(self, message: str = "Erro: Os operandos devem ser números inteiros válidos."):
        super().__init__(message)
        self.message = message


class InvalidOperationError(CalculatorDomainException):
    """Exceção lançada quando uma operação aritmética não é reconhecida ou suportada."""

    def __init__(self, operation: str):
        message = f"Erro: A operação '{operation}' não é suportada. Use: +, -, *, / ou %."
        super().__init__(message)
        self.message = message
