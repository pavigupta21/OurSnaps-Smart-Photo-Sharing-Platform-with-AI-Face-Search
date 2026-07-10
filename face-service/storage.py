import os

import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(
    Path(__file__).resolve().parent.parent / "backend" / ".env"
)

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

register_vector(conn)

cursor = conn.cursor()

def save_embedding(album_id, photo_id, embedding):

    cursor.execute(
        """
        SELECT id
        FROM photos
        WHERE id = %s
        """,
        (photo_id,)
    )

    if cursor.fetchone() is None:

        print(
            f"Photo {photo_id} was deleted. Skipping embedding."
        )

        return

    cursor.execute(
        """
        INSERT INTO photo_faces
        (
            album_id,
            photo_id,
            embedding
        )
        VALUES
        (
            %s,
            %s,
            %s
        )
        """,
        (
            album_id,
            photo_id,
            embedding
        )
    )

    conn.commit()