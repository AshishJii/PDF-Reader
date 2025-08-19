import os
import sys
import json
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

# Get the Google API key from environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# --- Configuration ---
VECTOR_STORE_DIRECTORY = "./chroma_db"

def main():
    """
    Main function to handle user queries and provide answers using the RAG pipeline.
    """
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        return

    user_query = sys.argv[1]

    try:
        # 1. Initialize Embeddings and Vector Store
        if not os.path.exists(VECTOR_STORE_DIRECTORY):
            print(json.dumps({"error": f"Vector store directory '{VECTOR_STORE_DIRECTORY}' not found. Please run ingest.py first."}))
            return

        if not GOOGLE_API_KEY:
            print(json.dumps({"error": "GOOGLE_API_KEY not found in environment variables."}))
            return

        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
        vector_store = Chroma(persist_directory=VECTOR_STORE_DIRECTORY, embedding_function=embeddings)

        # 2. Initialize the LLM
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY, temperature=0.3)

        # 3. Create a Retriever
        retriever = vector_store.as_retriever(search_kwargs={"k": 6}) # Retrieve top 6 relevant chunks

        # 4. Create a Prompt Template
        prompt_template = """
        Use the following pieces of context to respond to the input at the end.
        - If the input is a **question**, answer it directly.
        - If the input is a **term or phrase**, provide a clear explanation.
        Prioritize the given context first, but you may also use your own knowledge if it helps.
        If you still don't know the answer, say that you don't know.

        Context:
        {context}

        Input: {question}

        Response:
        """

        QA_PROMPT = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )

        # 5. Create RetrievalQA Chain
        qa_chain = RetrievalQA.from_chain_type(
            llm,
            retriever=retriever,
            chain_type_kwargs={"prompt": QA_PROMPT},
            return_source_documents=True,
        )

        # 6. Get the Answer
        result = qa_chain.invoke({"query": user_query})

        # 7. Format response as JSON
        sources = []
        for source in result["source_documents"]:
            sources.append({
                "file": source.metadata.get('source', 'Unknown'),
                "page": source.metadata.get('page', 'Unknown'),
                "content": source.page_content[:200] + "..." if len(source.page_content) > 200 else source.page_content
            })

        response = {
            "answer": result["result"],
            "sources": sources,
            "query": user_query
        }

        print(json.dumps(response))

    except Exception as e:
        print(json.dumps({"error": f"An error occurred during query execution: {str(e)}"}))

if __name__ == "__main__":
    main()
