import os
import groq
from dotenv import load_dotenv

# Env variables load karo (.env se)
load_dotenv()

def get_ai_response(message: str, context: str = "", accessibility_mode: str = "standard") -> str:
    """
    Ye function Groq API ko call karke user ka jawab laata hai.
    Accessibility mode aur context ka dhyaan rakhte hue simple aur accessible text generate karega.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "System error: API Key missing hai. Kripya .env me GROQ_API_KEY daalein."
        
    try:
        client = groq.Groq(api_key=api_key)
        
        # System prompt set karna jo accessibility ka dhyan rakhe
        system_prompt = f"""
        Tum ek Accessibility Assistant Agent ho. Tumhara kaam PwD (Persons with Disabilities), elderly, aur low-literacy logon ko government schemes aur accessibility features samjhana hai.
        
        Guidelines:
        1. Hamesha simple, clear, aur jargon-free Hindi/English (Hinglish) me baat karo.
        2. Lamba paragraph mat likho. Short sentences aur bullet points ka use karo taaki screen readers easily padh sakein.
        3. Empathetic aur respectful tone rakho.
        4. Diye gaye context par hi depend karo. Fake schemes ya galat information mat banao.
        5. User ka focus '{accessibility_mode}' accessibility par hai, agar zaroorat ho toh iske mutabiq jawab ko adjust karo.
        
        Context provided:
        {context}
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content

    except Exception as e:
        # Fallback error message (graceful fallback for screen readers)
        print(f"Error in AI call: {e}")
        return "Maaf kijiye, abhi server connect nahi ho pa raha hai. Kripya thodi der baad dobara koshish karein."
