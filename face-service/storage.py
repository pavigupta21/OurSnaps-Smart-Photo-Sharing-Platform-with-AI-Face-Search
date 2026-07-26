import os

import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    os.getenv("DATABASE_URL")
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