from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379"
    redis_queue_name: str = "email_queue"

    mail_from: str = "Hi Krew <noreply@hikrew.com>"
    # Comma-separated provider names in priority order
    mail_providers: str = "resend,brevo"

    resend_api_key: str = ""
    brevo_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
