# generate-podcast.py
import os, sys, json, argparse, tempfile, subprocess

def log_error(message):
    """Log error messages to stderr for debugging"""
    print(f"[PODCAST ERROR] {message}", file=sys.stderr)

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'langchain_google_genai',
        'langchain_community',
        'chromadb'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('.', '_') if '.' in package else package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        log_error(f"Missing required packages: {', '.join(missing_packages)}")
        log_error("Please install requirements: pip install -r scripts/requirements.txt")
        return False
    return True

if not check_dependencies():
    emit({"error": "Missing required Python packages. Please install requirements.txt"}, ok=False, code=1)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.prompts import PromptTemplate
    from langchain.chains import RetrievalQA
    import azure.cognitiveservices.speech as speechsdk
except ImportError as e:
    log_error(f"Import error: {str(e)}")
    emit({"error": f"Import error: {str(e)}"}, ok=False, code=1)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "centralindia")
VECTOR_STORE_DIRECTORY = "./chroma_db"

def text_to_speech(text, output_file, gender="F"):
    speech_key = AZURE_SPEECH_KEY
    service_region = AZURE_SPEECH_REGION

    if not speech_key:
        log_error("Azure Speech Service key not found in environment variables")
        log_error("Please set AZURE_SPEECH_KEY environment variable")
        return False

    try:
        # Set up speech config
        speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)

        # Choose voice based on gender input
        if gender.upper() == "M":
            speech_config.speech_synthesis_voice_name = "en-IN-PrabhatIndicNeural"   # Male voice
        else:
            speech_config.speech_synthesis_voice_name = "en-IN-AartiIndicNeural" # Female voice (default)

        # Save output to file
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_file)

        # Create synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

        # Convert text to speech
        result = synthesizer.speak_text_async(text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            log_error(f"Audio successfully generated: {output_file}")
            return True
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            log_error(f"Speech synthesis canceled: {cancellation_details.reason}")
            if cancellation_details.error_details:
                log_error(f"Error details: {cancellation_details.error_details}")
            return False
    except Exception as e:
        log_error(f"Exception in text_to_speech: {str(e)}")
        return False

def generate_podcast_script_with_rag(topic):
    """Generate podcast script using RAG pipeline"""
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY not found in environment variables.")

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
    vector_store = Chroma(persist_directory=VECTOR_STORE_DIRECTORY, embedding_function=embeddings)

    # Initialize the LLM with higher temperature for more natural speech
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY, temperature=0.7)

    # Create a Retriever
    retriever = vector_store.as_retriever(search_kwargs={"k": 6})

    # Create a Prompt Template for Podcast Generation
    prompt_template = """
    You are a podcast scriptwriter creating a 2–3 minute engaging podcast monologue.  

    **Instructions:**
    1. Use the context from the user's documents and LLM knowledge as your source.
    2. Write in a conversational, natural-sounding style that flows well when spoken aloud.
    3. Structure: Brief hook → 2–3 key insights → engaging conclusion.
    4. Use simple, accessible language suitable for audio consumption.
    5. Do not include any stage directions, sound effects, music cues, asterisks, or labels like "Host:".
    6. The output must be plain spoken text only, ready for text-to-speech conversion.

    **Context:**
    {context}

    **Topic:** {question}

    **Podcast Script (2–3 minutes, plain monologue):**
    """

    QA_PROMPT = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )

    # Create RetrievalQA Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm,
        retriever=retriever,
        chain_type_kwargs={"prompt": QA_PROMPT},
        return_source_documents=True,
    )

    # Generate the script
    result = qa_chain.invoke({"query": topic})
    return result["result"]

