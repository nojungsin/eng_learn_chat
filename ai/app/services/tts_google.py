# app/services/tts_google.py
import os
from google.cloud import texttospeech

def synth_to_file(text: str, outfile_path: str, language_code="en-US", voice_name="en-US-Neural2-C", audio_format="MP3"):
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        name=voice_name,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3 if audio_format.upper()=="MP3" else texttospeech.AudioEncoding.LINEAR16
    )
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    os.makedirs(os.path.dirname(outfile_path), exist_ok=True)
    with open(outfile_path, "wb") as f:
        f.write(response.audio_content)
    return outfile_path
