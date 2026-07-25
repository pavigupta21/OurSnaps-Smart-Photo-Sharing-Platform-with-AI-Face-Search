require("dotenv").config();
const { Worker } = require("bullmq");
const axios = require("axios");
const { connection } = require("./queue");
const pool = require("./database/db");

const worker = new Worker(
    "face-processing",

    async (job) => {

        const {
            image_path,
            album_id,
            photo_id
        } = job.data;

        console.log(`Processing photo ${photo_id}`);
        const photoExists = await pool.query(
            `
            SELECT id
            FROM photos
            WHERE id = $1
            `,
            [photo_id]
        );

        if (photoExists.rows.length === 0) {

            console.log(
                `Photo ${photo_id} was deleted before indexing. Skipping...`
            );

            return;
        }

        try {

            await axios.post(
                `${process.env.FACE_SERVICE_URL}/detect`,
                {
                    image_path,
                    album_id,
                    photo_id
                }
            );
            const stillExists = await pool.query(
                `
                SELECT id
                FROM photos
                WHERE id = $1
                `,
                [photo_id]
            );

            if (stillExists.rows.length === 0) {

                console.log(
                    `Photo ${photo_id} was deleted during indexing. Skipping update...`
                );

                return;
            }
            await pool.query(
                `
                UPDATE photos
                SET
                    face_indexed = TRUE,
                    processing_status = 'ready'
                WHERE id = $1;
                `,
                [
                    photo_id
                ]
            );
            await axios.post(
                `${process.env.BACKEND_URL}/internal/photo-indexed`,
                {
                    albumId: album_id,
                    photoId: photo_id
                }
            );
            const result = await pool.query(
                `
                SELECT COUNT(*) AS remaining
                FROM photos
                WHERE album_id = $1
                AND face_indexed = FALSE
                `,
                [
                    album_id
                ]
            );
            if(Number(result.rows[0].remaining) === 0)
            {
                await pool.query(
                `
                UPDATE albums
                SET face_index_status = 'ready'
                WHERE id = $1
                `,
                [
                    album_id
                ]);
                await axios.post(
                     `${process.env.BACKEND_URL}/internal/face-index-ready`,
                    {
                        albumId: album_id
                    }
                );

                console.log(
                    `Album ${album_id} indexing completed`
                );
            }

            // console.log(
            //     `Photo ${photo_id} indexed successfully`
            // );
            console.log(
    `Photo ${photo_id} indexing completed at ${new Date().toLocaleTimeString()}`
);

            console.log(
                `${result.rows[0].remaining} photos remaining`
            );

            } catch (err) {

                console.error(
                    `Failed photo ${photo_id}`,
                err.message
            );

            throw err;
        }

    },

    {
        connection,
        concurrency:3
    }
);