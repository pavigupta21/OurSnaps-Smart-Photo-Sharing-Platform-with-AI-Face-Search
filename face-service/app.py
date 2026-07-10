from sklearn.metrics.pairwise import cosine_similarity
import traceback
from flask import Flask
from flask_cors import CORS
from face_utils import (extract_faces_from_url,extract_faces_from_base64)
from flask import Flask, jsonify, request
from storage import save_embedding
import numpy as np


app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {
            "origins": "http://localhost:5173"
        }
    }
)

@app.route("/")
def home():

    return {
        "message": "Face Recognition Service Running"
    }


@app.route("/detect", methods=["POST"])
def detect():

    data = request.get_json()

    image_path = data["image_path"]
    album_id = data["album_id"]
    photo_id = data["photo_id"]

    faces = extract_faces_from_url(image_path)

    for face in faces:

        save_embedding(
            album_id,
            photo_id,
            face.embedding
        )

    if len(faces) == 0:

        return jsonify({
            "faces_detected": 0
        })

    return jsonify({
        "faces_detected": len(faces),
        "bbox": faces[0].bbox.tolist(),
        "score": float(faces[0].det_score),
        "embedding_sample": faces[0].embedding[:10].tolist()
    })

@app.route("/register-face", methods=["POST"])
def register_face():

    data = request.get_json()

    image_base64 = data["image"]

    faces = extract_faces_from_base64(image_base64)
    
    if len(faces) == 0:

        return jsonify({
            "success": False,
            "message": "No face detected."
        }), 400

    if len(faces) > 1:

        return jsonify({
            "success": False,
            "message": "Multiple faces detected. Please capture only yourself."
        }), 400

    face = faces[0]
    embedding = face.embedding.tolist()
    
    return jsonify({
        "success": True,
        "embedding": embedding
    })


@app.route("/search-face", methods=["POST"])
def search_face():

    data = request.get_json()

    user_embedding = np.array(
        data["userEmbedding"]
    ).reshape(1, -1)

    matched_photo_ids = []

    for photo in data["photoEmbeddings"]:

        photo_embedding = np.array(
            photo["embedding"]
        ).reshape(1, -1)

        similarity = cosine_similarity(
            user_embedding,
            photo_embedding
        )[0][0]

        if similarity >= 0.55:

            matched_photo_ids.append(
                photo["photo_id"]
            )

    return jsonify({

        "matchedPhotoIds": matched_photo_ids

    })

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )