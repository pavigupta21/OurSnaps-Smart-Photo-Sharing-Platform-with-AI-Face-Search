import os

import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute("SELECT current_database();")
    print("Python DB:", cur.fetchone()[0])
    register_vector(conn)
    return conn



def save_embedding(album_id, photo_id, embedding):
    print("Reached save_embedding")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            print("About to insert", photo_id)

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
            print("Insert successful")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()