# app/services/stt_google.py
import io
from google.cloud import speech_v2 as speech

def transcribe_bytes(audio_bytes: bytes, sample_rate_hz: int = 16000, language_code: str = "en-US") -> str:
    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        auto_decoding_config=speech.AutoDetectDecodingConfig(),
        language_codes=[language_code],
        model="latest_long",
        features=speech.RecognitionFeatures(enable_automatic_punctuation=True),
    )
    content = audio_bytes
    # inline content
    request = speech.RecognizeRequest(
        recognizer="projects/PROJECT_ID/locations/global/recognizers/_",  # TODO: 네 프로젝트에 맞게
        config=config,
        content=content,
    )
    response = client.recognize(request=request)
    text = ""
    for res in response.results:
        if res.alternatives:
            text += res.alternatives[0].transcript + " "
    return text.strip()
