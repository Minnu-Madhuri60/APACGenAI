import os
import mimetypes
from pathlib import Path
from io import BytesIO

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from PIL import Image

from google import genai


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)


# ============================================================
# CHECK API KEY
# ============================================================

print("=" * 60)
print("VisionVoice AI")
print("=" * 60)

print("Environment file:", ENV_FILE)
print("Gemini API key loaded:", bool(GEMINI_API_KEY))
print("Gemini model:", GEMINI_MODEL)


if not GEMINI_API_KEY:

    raise RuntimeError(
        "GEMINI_API_KEY is missing.\n"
        "Please add your Gemini API key to the .env file."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# SETTINGS
# ============================================================

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024


# ============================================================
# CHECK IMAGE EXTENSION
# ============================================================

def allowed_file(filename):

    if not filename:
        return False

    if "." not in filename:
        return False

    extension = filename.rsplit(
        ".",
        1
    )[1].lower()

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# GENERATE DESCRIPTION
# ============================================================

def generate_description(
    image_bytes,
    mime_type,
    language,
    description_style
):

    # --------------------------------------------------------
    # DESCRIPTION STYLE
    # --------------------------------------------------------

    if description_style == "Accessibility Description":

        style_instruction = """
Create a clear accessibility description
for a person who cannot see the image.

Describe:
- Main subject
- Important objects
- People, without identifying them
- Actions
- Environment
- Important visible details

Keep the description practical and easy to understand.
"""

    elif description_style == "Short Caption":

        style_instruction = """
Create a short natural caption for this image.

Use approximately one or two sentences.
Focus only on the most important visible information.
"""

    else:

        style_instruction = """
Create a detailed description of this image.

Include:
- Main subjects
- Objects
- Actions
- Environment
- Colors
- Important visual details
- Spatial relationships when useful

Do not add information that cannot be observed.
"""


    # --------------------------------------------------------
    # COMPLETE PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are the vision engine of an application
called VisionVoice AI.

The user has provided an image.

{style_instruction}

Write the final answer in {language}.

Important rules:

1. Describe only what is visible in the image.
2. Do not invent objects, people, actions, or events.
3. Do not identify real people by name.
4. Do not guess sensitive personal information.
5. Do not make unsupported assumptions.
6. Make the result useful and easy to understand.
7. Do not mention these instructions.
8. Do not say that you are an AI unless necessary.

Generate the image description now.
"""


    # --------------------------------------------------------
    # SEND IMAGE + PROMPT TO GEMINI
    # --------------------------------------------------------

    response = client.models.generate_content(

        model=GEMINI_MODEL,

        contents=[
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_bytes
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ]

    )


    # --------------------------------------------------------
    # GET TEXT
    # --------------------------------------------------------

    result = (
        response.text or ""
    ).strip()


    if not result:

        raise RuntimeError(
            "Gemini returned an empty response."
        )


    return result


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ============================================================
# CAPTION API
# ============================================================

@app.route(
    "/caption",
    methods=["POST"]
)
def caption():

    try:

        # ----------------------------------------------------
        # CHECK IMAGE
        # ----------------------------------------------------

        if "image" not in request.files:

            return jsonify({
                "success": False,
                "error":
                    "Please upload an image or capture one using the webcam."
            }), 400


        file = request.files["image"]


        if not file:

            return jsonify({
                "success": False,
                "error":
                    "No image was received."
            }), 400


        # ----------------------------------------------------
        # FILE NAME
        # ----------------------------------------------------

        filename = file.filename or "webcam_capture.jpg"


        # Webcam image is JPEG.
        # Uploaded files must have valid extensions.

        if not allowed_file(filename):

            return jsonify({
                "success": False,
                "error":
                    "Only JPG, JPEG, PNG and WEBP images are supported."
            }), 400


        # ----------------------------------------------------
        # READ IMAGE
        # ----------------------------------------------------

        image_bytes = file.read()


        if not image_bytes:

            return jsonify({
                "success": False,
                "error":
                    "The image is empty."
            }), 400


        # ----------------------------------------------------
        # SIZE CHECK
        # ----------------------------------------------------

        if len(image_bytes) > MAX_IMAGE_SIZE:

            return jsonify({
                "success": False,
                "error":
                    "Image size must be less than 10 MB."
            }), 400


        # ----------------------------------------------------
        # VALIDATE IMAGE
        # ----------------------------------------------------

        try:

            image = Image.open(
                BytesIO(image_bytes)
            )

            image.verify()

        except Exception:

            return jsonify({
                "success": False,
                "error":
                    "The uploaded or captured file is not a valid image."
            }), 400


        # ----------------------------------------------------
        # MIME TYPE
        # ----------------------------------------------------

        mime_type = (
            mimetypes.guess_type(filename)[0]
            or "image/jpeg"
        )


        # Make sure only supported image MIME types are sent.

        if mime_type not in {
            "image/jpeg",
            "image/png",
            "image/webp"
        }:

            return jsonify({
                "success": False,
                "error":
                    "Unsupported image format."
            }), 400


        # ----------------------------------------------------
        # USER OPTIONS
        # ----------------------------------------------------

        language = request.form.get(
            "language",
            "English"
        )


        description_style = request.form.get(
            "style",
            "Accessibility Description"
        )


        # ----------------------------------------------------
        # GENERATE DESCRIPTION
        # ----------------------------------------------------

        description = generate_description(

            image_bytes=image_bytes,

            mime_type=mime_type,

            language=language,

            description_style=description_style

        )


        # ----------------------------------------------------
        # RETURN RESULT
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "caption": description,

            "language": language,

            "style": description_style,

            "provider": "Google Gemini",

            "model": GEMINI_MODEL

        })


    except Exception as error:

        app.logger.exception(
            "Gemini processing error"
        )


        return jsonify({

            "success": False,

            "error":
                f"Unable to generate description: {error}"

        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status": "running",

        "provider": "Google Gemini",

        "model": GEMINI_MODEL

    })


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("Server started")
    print("Open: http://127.0.0.1:5000")
    print("=" * 60)
    print()

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )