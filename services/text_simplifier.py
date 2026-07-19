from .ai_engine import get_ai_response

# Basic jargon replacement dictionary
JARGON_DICT = {
    "aforementioned": "ye jo pehle bola gaya hai",
    "commence": "shuru karna",
    "terminate": "khatam karna",
    "implement": "lagu karna",
    "utilize": "use karna",
    "mitigate": "kam karna",
    "apprehend": "samajhna",
    "facilitate": "aasaan karna"
}

def simplify_text(text: str, level: str = "simple") -> str:
    """
    Ye function mushkil text ko aasaan language me badalta hai.
    'simple' mode me basic word replacement hota hai.
    'very_simple' mode me AI ko call karke text ko rephrase karwaya jata hai.
    """
    
    # 1. Rule-based simplification (basic keyword replacement)
    simplified_text = text.lower()
    for jargon, simple_word in JARGON_DICT.items():
        simplified_text = simplified_text.replace(jargon, simple_word)
        
    # Agar sirf simple chahiye toh rule-based wapas kar do
    if level == "simple":
        return simplified_text
        
    # 2. Agar level 'very_simple' hai, toh AI ko use karke poora text aur simple karao
    elif level == "very_simple":
        ai_prompt = (
            "Neeche diye gaye text ko bilkul bacchon jaisi aasaan language "
            "(very simple terms) me samjhao. Sirf zaruri baatein rakho aur chhote "
            "sentences ka use karo. Hinglish me likho:\n\n"
            f"Original text: {text}"
        )
        return get_ai_response(ai_prompt)
        
    return text
