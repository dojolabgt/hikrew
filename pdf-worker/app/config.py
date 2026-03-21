from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379"
    pdf_jobs_queue: str = "pdf_jobs"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
