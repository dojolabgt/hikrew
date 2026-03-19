from abc import ABC, abstractmethod


class EmailProvider(ABC):
    name: str

    @abstractmethod
    def send(self, *, to: str, subject: str, html: str, from_: str) -> None:
        """Send a transactional email. Raises on failure."""
        ...
