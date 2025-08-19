#!/usr/bin/env python3
import os
import sys
import json
import argparse
import time
from pydub import AudioSegment

def log_error(message):
    print(f"[PODCAST ERROR] {message}", file=sys.stderr)

google_key = "AIzaSyDlhyPLL9m8kjnqvchW2NXLzMt5otMWdno"
azure_key = "FbjlhyvEkRrGvca1QdbHUZty3gFLKeaadBjE8ndSkPQXoJnE78RsJQQJ99BHACGhslBXJ3w3AAAYACOGSFms"
azure_region = "centralindia"
vector_dir = "./chroma_db"

# Ensure env vars
os.environ.setdefault("GOOGLE_API_KEY", google_key)
os.environ.setdefault("AZURE_SPEECH_KEY", azure_key)
os.environ.setdefault("AZURE_SPEECH_REGION", azure_region)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.prompts import PromptTemplate
    from langchain.chains import RetrievalQA
    import azure.cognitiveservices.speech as speechsdk
except ImportError as e:
    log_error(f"Import error: {e}")
    sys.exit(1)

def text_to_speech(text, output_file, gender="F"):
    speech_config = speechsdk.SpeechConfig(subscription=azure_key, region=azure_region)
    voice = "en-IN-AartiIndicNeural" if gender.upper()=="F" else "en-IN-PrabhatIndicNeural"
    speech_config.speech_synthesis_voice_name = voice
    audio_conf = speechsdk.audio.AudioOutputConfig(filename=output_file)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_conf)
    res = synthesizer.speak_text_async(text).get()
    if res.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        log_error(f"Generated {output_file}")
        return True
    log_error(f"TTS failed for {output_file}: {res.cancellation_details.reason}")
    return False

def generate_dialogue_script(topic):
    # Use fallback direct generation for simplicity
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=google_key, temperature=0.7)
    prompt = f"""
You are a podcast writer. Create a 2-3 minute conversational dialogue between two speakers about the topic: {topic}.
Structure as alternating short exchanges prefixed by "Person1:" and "Person2:".
Separate each line with a newline.
Make it engaging and informative with natural conversation flow.
"""
    resp = llm.invoke(prompt)
    return resp.content.strip()

def merge_audios(audio_paths, output_path):
    combined = AudioSegment.empty()
    for p in audio_paths:
        seg = AudioSegment.from_file(p)
        combined += seg
    combined.export(output_path, format="wav")
    log_error(f"Merged audio saved to {output_path}")

def emit(payload, ok=True, code=0):
    out = {"ok": ok, **payload}
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()
    sys.exit(code)

def main():
    parser = argparse.ArgumentParser(description="Generate two-person podcast from selected content")
    parser.add_argument("topic", type=str, help="Topic or selected content for podcast")
    parser.add_argument("--gender", type=str, default="F", choices=["M", "F"], help="Voice gender (M/F) - ignored for two-person format")
    args = parser.parse_args()

    try:
        log_error(f"Starting two-person podcast generation for topic: {args.topic[:100]}...")
        
        script = generate_dialogue_script(args.topic)
        log_error("Dialogue script generated.")
        lines = [l.strip() for l in script.splitlines() if l.strip()]

        temp_dir = os.path.join("temp", "audio")
        os.makedirs(temp_dir, exist_ok=True)
        
        audio_files = []
        for idx, line in enumerate(lines):
            if line.startswith("Person1:"):
                text = line.split("Person1:",1)[1].strip()
                gender = "F"
            elif line.startswith("Person2:"):
                text = line.split("Person2:",1)[1].strip()
                gender = "M"
            else:
                continue
            
            fname = os.path.join(temp_dir, f"audio_part_{idx}.wav")
            if text_to_speech(text, fname, gender):
                audio_files.append(fname)

        timestamp = int(time.time())
        final_fname = f"podcast_{timestamp}.wav"
        final_path = os.path.join(temp_dir, final_fname)
        
        merge_audios(audio_files, final_path)
        
        for audio_file in audio_files:
            try:
                os.remove(audio_file)
            except:
                pass
        
        emit({
            "script": script,
            "audio_file": f"/api/serve-audio/{final_fname}",
            "audio_path": final_path
        }, ok=True)
        
    except Exception as e:
        log_error(f"Exception in main: {str(e)}")
        emit({"error": str(e)}, ok=False, code=2)

if __name__ == "__main__":
    main()
