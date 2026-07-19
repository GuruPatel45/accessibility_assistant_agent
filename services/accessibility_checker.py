import json
import os
import re

def load_checklist():
    """
    WCAG checklist items load karta hai JSON file se.
    """
    filepath = os.path.join(os.path.dirname(__file__), "..", "data", "wcag_checklist.json")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading checklist: {e}")
        return []

def check_accessibility(content: str, content_type: str = "text") -> dict:
    """
    HTML ya text content ka basic accessibility test karta hai aur score return karta hai.
    """
    checklist = load_checklist()
    issues = []
    suggestions = []
    score = 100
    
    if content_type == "html":
        # Basic heuristic check for images without alt tags
        img_tags = re.findall(r'<img[^>]+>', content, re.IGNORECASE)
        missing_alt = 0
        for img in img_tags:
            if 'alt="' not in img and "alt='" not in img:
                missing_alt += 1
        
        if missing_alt > 0:
            score -= 20
            issues.append(f"{missing_alt} image(s) me 'alt' text missing hai.")
            suggestions.append("Har <img ...> tag me ek descriptive alt attribute daalein (e.g. alt='photo of dog').")

        # Heading hierarchy check (basic)
        h1_tags = re.findall(r'<h1[^>]*>', content, re.IGNORECASE)
        if len(h1_tags) == 0:
            score -= 10
            issues.append("Page me koi <h1> heading nahi hai.")
            suggestions.append("Page ki shuruaat ek main <h1> tag se karein screen reader navigation ke liye.")
        elif len(h1_tags) > 1:
            score -= 5
            issues.append("Ek se zyada <h1> tags hain.")
            suggestions.append("Ek page me generally ek hi <h1> tag hona chahiye.")

    elif content_type == "text":
        # Check text length and sentence length
        sentences = re.split(r'[.!?]+', content)
        long_sentences = [s for s in sentences if len(s.split()) > 20]
        
        if len(long_sentences) > 0:
            score -= (len(long_sentences) * 5)
            issues.append(f"{len(long_sentences)} sentences 20 words se zyada lambe hain.")
            suggestions.append("Sentences ko chhota karein, bullet points use karein (Cognitive Accessibility).")
            
        # Basic jargon check
        jargon_found = []
        jargon_words = ["aforementioned", "terminate", "mitigate", "commence"]
        for word in jargon_words:
            if word in content.lower():
                jargon_found.append(word)
                
        if jargon_found:
            score -= 10
            issues.append(f"Kuch mushkil words mile: {', '.join(jargon_found)}")
            suggestions.append("In words ko simple terms me badlein ya text simplifier use karein.")

    # Ensure score doesn't go below 0
    score = max(0, score)

    return {
        "score": score,
        "issues": issues,
        "suggestions": suggestions
    }
