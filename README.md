# PDF-Reader

Web-based PDF reading and “connect the dots” system for the Adobe India Hackathon 2025 Finale.

## What it does

* High-fidelity PDF viewing with zoom/pan.
* Bulk upload a “library” of PDFs + open a fresh PDF to read.
* Select text → press **Analyse Selected Text**:

  * Generates contextual insights (takeaways, contradictions, examples).
  * Surfaces up to 5 related sections and snippets from your library.
  * Creates an audio overview or podcast based on the selected text and related insights.

## Tech summary

* PDF render: Adobe PDF Embed API (preferred).
* Semantic search over sectionized PDFs (as per Round 1A).
* Insight generation across documents.
* LLM/TTS pluggable via env vars.
* Dockerized. Single container serves frontend + backend on port `8080`.

## Quick start

### 1) Build

```bash
docker build --platform linux/amd64 -t yourimageidentifier .
```

### 2) Run

```bash
docker run -v "$HOME/credentials:/credentials" \
  -e ADOBE_EMBED_API_KEY="your_adobe_embed_api_key" \
  -e LLM_PROVIDER=gemini \
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
  -e GEMINI_MODEL="gemini-2.5-flash" \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY="your_azure_tts_key" \
  -e AZURE_TTS_ENDPOINT="https://<region>.tts.speech.microsoft.com/cognitiveservices/v1" \
  -p 8080:8080 yourimageidentifier
```

Open: `http://localhost:8080`

## Environment variables

| Name                             | Required      | Notes                                         |
| -------------------------------- | ------------- | --------------------------------------------- |
| `ADOBE_EMBED_API_KEY`            | Optional      | Needed if using Adobe PDF Embed API           |
| `LLM_PROVIDER`                   | Yes           | `gemini` or `ollama`                          |
| `GOOGLE_APPLICATION_CREDENTIALS` | When `gemini` | Path to JSON creds mounted into the container |
| `GEMINI_MODEL`                   | When `gemini` | e.g. `gemini-2.5-flash`                       |
| `TTS_PROVIDER`                   | Yes           | `azure`, `gcp`, or `local`                    |
| `AZURE_TTS_KEY`                  | When `azure`  | Provided at eval                              |
| `AZURE_TTS_ENDPOINT`             | When `azure`  | Provided at eval                              |
| `OLLAMA_MODEL`                   | When `ollama` | e.g. `llama3`                                 |

## Usage

1. Bulk-upload your past PDFs to build the library.
2. Open a fresh PDF to read.
3. Select any text in the PDF and click **Analyse Selected Text**.
4. The system generates:

   * Contextual insights (takeaways, contradictions, examples).
   * Up to 5 related sections with snippets from your library.
   * An optional audio overview / podcast based on the text and insights.
5. Click any snippet to jump directly to the relevant section in its source PDF.

## License

Proprietary for hackathon submission.

