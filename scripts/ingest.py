import os
import sys
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

# Get the Google API key from environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# --- Configuration ---
VECTOR_STORE_DIRECTORY = "./chroma_db"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

def ingest_documents(document_paths):
    """
    Ingest specific PDF documents, create embeddings, and store them in a Chroma vector store.
    
    Args:
        document_paths (list): List of file paths to process
    """
    print(f"--- Starting Document Ingestion for {len(document_paths)} documents ---")

    already_processed = set()
    if os.path.exists(VECTOR_STORE_DIRECTORY):
        try:
            embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
            vector_store = Chroma(
                persist_directory=VECTOR_STORE_DIRECTORY,
                embedding_function=embeddings
            )
            # Get existing document sources to avoid duplicates
            existing_docs = vector_store.get()
            if existing_docs and 'metadatas' in existing_docs:
                for metadata in existing_docs['metadatas']:
                    if metadata and 'source' in metadata:
                        already_processed.add(os.path.basename(metadata['source']))
            print(f"Found {len(already_processed)} already processed documents")
        except Exception as e:
            print(f"Warning: Could not check existing documents: {e}")

    # 1. Load Documents
    documents = []
    processed_files = []
    skipped_files = []
    
    for filepath in document_paths:
        if not os.path.exists(filepath):
            print(f"Error: File '{filepath}' not found.")
            continue
            
        if not filepath.endswith(".pdf"):
            print(f"Skipping non-PDF file: {filepath}")
            continue
        
        filename = os.path.basename(filepath)
        if filename in already_processed:
            print(f"  - Skipping already processed: {filename}")
            skipped_files.append(filename)
            continue
            
        try:
            loader = PyPDFLoader(filepath)
            doc_pages = loader.load()
            documents.extend(doc_pages)
            processed_files.append(filename)
            print(f"  - Loaded {filename} ({len(doc_pages)} pages)")
        except Exception as e:
            print(f"Error loading {filename}: {e}")

    if not documents:
        message = f"No new documents to process. Skipped {len(skipped_files)} already processed files."
        print(message)
        return {"success": True, "message": message, "skipped_files": skipped_files}

    # 2. Split Documents
    print(f"\nSplitting {len(documents)} pages into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} document chunks.")

    # 3. Create Embeddings
    print("\nInitializing Google Generative AI Embeddings...")
    if not GOOGLE_API_KEY:
        print("Error: GOOGLE_API_KEY not found in environment variables.")
        return {"success": False, "message": "GOOGLE_API_KEY not found"}
        
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)

    # 4. Create and Populate Vector Store
    print("\nCreating and populating Chroma vector store...")
    try:
        # Load existing vector store or create new one
        if os.path.exists(VECTOR_STORE_DIRECTORY):
            vector_store = Chroma(
                persist_directory=VECTOR_STORE_DIRECTORY,
                embedding_function=embeddings
            )
            # Add new documents to existing store
            vector_store.add_documents(chunks)
        else:
            # Create new vector store
            vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=VECTOR_STORE_DIRECTORY
            )
        
        print(f"Vector store updated with {len(chunks)} chunks from {len(processed_files)} files.")
        print(f"Processed files: {', '.join(processed_files)}")
        if skipped_files:
            print(f"Skipped already processed files: {', '.join(skipped_files)}")
        
    except Exception as e:
        print(f"Error creating/updating vector store: {e}")
        return {"success": False, "message": f"Vector store error: {str(e)}"}

    print("\n--- Document Ingestion Complete ---")
    return {
        "success": True, 
        "message": f"Successfully ingested {len(processed_files)} new documents with {len(chunks)} chunks",
        "processed_files": processed_files,
        "skipped_files": skipped_files,
        "chunks_count": len(chunks)
    }

def main():
    """
    Main function that accepts document paths as command line arguments
    """
    if len(sys.argv) < 2:
        print("Usage: python ingest.py <document_path1> [document_path2] ...")
        return
    
    document_paths = sys.argv[1:]
    result = ingest_documents(document_paths)
    
    # Print result as JSON for API consumption
    import json
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
