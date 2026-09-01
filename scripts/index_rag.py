from __future__ import annotations

import argparse
from pathlib import Path

from backend.config import settings
from backend.rag import DEFAULT_DOCUMENTS, RagError, build_index, discover_documents


def main() -> None:
    parser = argparse.ArgumentParser(description="Indexa los documentos del proyecto para el RAG")
    parser.add_argument(
        "locations",
        nargs="*",
        type=Path,
        default=list(DEFAULT_DOCUMENTS),
        help="Archivos .md/.txt o directorios (por defecto README y tadeo_videojuego)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Lista lo que se indexaría sin usar la API")
    args = parser.parse_args()

    documents = discover_documents(args.locations)
    if not documents:
        raise SystemExit("No se encontraron documentos .md o .txt.")
    print(f"Documentos encontrados: {len(documents)}")
    for document in documents:
        print(f"- {document}")
    if args.dry_run:
        return
    if not settings.openai_api_key:
        raise SystemExit("Falta OPENAI_API_KEY en el entorno.")

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise SystemExit("Instala las dependencias con `pip install -r requirements.txt`.") from exc

    try:
        payload = build_index(documents, client=OpenAI(api_key=settings.openai_api_key))
    except RagError as exc:
        raise SystemExit(str(exc)) from exc
    print(
        f"Índice creado en {settings.rag_index_path} "
        f"({len(payload['chunks'])} fragmentos, modelo {payload['embedding_model']})."
    )


if __name__ == "__main__":
    main()
