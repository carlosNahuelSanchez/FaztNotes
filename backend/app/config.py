import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    postgres_db: str = "faztnotes_db"
    postgres_user: str = "faztnotes_admin"
    postgres_password: str = "faztnotes_secure_pass"
    postgres_host: str = "db"
    postgres_port: int = 5432
    database_url: str = ""
    rag_top_k: int = 4
    embedding_model: str = "models/text-embedding-004"
    llm_model: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def sync_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"


settings = Settings()
