const express = require("express");
const router = express.Router();
const axios = require("axios");
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");


router.get(
    "/:albumId/new-face-photos",
    authMiddleware,
    async (req, res) => {

        try {

            const { albumId } = req.params;
            const userId = req.user.userId;

            const searchStatusResult = await pool.query(
                `
                SELECT last_search_at
                FROM face_search_status
                WHERE
                    user_id = $1
                    AND album_id = $2
                `,
                [
                    userId,
                    albumId
                ]
            );
            let lastSearchAt = null;

            if (searchStatusResult.rows.length > 0) {
                lastSearchAt = searchStatusResult.rows[0].last_search_at;
            }
            const faceResult = await pool.query(
                `
                SELECT updated_at
                FROM user_face_profiles
                WHERE user_id = $1
                `,
                [userId]
            );
            const faceRegistered = faceResult.rows.length > 0;
            let newPhotoCount = 0;

            if (lastSearchAt === null) {

                const result = await pool.query(
                    `
                    SELECT COUNT(*) AS count
                    FROM photos
                    WHERE album_id = $1
                    `,
                    [albumId]
                );

                newPhotoCount = Number(result.rows[0].count);

            }
            else {

                const result = await pool.query(
                    `
                    SELECT COUNT(*) AS count
                    FROM photos
                    WHERE
                        album_id = $1
                        AND uploaded_at > $2
                    `,
                    [
                        albumId,
                        lastSearchAt
                    ]
                );

                newPhotoCount = Number(result.rows[0].count);

            }   
            const totalPhotosResult = await pool.query(
                    `
                    SELECT COUNT(*) AS count
                    FROM photos
                    WHERE album_id = $1
                    `,
                    [albumId]
                );

            const totalPhotoCount = Number(totalPhotosResult.rows[0].count);

            let searchReason = null;
            
            if(lastSearchAt===null){

                if(faceRegistered){

                    searchReason="firstSearch";

                }else{

                    searchReason=null;

                }

            }
            else {

                const faceUpdatedAt =
                    faceResult.rows.length > 0
                        ? faceResult.rows[0].updated_at
                        : null;

                const faceUpdated =
                    faceUpdatedAt &&
                    faceUpdatedAt > lastSearchAt;

                if (newPhotoCount > 0 && faceUpdated) {
                    searchReason = "both";
                }
                else if (newPhotoCount > 0) {
                    searchReason = "newPhotos";
                }
                else if (faceUpdated) {
                    searchReason = "newFace";
                }

            }
            console.log(lastSearchAt);
            console.log(newPhotoCount);
            return res.json({
                success: true,
                newPhotoCount,
                searchReason,
                faceRegistered,
                totalPhotoCount
            });

        }
        catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch new photos."
            });

        }

    }
);
router.get(
    "/my-face",
    authMiddleware,
    async (req, res) => {

        try {

            const userId = req.user.userId;

            const result = await pool.query(
                `
                SELECT preview_photo_url
                FROM user_face_profiles
                WHERE user_id = $1
                `,
                [userId]
            );

            if(result.rows.length === 0)
            {
                return res.json({
                    registered: false
                });
            }

            return res.json({
                registered: true,
                previewPhoto: result.rows[0].preview_photo_url
            });

        }
        catch(err)
        {
            console.error(err);

            return res.status(500).json({
                success:false,
                message:"Failed to fetch face profile."
            });
        }

    }
);
router.post(
    "/register-face",
    authMiddleware,
    async (req, res) => {

        try {

            const response = await axios.post(
                "http://127.0.0.1:5001/register-face",
                {
                    image: req.body.image
                }
            );

            const embedding = response.data.embedding;
            const cloudinary = require("../services/cloudinary");

            const uploadResult =
                await cloudinary.uploader.upload(
                    req.body.image,
                    {
                        folder: "oursnaps/faces"
                    }
                );
            console.log(embedding);
            console.log(typeof embedding);
            console.log(Array.isArray(embedding));
            console.log(embedding[0]);
            console.log(typeof embedding[0]);
            const embeddingVector = `[${embedding.join(",")}]`;
            console.log(embeddingVector.substring(0, 80));
            await pool.query(
                `
                INSERT INTO user_face_profiles
                (
                    user_id,
                    embedding,
                    preview_photo_url
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (user_id)
                DO UPDATE
                SET
                    embedding = EXCLUDED.embedding,
                    preview_photo_url = EXCLUDED.preview_photo_url,
                    updated_at = CURRENT_TIMESTAMP
                `,
                [
                    req.user.userId,
                    embeddingVector,
                    uploadResult.secure_url
                ]
            );

            return res.json({
                success: true,
                message: "Face registered successfully."
            });

        }
        catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to register face."
            });

        }

    }
);
router.post(
    "/:albumId/search-photos",
    authMiddleware,
    async (req, res) => {
        try
        {
            const { albumId } = req.params;
            const userId = req.user.userId;
            const faceEmbeddingResult = await pool.query(
                `
                SELECT embedding
                FROM user_face_profiles
                WHERE user_id = $1
                `,
                [userId]
            );
            if (faceEmbeddingResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Please register your face first."
                });
            }
            
            const userEmbedding = faceEmbeddingResult.rows[0].embedding;
            console.log(userEmbedding);
            console.log(typeof userEmbedding);
            
            const faceStatusResult = await pool.query(
                `
                SELECT
                    updated_at
                FROM user_face_profiles
                WHERE user_id = $1
                `,
                [userId]
            );

            const searchStatusResult = await pool.query(
                `
                SELECT
                    last_search_at
                FROM face_search_status
                WHERE
                    user_id = $1
                    AND album_id = $2
                `,
                [
                    userId,
                    albumId
                ]
            );

            let searchMode = "incremental";

            if (
                searchStatusResult.rows.length === 0
            ) {
                searchMode = "full";
            }
            else {

                const lastSearch =
                    searchStatusResult.rows[0].last_search_at;

                const faceUpdated =
                    faceStatusResult.rows[0].updated_at;

                if (
                    faceUpdated > lastSearch
                ) {
                    searchMode = "full";
                }

            }

            console.log("Search Mode:", searchMode);

            let photosToSearchResult;
            let matchedPhotosResult;
            const threshold = 0.45;

            if (searchMode === "full") {

                photosToSearchResult = await pool.query(
                    `
                    SELECT
                        photo_id
                    FROM photo_faces
                    WHERE album_id = $1
                    `,
                    [
                        albumId
                    ]
                );
                matchedPhotosResult = await pool.query(
                    `
                    SELECT
                        photo_id
                    FROM photo_faces
                    WHERE
                        album_id = $2
                        AND embedding <=> $1 < $3
                    ORDER BY embedding <=> $1
                    `,
                    [
                        userEmbedding,
                        albumId,
                        threshold
                    ]
                );

            }
            else {

                photosToSearchResult = await pool.query(
                `
                SELECT
                    photo_id
                FROM photo_faces
                WHERE
                    album_id = $1
                    AND photo_id NOT IN
                    (
                        SELECT photo_id
                        FROM face_search_history
                        WHERE
                            album_id = $1
                            AND user_id = $2
                    )
                `,
                [
                    albumId,
                    userId
                ]
                );
                matchedPhotosResult = await pool.query(
                `
                SELECT
                    photo_id
                FROM photo_faces
                WHERE
                    album_id = $2
                    AND photo_id NOT IN
                    (
                        SELECT photo_id
                        FROM face_search_history
                        WHERE
                            album_id = $2
                            AND user_id = $4
                    )
                    AND embedding <=> $1 < $3
                ORDER BY embedding <=> $1
                `,
                [
                    userEmbedding,
                    albumId,
                    threshold,
                    userId
                ]
                );

            }

            const matchedPhotoIds = matchedPhotosResult.rows.map(
                row => row.photo_id
            );
        
            for (const photoId of matchedPhotoIds) {

                await pool.query(
                    `
                    INSERT INTO face_search_history
                    (
                        album_id,
                        user_id,
                        photo_id,
                        matched
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        true
                    )
                    ON CONFLICT
                    (
                        user_id,
                        album_id,
                        photo_id
                    )
                    DO NOTHING
                    `,
                    [
                        albumId,
                        userId,
                        photoId
                    ]
                );

            }
            const searchedPhotos = photosToSearchResult.rows.map(photo => ({
                photo_id: photo.photo_id,
                matched: matchedPhotoIds.includes(photo.photo_id)
            }));
            for (const photo of searchedPhotos) {
                await pool.query(
                    `
                    INSERT INTO face_search_history
                    (
                        album_id,
                        user_id,
                        photo_id,
                        matched,
                        searched_at
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        CURRENT_TIMESTAMP
                    )
                    ON CONFLICT (user_id, album_id, photo_id)
                    DO UPDATE
                    SET
                        matched = EXCLUDED.matched,
                        searched_at = CURRENT_TIMESTAMP
                    `,
                    [
                        albumId,
                        userId,
                        photo.photo_id,
                        photo.matched
                    ]
                );
            }
            await pool.query(
                `
                INSERT INTO face_search_status
                (
                    user_id,
                    album_id,
                    last_search_at
                )
                VALUES
                (
                    $1,
                    $2,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (user_id, album_id)
                DO UPDATE
                SET last_search_at = CURRENT_TIMESTAMP
                `,
                [
                    userId,
                    albumId
                ]
            );
            if (matchedPhotoIds.length === 0) {
                return res.json({
                    success: true,
                    photos: []
                });
            }
            const photosResult = await pool.query(
                `
                SELECT *
                FROM photos
                WHERE id = ANY($1)
                `,
                [matchedPhotoIds]
            );
            
            return res.json({
                success: true,
                message: "Search completed."
            });

        }
        catch(err)
        {
            console.error(err);
            return res.status(500).json({
                success:false,
                message:"Failed to search face."
            });
        }


    }
);
router.get(
    "/:albumId/my-photos",
    authMiddleware,
    async (req, res) => {

        try {

            const { albumId } = req.params;
            const userId = req.user.userId;

            const photosResult = await pool.query(
                `
                SELECT
                    p.*
                FROM face_search_history fsh
                JOIN photos p
                ON fsh.photo_id = p.id
                WHERE
                    fsh.user_id = $1
                    AND fsh.album_id = $2
                    AND fsh.matched = true
                ORDER BY p.uploaded_at DESC
                `,
                [
                    userId,
                    albumId
                ]
            );

            return res.json({
                success: true,
                photos: photosResult.rows
            });

        }
        catch(err)
        {
            console.error(err);

            return res.status(500).json({
                success:false,
                message:"Failed to fetch matched photos."
            });
        }

    }
);

module.exports = router;
