import base64
import requests
import numpy as np
# pyrefly: ignore [missing-import]
import cv2
from insightface.app import FaceAnalysis




face_app = FaceAnalysis(
    name="buffalo_l"
)

face_app.prepare(
    ctx_id=0,
    det_size=(640, 640)
)


# ----------------------------
# Image Loaders
# ----------------------------
def image_from_url(image_url):

    try:

        response = requests.get(image_url, timeout=10)

        if response.status_code != 200:

            print(f"Image no longer exists: {image_url}")

            return None

        image_array = np.asarray(
            bytearray(response.content),
            dtype=np.uint8
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if image is None:

            print("Unable to decode image.")

            return None

        return image

    except Exception as e:

        print(f"Failed to download image: {e}")

        return None


def image_from_base64(image_base64):

    image_data = image_base64.split(",")[1]

    image_bytes = base64.b64decode(image_data)

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise Exception(
            "Unable to decode image."
        )

    return image


# ----------------------------
# Face Extraction
# ----------------------------

def extract_faces_from_url(image_url):

    image = image_from_url(image_url)

    if image is None:
        return []

    return extract_faces_from_image(image)


def extract_faces_from_base64(image_base64):

    image = image_from_base64(image_base64)

    return extract_faces_from_image(image)

def extract_faces_from_image(image):

    if image is None:
        raise Exception("Invalid image.")

    faces = face_app.get(image)

    return faces