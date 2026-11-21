"""
EduVerse AI - Multilingual Academic Language Service (Phase 4)
Supports English, Telugu (తెలుగు), and Hindi (हिंदी)
"""
import re
from typing import Dict, Optional, Tuple
from app.ai.ai_config import SUPPORTED_LANGUAGES

# Common educational phrases dictionary for zero-shot fast local translation fallbacks
ACADEMIC_TRANSLATIONS = {
    # English to Telugu and Hindi
    "welcome_parent": {
        "en": "Welcome to EduVerse Parent AI. Ask any question about your child's academic progress, attendance, or assignments.",
        "te": "ఎడువర్స్ పేరెంట్ AI కి స్వాగతం. మీ పిల్లల చదువు, హాజరు, లేదా అసైన్మెంట్ల గురించి ఏదైనా ప్రశ్న అడగండి.",
        "hi": "एडुवर्स पेरेंट एआई में आपका स्वागत है। अपने बच्चे की पढ़ाई, उपस्थिति या असाइनमेंट के बारे में कोई भी प्रश्न पूछें।"
    },
    "attendance_good": {
        "en": "Attendance is satisfactory at {rate}%. Regular classes are being attended.",
        "te": "హాజరు శాతం {rate}% వద్ద సంతృప్తికరంగా ఉంది. విద్యార్థి తరగతులకు క్రమంగా హాజరవుతున్నారు.",
        "hi": "उपस्थिति {rate}% पर संतोषजनक है। विद्यार्थी नियमित रूप से कक्षाओं में उपस्थित हो रहे हैं।"
    },
    "attendance_warning": {
        "en": "Attendance is currently {rate}%, which is below the mandatory 75% threshold. Please ensure regular attendance.",
        "te": "హాజరు ప్రస్తుతం {rate}% గా ఉంది, ఇది అవసరమైన 75% కంటే తక్కువ. దయచేసి క్రమంతప్పకుండా తరగతులకు హాజరయ్యేలా చూడండి.",
        "hi": "उपस्थिति वर्तमान में {rate}% है, जो अनिवार्य 75% से कम है। कृपया नियमित उपस्थिति सुनिश्चित करें।"
    },
    "pending_assignments": {
        "en": "There are {count} pending assignment(s) requiring submission.",
        "te": "{count} అసైన్మెంట్లు ఇంకా పూర్తి చేసి సమర్పించాల్సి ఉంది.",
        "hi": "{count} असाइनमेंट अभी जमा करने शेष हैं।"
    },
    "no_pending_assignments": {
        "en": "All assignments are currently submitted and up to date.",
        "te": "అన్ని అసైన్మెంట్లు సమర్పించబడ్డాయి. పెండింగ్‌లో ఏమీ లేవు.",
        "hi": "सभी असाइनमेंट समय पर जमा कर दिए गए हैं। कोई लंबित असाइनमेंट नहीं है।"
    },
    "photosynthesis_explanation": {
        "en": "Photosynthesis is the biological process by which green plants convert light energy (sunlight) into chemical energy (glucose) using water and carbon dioxide, releasing oxygen as a byproduct.",
        "te": "కిరణజన్య సంయోగక్రియ అనేది ఆకుపచ్చ మొక్కలు సూర్యకాంతి, నీరు మరియు కార్బన్ డయాక్సైడ్ సహాయంతో గ్లూకోజ్ (రసాయన శక్తి) తయారుచేసుకునే ప్రక్రియ. ఈ ప్రక్రియలో ప్రాణవాయువు (ఆక్సిజన్) విడుదలవుతుంది.",
        "hi": "प्रकाश संश्लेषण वह जैविक प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश, जल और कार्बन डाइऑक्साइड का उपयोग करके रासायनिक ऊर्जा (ग्लूकोज) बनाते हैं और ऑक्सीजन उत्सर्जित करते हैं।"
    }
}


def detect_language(text: str) -> str:
    """
    Detect whether the input string contains Telugu Unicode range (\u0C00-\u0C7F),
    Hindi/Devanagari Unicode range (\u0900-\u097F), or English (Latin).
    """
    if not text:
        return "en"
    
    telugu_count = len(re.findall(r'[\u0C00-\u0C7F]', text))
    hindi_count = len(re.findall(r'[\u0900-\u097F]', text))
    
    if telugu_count > 2 or telugu_count > hindi_count:
        return "te"
    elif hindi_count > 2:
        return "hi"
    return "en"


def get_localized_phrase(key: str, lang: str = "en", **kwargs) -> str:
    """
    Retrieve phrase in specified language with keyword formatting.
    """
    target_lang = lang if lang in SUPPORTED_LANGUAGES else "en"
    phrase_dict = ACADEMIC_TRANSLATIONS.get(key, {})
    template = phrase_dict.get(target_lang) or phrase_dict.get("en", "")
    try:
        return template.format(**kwargs)
    except Exception:
        return template


def build_multilingual_instruction(target_lang: str) -> str:
    """
    Returns prompt injection ensuring response is rendered in the required target language.
    """
    if target_lang == "te":
        return "\n\nCRITICAL LANGUAGE DIRECTIVE: Respond completely and naturally in fluent Telugu (తెలుగు లిపి). Maintain academic precision."
    elif target_lang == "hi":
        return "\n\nCRITICAL LANGUAGE DIRECTIVE: Respond completely and naturally in fluent Hindi (हिंदी - देवनागरी लिपि). Maintain academic precision."
    return "\n\nCRITICAL LANGUAGE DIRECTIVE: Respond in clear, professional English."
