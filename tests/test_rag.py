from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from backend.rag import RagService, build_index, chunk_markdown, discover_documents


class FakeEmbeddings:
    def create(self, *, model: str, input: list[str] | str) -> SimpleNamespace:
        values = input if isinstance(input, list) else [input]
        data = []
        for index, value in enumerate(values):
            normalized = value.lower()
            vector = [1.0, 0.0] if "ecuaci" in normalized else [0.0, 1.0]
            data.append(SimpleNamespace(index=index, embedding=vector))
        return SimpleNamespace(data=data)


class FakeResponses:
    def __init__(self) -> None:
        self.last_input = ""

    def create(self, *, model: str, instructions: str, input: str) -> SimpleNamespace:
        self.last_input = input
        return SimpleNamespace(output_text="La ecuación conserva la igualdad [Fuente 1].")


class FakeClient:
    def __init__(self) -> None:
        self.embeddings = FakeEmbeddings()
        self.responses = FakeResponses()


def test_chunk_markdown_keeps_heading_and_source(tmp_path: Path) -> None:
    document = tmp_path / "guia.md"
    document.write_text("# Inicio\nIntroducción.\n\n## Ecuaciones\nContenido algebraico.", encoding="utf-8")

    chunks = chunk_markdown(document)

    assert [chunk.heading for chunk in chunks] == ["Inicio", "Ecuaciones"]
    assert all(chunk.source == "guia.md" for chunk in chunks)


def test_discover_documents_is_sorted_and_filters_extensions(tmp_path: Path) -> None:
    (tmp_path / "b.md").write_text("B", encoding="utf-8")
    (tmp_path / "a.txt").write_text("A", encoding="utf-8")
    (tmp_path / "ignore.json").write_text("{}", encoding="utf-8")

    documents = discover_documents([tmp_path])

    assert [path.name for path in documents] == ["b.md"]


def test_build_and_query_index_uses_most_similar_context(tmp_path: Path) -> None:
    algebra = tmp_path / "algebra.md"
    algebra.write_text("# Ecuaciones\nUna ecuación representa una igualdad.", encoding="utf-8")
    narrative = tmp_path / "historia.md"
    narrative.write_text("# Narrativa\nTadeo organiza su tarde.", encoding="utf-8")
    index_path = tmp_path / "rag-index.json"
    client = FakeClient()

    build_index([algebra, narrative], client=client, index_path=index_path)
    answer = RagService(client=client, index_path=index_path).ask("¿Qué es una ecuación?", top_k=1)

    assert answer.sources[0].source == "algebra.md"
    assert "igualdad" in client.responses.last_input
    assert "[Fuente 1]" in answer.answer
    assert json.loads(index_path.read_text(encoding="utf-8"))["version"] == 1