def generate_podcast_script_fallback(topic):
    """Generate podcast script without RAG when no documents are available"""
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY not found in environment variables.")

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY, temperature=0.7)
    
    prompt = f"""
    You are a podcast scriptwriter creating a 2-3 minute engaging podcast segment about the following topic:

    **Topic:** {topic}

    **Instructions:**
    1. Create a conversational, natural-sounding script that flows well when spoken aloud
    2. Structure: Brief hook → 2-3 key insights → engaging conclusion
    3. Use simple, accessible language suitable for audio consumption
    4. Include natural speech patterns and transitions
    5. Make it informative and engaging even without specific document context
    6. Focus on general knowledge and insights about the topic

    **Podcast Script (2-3 minutes, conversational tone):**
    """
    
    result = llm.invoke(prompt)
    return result.content

def generate_podcast_script(topic):
    """Generate podcast script with fallback handling"""
    try:
        if os.path.exists(VECTOR_STORE_DIRECTORY):
            log_error("Using RAG pipeline with existing vector store")
            return generate_podcast_script_with_rag(topic)
        else:
            log_error(f"Vector store directory '{VECTOR_STORE_DIRECTORY}' not found. Using fallback generation.")
            return generate_podcast_script_fallback(topic)
    except Exception as e:
        log_error(f"RAG pipeline failed: {str(e)}. Falling back to direct generation.")
        return generate_podcast_script_fallback(topic)

def emit(payload, ok=True, code=0):
    out = {"ok": ok, **payload}
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()
    sys.exit(code)

def main():
    parser = argparse.ArgumentParser(description="Generate podcast from selected content")
    parser.add_argument("topic", type=str, help="Topic or selected content for podcast")
    parser.add_argument("--gender", type=str, default="F", choices=["M", "F"], help="Voice gender (M/F)")
    args = parser.parse_args()

    try:
        log_error(f"Starting podcast generation for topic: {args.topic[:100]}...")
        log_error(f"Voice gender: {args.gender}")
        log_error(f"Google API Key available: {'Yes' if GOOGLE_API_KEY else 'No'}")
        log_error(f"Azure Speech Key available: {'Yes' if AZURE_SPEECH_KEY else 'No'}")
        log_error(f"Vector store exists: {'Yes' if os.path.exists(VECTOR_STORE_DIRECTORY) else 'No'}")

        if not GOOGLE_API_KEY:
            log_error("GOOGLE_API_KEY environment variable is required")
            emit({"error": "Missing GOOGLE_API_KEY environment variable"}, ok=False, code=1)
            
        if not AZURE_SPEECH_KEY:
            log_error("AZURE_SPEECH_KEY environment variable is required")
            emit({"error": "Missing AZURE_SPEECH_KEY environment variable"}, ok=False, code=1)

        # Generate podcast script
        script = generate_podcast_script(args.topic)
        log_error("Podcast script generated successfully")
        
        # Clean up script for speech (remove formatting markers)
        clean_script = script.replace("[INTRO MUSIC]", "").replace("[OUTRO MUSIC]", "")
        clean_script = clean_script.replace("Host:", "").strip()
        
        # Generate unique filename
        import time
        timestamp = int(time.time())
        audio_filename = f"podcast_{timestamp}.wav"
        audio_path = os.path.join("temp", "audio", audio_filename)
        
        # Ensure audio directory exists
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        log_error(f"Audio directory created: {os.path.dirname(audio_path)}")
        
        # Generate audio
        log_error("Starting text-to-speech conversion...")
        success = text_to_speech(clean_script, audio_path, args.gender)
        
        if success:
            log_error("Podcast generation completed successfully")
            emit({
                "script": script,
                "audio_file": f"/api/serve-audio/{audio_filename}",
                "audio_path": audio_path
            }, ok=True)
        else:
            log_error("Failed to generate audio file")
            emit({"error": "Failed to generate audio"}, ok=False, code=1)
            
    except Exception as e:
        log_error(f"Exception in main: {str(e)}")
        import traceback
        log_error(f"Traceback: {traceback.format_exc()}")
        emit({"error": str(e)}, ok=False, code=2)

if __name__ == "__main__":
    main()
