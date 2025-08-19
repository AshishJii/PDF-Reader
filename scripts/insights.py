# insights.py
import os, sys, json, argparse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

PROMPT_TMPL = """
You are an expert researcher. Ignore local data.

Return a JSON object with EXACTLY these keys:
- "key_takeaways": array of up to {n} concise bullets
- "did_you_know": array of up to {n} concise bullets
- "contradictions": array of up to {n} concise bullets
- "examples": array of up to {n} concise bullets

Rules:
- Prefer numbers, dates, names.
- Append "(uncertain)" to any claim that might be uncertain.
- No text outside the JSON. No code fences.
{format_instructions}

Input: {question}
"""

def emit(payload, ok=True, code=0):
    out = {"ok": ok, **payload}
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()
    sys.exit(code)

def main():
    parser = argparse.ArgumentParser(description="LLM-only insights as strict JSON.")
    parser.add_argument("query", type=str, help="Topic or question, or '-' to read from stdin.")
    parser.add_argument("-n", "--num", type=int, default=5, help="Max items per section.")
    parser.add_argument("--temperature", type=float, default=0.3)
    parser.add_argument("--model", type=str, default=os.getenv("GOOGLE_MODEL_NAME", "gemini-2.0-flash"))
    args = parser.parse_args()

    if not GOOGLE_API_KEY:
        emit({"error": "GOOGLE_API_KEY missing"}, ok=False, code=1)

    user_query = args.query
    if user_query == "-":
        user_query = sys.stdin.read().strip()

    try:
        llm = ChatGoogleGenerativeAI(
            model=args.model,
            google_api_key=GOOGLE_API_KEY,
            temperature=args.temperature,
        )
        parser = JsonOutputParser()
        prompt = PromptTemplate(
            template=PROMPT_TMPL,
            input_variables=["question", "n"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        chain = prompt | llm | parser  # LCEL, no deprecation warnings

        data = chain.invoke({"question": user_query, "n": args.num})
        # Ensure all keys exist
        result = {
            "query": user_query,
            "model": args.model,
            "temperature": args.temperature,
            "key_takeaways": data.get("key_takeaways", []) or [],
            "did_you_know": data.get("did_you_know", []) or [],
            "contradictions": data.get("contradictions", []) or [],
            "examples": data.get("examples", []) or [],
        }
        emit(result, ok=True, code=0)
    except Exception as e:
        emit({"error": str(e)}, ok=False, code=2)

if __name__ == "__main__":
    main()
