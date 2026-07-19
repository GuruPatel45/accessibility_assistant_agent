from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn
from typing import Optional
import json
import os

# Services import karo
from services.ai_engine import get_ai_response
from services.scheme_finder import find_schemes, get_all_schemes_summary, format_schemes_for_ai
from services.text_simplifier import simplify_text
from services.accessibility_checker import check_accessibility

# FastAPI app init karo
app = FastAPI(title="SDG 10 - Reduced Inequalities - Accessibility Assistant Agent")

# Static files aur templates setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Pydantic Models for requests
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""
    accessibility_mode: Optional[str] = "standard"

class SchemeMatchRequest(BaseModel):
    disability_type: str
    state: str = "all"
    age: int = 25
    income_category: str = "general"

class SimplifyRequest(BaseModel):
    text: str
    level: str = "simple"  # simple or very_simple

class A11yCheckRequest(BaseModel):
    content: str
    content_type: str = "text"  # text or html

# Keyword detection data
SCHEME_KEYWORDS = ["scheme", "pension", "udid", "concession", "reservation", "adip", "disability certificate"]
SIMPLIFY_KEYWORDS = ["simple bana do", "samjhao easy me", "mushkil hai", "explain simply", "aasaan"]
ACCESSIBILITY_KEYWORDS = ["screen reader", "wcag", "contrast", "alt text", "accessible website"]

# ---- Routes ----

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    """
    Home page - accessible chat interface serve karta hai.
    """
    return templates.TemplateResponse(request=request, name="index.html", context={"request": request})

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint - keyword detect karke context inject karta hai aur AI se jawab leta hai.
    """
    user_msg_lower = request.message.lower()
    injected_context = request.context

    # Scheme keywords detect
    if any(kw in user_msg_lower for kw in SCHEME_KEYWORDS):
        all_schemes = get_all_schemes_summary()
        # Chota context taaki AI ko samajh aaye
        injected_context += f"\nYe kuch schemes hain: {json.dumps(all_schemes)}"
        
    # Simplify keywords detect
    if any(kw in user_msg_lower for kw in SIMPLIFY_KEYWORDS):
        injected_context += "\nUser text ko aur aasaan (simple) language me samajhna chahta hai. Bachhon jaisa samjhao."

    # Accessibility keywords
    if any(kw in user_msg_lower for kw in ACCESSIBILITY_KEYWORDS):
        injected_context += "\nUser digital accessibility (WCAG, screen readers, contrast) ke baare me puch raha hai. Technical terms ko simple rakho."

    # AI engine se response lo
    ai_response = get_ai_response(
        message=request.message, 
        context=injected_context, 
        accessibility_mode=request.accessibility_mode
    )
    
    return {"response": ai_response}

@app.post("/api/schemes/find")
async def find_schemes_endpoint(request: SchemeMatchRequest):
    """
    Disability type, state, etc. ke basis pe schemes dhundhta hai.
    """
    matched = find_schemes(
        disability_type=request.disability_type,
        state=request.state,
        age=request.age,
        income_category=request.income_category
    )
    return {"status": "success", "schemes": matched}

@app.get("/api/schemes/all")
async def get_all_schemes_endpoint():
    """
    Sabhi schemes ki list wapas karta hai.
    """
    return {"status": "success", "schemes": get_all_schemes_summary()}

@app.post("/api/text/simplify")
async def simplify_text_endpoint(request: SimplifyRequest):
    """
    Diye gaye text ko aasaan/simple banata hai.
    """
    result = simplify_text(text=request.text, level=request.level)
    return {"status": "success", "simplified_text": result}

@app.post("/api/accessibility/check")
async def accessibility_check_endpoint(request: A11yCheckRequest):
    """
    Text ya HTML content ka basic WCAG checklist ke hisaab se evaluation.
    """
    result = check_accessibility(content=request.content, content_type=request.content_type)
    return {"status": "success", "evaluation": result}

@app.get("/api/resources")
async def get_resources_endpoint():
    """
    Helplines, NGOs, aur assistive-tech resources ki list.
    """
    filepath = os.path.join(os.path.dirname(__file__), "data", "disability_resources.json")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            resources = json.load(f)
        return {"status": "success", "resources": resources}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
