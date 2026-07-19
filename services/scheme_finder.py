import json
import os

def load_schemes():
    """
    Ye function data/schemes.json se schemes read karta hai.
    """
    filepath = os.path.join(os.path.dirname(__file__), "..", "data", "schemes.json")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading schemes: {e}")
        return []

def find_schemes(disability_type: str, state: str = "all", age: int = 25, income_category: str = "general"):
    """
    Disability type, state, age, aur income ke hisaab se suitable schemes find karta hai.
    """
    schemes = load_schemes()
    matched_schemes = []
    
    dt_lower = disability_type.lower()
    
    for scheme in schemes:
        # Agar scheme sabke liye hai ('all') ya specific disability match karti hai
        if "all" in scheme.get("disability_types", []) or dt_lower in [dt.lower() for dt in scheme.get("disability_types", [])]:
            # Basic state logic check
            s_lower = scheme.get("states", "all").lower()
            if s_lower == "all" or s_lower == state.lower():
                matched_schemes.append(scheme)
                
    return matched_schemes

def get_all_schemes_summary():
    """
    Sabhi schemes ki list wapas karta hai as a short summary.
    """
    schemes = load_schemes()
    return [{"name": s["name"], "benefit": s["benefit"]} for s in schemes]

def format_schemes_for_ai(schemes):
    """
    AI model ko context dene ke liye scheme data ko ek clean string me format karta hai.
    """
    if not schemes:
        return "Koi specific schemes nahi mili."
        
    formatted_text = "Here are the relevant schemes:\n"
    for idx, s in enumerate(schemes, 1):
        formatted_text += f"{idx}. Name: {s['name']}\n   Benefit: {s['benefit']}\n   Eligibility: {s['eligibility']}\n   How to apply: {s['how_to_apply']}\n\n"
    return formatted_text
