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

    # Nebius Token Factory (NVIDIA Nemotron). If the key is blank, the AI calls
    # fall back to deterministic templates, so the app runs without credentials.
    nebius_api_key: str = ""
    nebius_base_url: str = "https://api.tokenfactory.nebius.com/v1/"
    # CONFIRM the exact id against the live Token Factory catalog before relying on it.
    nebius_model: str = "nvidia/Nemotron-3-Super-120b-a12b"


# One shared instance the rest of the app imports.
settings = Settings()
