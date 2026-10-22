"""Application configuration.

Reads settings from environment variables and/or a local .env file.
For now it only holds which frontend address is allowed to call us (CORS)
and a placeholder for the Nebius key we'll use later.
"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Where the configuration is loaded from.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # The frontend dev server (Vite) runs here by default. The browser will
    # only let our frontend call the backend if the backend allows this origin.
    cors_origins: List[str] = ["http://localhost:5173"]

    # Not used yet; here so the plumbing exists when we add the AI step.
    nebius_api_key: str = ""


# One shared instance the rest of the app imports.
settings = Settings()
