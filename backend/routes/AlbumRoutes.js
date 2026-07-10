const { faceQueue } = require("../queue");
const axios = require("axios");
const {getIO,connectedUsers} = require("../socket");
const {emitToAlbum} = require("../socketEvents");
const { albumUpdated,albumDeleted,uploadMembersUpdated,photosUploaded,photosDeleted,memberJoined,memberLeft,memberRoleUpdated,memberRemoved } = require("../socketEvents");
const express = require("express");
const router = express.Router();

const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

const multer = require("multer");
const cloudinary = require("../services/cloudinary");

const streamifier = require("streamifier");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const canUserUpload = async (albumId,userId) => {

    const memberResult = await pool.query(
        `
        SELECT role
        FROM album_members
        WHERE
            album_id = $1
            AND user_id = $2
        `,
        [albumId,userId]
    );

    if(memberResult.rows.length === 0)
    {
        return false;
    }

    const role = memberResult.rows[0].role;

    const albumResult = await pool.query(
        `
        SELECT upload_permission
        FROM albums
        WHERE id = $1
        `,
        [albumId]
    );

    if(albumResult.rows.length === 0)
    {
        return false;
    }

    const uploadPermission =
    albumResult.rows[0].upload_permission;

    if(uploadPermission === "owner_only")
    {
        return role === "owner";
    }

    if(uploadPermission === "owner_and_admins_only")
    {
        return (
            role === "owner"
            ||
            role === "admin"
        );
    }

    if(uploadPermission === "all_members")
    {
        return true;
    }

    if(uploadPermission === "selected_members")
    {
        if(role === "owner")
        {
            return true;
        }

        const permissionResult =
        await pool.query(
            `
            SELECT *
            FROM album_upload_permissions
            WHERE
                album_id = $1
                AND user_id = $2
            `,
            [albumId,userId]
        );

        return permissionResult.rows.length > 0;
    }

    return false;
};

router.get(
  "/:albumId/upload-permission",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;

      const canUpload =
      await canUserUpload(
        albumId,
        req.user.userId
      );

      return res.json({
        success:true,
        canUpload
      });

    }
    catch(error)
    {
      console.error(error);

      return res.status(500).json({
        success:false
      });
    }

  }
);
router.get(
  "/:albumId/upload-members",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;

      const ownerCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role = 'owner'
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(ownerCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Only owner can manage upload permissions"
        });
      }

      const result =
      await pool.query(
        `
        SELECT
    am.user_id,
    u.full_name,
    u.profile_pic,
    am.role,

    CASE
        WHEN aup.user_id IS NOT NULL
        THEN true
        ELSE false
    END AS can_upload

FROM album_members am

JOIN users u
ON am.user_id = u.id

LEFT JOIN album_upload_permissions aup
ON
    aup.album_id = am.album_id
    AND aup.user_id = am.user_id

WHERE am.album_id = $1
AND am.role <> 'owner'

ORDER BY u.full_name;
        `,
        [albumId]
      );

      return res.json({
        success:true,
        members:result.rows
      });

    }
    catch(error)
    {
      console.error(error);

      return res.status(500).json({
        success:false
      });
    }

  }
);
router.post(
  "/:albumId/upload-members",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;
      const { memberIds } = req.body;

      const ownerCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role = 'owner'
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(ownerCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Only owner can modify upload members"
        });
      }

      await pool.query(
        `
        DELETE FROM album_upload_permissions
        WHERE album_id = $1
        `,
        [albumId]
      );

      for(const memberId of memberIds)
      {
        await pool.query(
          `
          INSERT INTO album_upload_permissions
          (
            album_id,
            user_id
          )
          VALUES
          (
            $1,
            $2
          )
          `,
          [
            albumId,
            memberId
          ]
        );
      }
      uploadMembersUpdated(albumId);

      res.json({
        success:true,
        message:"Upload members updated successfully"
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);
router.get(
    "/cloudinary-test",
    async(req,res) => {

        try {

            const result =
            await cloudinary.api.ping();

            res.json(result);

        }
        catch(error)
        {
            console.error(error);

            res.status(500).json(error);
        }

    }
);
router.post(
  "/:albumId/photos",
  authMiddleware,
  upload.array("photos", 100),
  async (req, res) => {

    try {

      const { albumId } = req.params;
      const userId = req.user.userId;

      const userResult = await pool.query(
              `
              SELECT full_name
              FROM users
              WHERE id = $1
              `,
              [userId]
          );

      const fullName = userResult.rows[0].full_name;

      const allowed =
      await canUserUpload(
          albumId,
          userId
      );

      if(!allowed)
      {
          return res.status(403).json({
              success:false,
              message:"You do not have permission to upload photos"
          });
      }
      if(
    !req.files
    ||
    req.files.length === 0
    )
    {
        return res.status(400).json({
            success:false,
            message:"No photos uploaded"
        });
    }
    
    const totalPhotos = req.files.length;
    let uploadedCount = 0;


    const uploadedPhotos = [];
    await pool.query(
    `
    UPDATE albums
    SET face_index_status = 'processing'
    WHERE id = $1
    `,
    [albumId]
);
    for(const file of req.files)
{
    const uploadResult =
    await new Promise((resolve,reject)=>{

        const stream =
        cloudinary.uploader.upload_stream(
            {
                folder:`albums/${albumId}`
            },
            (error,result)=>{

                if(error)
                {
                    reject(error);
                }
                else
                {
                    resolve(result);
                }

            }
        );

        streamifier
        .createReadStream(file.buffer)
        .pipe(stream);

    });

    const photoResult =
    await pool.query(
        `
        INSERT INTO photos
        (
            album_id,
            uploaded_by,
            cloudinary_public_id,
            photo_url,
            file_size_bytes
        )
        VALUES
        ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            albumId,
            userId,
            uploadResult.public_id,
            uploadResult.secure_url,
            file.size
        ]
    );

    uploadedPhotos.push(
        photoResult.rows[0]
    );
    await faceQueue.add(
    "process-face",
    {
        image_path: uploadResult.secure_url,
        album_id: albumId,
        photo_id: photoResult.rows[0].id
    }
);

console.log(
    `Queued photo ${photoResult.rows[0].id}`
);
    uploadedCount++;
    const socketId = connectedUsers.get(userId);

if (socketId) {

    getIO()
        .to(socketId)
        .emit(
            "uploadProgress",
            {
                uploaded: uploadedCount,
                total: totalPhotos
            }
        );

}
}
photosUploaded(
    albumId,
    userId,
    fullName,
    uploadedPhotos.length
);


        return res.json({
      success:true,
      photos:uploadedPhotos
  });
    }
    catch(error)
    {
      console.error(error);

      return res.status(500).json({
        success:false,
        message:"Upload failed"
      });
    }

  }
);
router.get(
  "/:albumId/photos",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;

      const result = await pool.query(
        `
        SELECT
          p.*,
          u.full_name,
          u.profile_pic
        FROM photos p
        JOIN users u
        ON p.uploaded_by = u.id
        WHERE p.album_id = $1
        ORDER BY p.uploaded_at DESC
        `,
        [albumId]
      );

      return res.json({
        success:true,
        photos:result.rows
      });

    }
    catch(error)
    {
      console.error(error);

      return res.status(500).json({
        success:false
      });
    }

  }
);
router.post(
  "/create",
  authMiddleware,
  async (req, res) => {

    const {
      albumName,
      albumCover,
      accessType,
      uploadPermission,
      location
    } = req.body;

    if (!albumName) {
      return res.status(400).json({
        success: false,
        message: "Album name is required"
      });
    }

    try {

      const albumResult = await pool.query(
        `
        INSERT INTO albums
        (
          album_name,
          album_cover,
          owner_id,
          access_type,
          upload_permission,
          location
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
          albumName,
          albumCover,
          req.user.userId,
          accessType || "private",
          uploadPermission || "owner_only",
          location || null
        ]
      );

      const album = albumResult.rows[0];

      await pool.query(
        `
        INSERT INTO album_members
        (
          album_id,
          user_id,
          role,
          can_upload
        )
        VALUES ($1,$2,$3,$4)
        `,
        [
          album.id,
          req.user.userId,
          "owner",
          true
        ]
      );

      res.json({
        success: true,
        album
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to create album"
      });

    }
  }
);
router.get(
  "/my-albums",
  authMiddleware,
  async (req, res) => {

    try {

      const result = await pool.query(
      `
      SELECT
          a.*,
          am.role,

          (
            SELECT COUNT(*)::int
            FROM album_members am2
            WHERE am2.album_id = a.id
          ) AS member_count,

          (
            SELECT COUNT(*)::int
            FROM photos p
            WHERE p.album_id = a.id
          ) AS photo_count

      FROM albums a

      INNER JOIN album_members am
        ON a.id = am.album_id

      WHERE am.user_id = $1

      ORDER BY a.created_at DESC
      `,
      [req.user.userId]
      );
      res.json({
        success: true,
        albums: result.rows
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch albums"
      });

    }

  }
);



router.get(
  "/:albumId/members",
  authMiddleware,
  async (req,res) => {

    try {

      const albumId = req.params.albumId;

      const accessCheck = await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(accessCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Access denied"
        });
      }

      const result = await pool.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.profile_pic,
          am.role,
          am.can_upload,
          am.joined_at

        FROM album_members am

        INNER JOIN users u
          ON am.user_id = u.id

        WHERE am.album_id = $1

        ORDER BY
          CASE
            WHEN am.role='owner' THEN 1
            WHEN am.role='admin' THEN 2
            ELSE 3
          END,
          u.full_name
        `,
        [albumId]
      );

      res.json({
        success:true,
        members:result.rows
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }
  }
);
router.post(
  "/:albumId/invite",
  authMiddleware,
  async (req,res) => {

    try {

      const albumId = req.params.albumId;
      const { validity } = req.body;

      const permissionCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role IN ('owner','admin')
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(permissionCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Not authorized"
        });
      }

      const inviteCode =
      Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase();

      let expiryInterval;

      switch(validity)
      {
        case "1h":
          expiryInterval = "1 hour";
          break;

        case "24h":
          expiryInterval = "24 hours";
          break;

        case "7d":
          expiryInterval = "7 days";
          break;

        case "30d":
          expiryInterval = "30 days";
          break;

        default:
          expiryInterval = "24 hours";
      }

      const result =
      await pool.query(
        `
        INSERT INTO album_invites
        (
          album_id,
          invite_code,
          created_by,
          expires_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          NOW() + CAST($4 AS INTERVAL)
        )
        RETURNING *
        `,
        [
          albumId,
          inviteCode,
          req.user.userId,
          expiryInterval
        ]
      );

      res.json({
        success:true,
        inviteCode
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }
  }
);

router.get(
  "/:albumId/invite",
  authMiddleware,
  async (req,res) => {

    try {

      const albumId = req.params.albumId;

      const memberCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(memberCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false
        });
      }

      const inviteResult =
      await pool.query(
        `
        SELECT *
        FROM album_invites
        WHERE
          album_id = $1
          AND expires_at > NOW()

        ORDER BY created_at DESC
        LIMIT 1
        `,
        [albumId]
      );

      if(inviteResult.rows.length === 0)
      {
        return res.json({
          success:true,
          hasActiveInvite:false
        });
      }

      res.json({
        success:true,
        hasActiveInvite:true,
        invite:inviteResult.rows[0]
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }
  }
);

router.post(
  "/join",
  authMiddleware,
  async (req,res) => {

    try {

      const { inviteCode } = req.body;

      const inviteResult =
      await pool.query(
        `
        SELECT *
        FROM album_invites
        WHERE
          invite_code = $1
          AND expires_at > NOW()
        `,
        [inviteCode]
      );

      if(inviteResult.rows.length === 0)
      {
        return res.status(400).json({
          success:false,
          message:"Invalid or expired invite code"
        });
      }

      const invite =
      inviteResult.rows[0];

      const existingMember =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          invite.album_id,
          req.user.userId
        ]
      );

      if(existingMember.rows.length > 0)
      {
        return res.status(400).json({
          success:false,
          message:"You are already a member"
        });
      }

      await pool.query(
        `
        INSERT INTO album_members
        (
          album_id,
          user_id,
          role,
          can_upload
        )
        VALUES
        (
          $1,
          $2,
          'viewer',
          false
        )
        `,
        [
          invite.album_id,
          req.user.userId
        ]
      );
const userId = req.user.userId;
const userResult = await pool.query(
`
SELECT full_name
FROM users
WHERE id = $1
`,
[userId]
);

const fullName = userResult.rows[0].full_name;
      memberJoined(
        invite.album_id,
        req.user.userId,
        fullName
      );

      res.json({
        success:true,
        albumId: invite.album_id
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);

router.patch(
  "/:albumId/members/:userId/role",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId, userId } = req.params;
      const { role } = req.body;

      if(role !== "admin" && role !== "viewer")
      {
        return res.status(400).json({
          success:false,
          message:"Invalid role"
        });
      }

      const ownerCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role = 'owner'
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(ownerCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Only owner can change roles"
        });
      }

      const targetMember =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          userId
        ]
      );

      if(targetMember.rows.length === 0)
      {
        return res.status(404).json({
          success:false,
          message:"Member not found"
        });
      }

      if(targetMember.rows[0].role === "owner")
      {
        return res.status(400).json({
          success:false,
          message:"Owner role cannot be changed"
        });
      }

      await pool.query(
        `
        UPDATE album_members
        SET role = $1
        WHERE
          album_id = $2
          AND user_id = $3
        `,
        [
          role,
          albumId,
          userId
        ]
      );
      const userResult =
      await pool.query(
        `
        SELECT full_name
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      const fullName = userResult.rows[0].full_name;
      memberRoleUpdated(
        albumId,
        userId,
        fullName,
        role
      );
     
      res.json({
        success:true,
        message:"Role updated"
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);

router.delete(
  "/:albumId/members/:userId",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId, userId } = req.params;

      const currentUser =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(currentUser.rows.length === 0)
      {
        return res.status(403).json({
          success:false
        });
      }

      const currentRole = currentUser.rows[0].role;

      const targetUser =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          userId
        ]
      );

      if(targetUser.rows.length === 0)
      {
        return res.status(404).json({
          success:false,
          message:"Member not found"
        });
      }

      const targetRole = targetUser.rows[0].role;

      if(targetRole === "owner")
      {
        return res.status(400).json({
          success:false,
          message:"Owner cannot be removed"
        });
      }

      if(
        currentRole === "admin" &&
        targetRole !== "viewer"
      )
      {
        return res.status(403).json({
          success:false,
          message:"Admins can remove only viewers"
        });
      }

      if(
        currentRole !== "owner" &&
        currentRole !== "admin"
      )
      {
        return res.status(403).json({
          success:false
        });
      }
      await pool.query(
      `
      DELETE FROM album_upload_permissions
      WHERE
        album_id = $1
        AND user_id = $2
      `,
      [
        albumId,
        userId
      ]
      );
      await pool.query(
        `
        DELETE FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
        `,
        [
          albumId,
          userId
        ]
      );
      const userResult = await pool.query(
        `
        SELECT full_name
        FROM users
        WHERE id = $1
        `,
        [userId]
);

      const fullName = userResult.rows[0].full_name;

      memberRemoved(
        albumId,
        userId,
        fullName
      );

      res.json({
        success:true,
        message:"Member removed"
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);
router.delete(
  "/:albumId/leave",
  authMiddleware,
  async (req,res) => {

    try {

        const { albumId } = req.params;
        const userId = req.user.userId;
        const userResult = await pool.query(
`
          SELECT full_name
          FROM users
          WHERE id = $1
          `,
          [userId]
          );

        const fullName = userResult.rows[0].full_name;
        const membership = await pool.query(
            `
            SELECT role
            FROM album_members
            WHERE album_id=$1
            AND user_id=$2
            `,
            [albumId,userId]
        );

        if(membership.rows.length===0)
        {
            return res.status(404).json({
                message:"You are not a member of this album"
            });
        }

        if(membership.rows[0].role==="owner")
        {
            return res.status(403).json({
                message:"Owner cannot leave album"
            });
        }
        await pool.query(
        `
        DELETE FROM album_upload_permissions
        WHERE
            album_id = $1
            AND user_id = $2
        `,
        [
            albumId,
            userId
        ]
        );

        await pool.query(
            `
            DELETE FROM album_members
            WHERE album_id=$1
            AND user_id=$2
            `,
            [albumId,userId]
        );
        memberLeft(
            albumId,
            userId,
            fullName
        );
        return res.json({
            success:true,
            message:"Left album successfully"
        });

    }
    catch(error)
    {
        console.error(error);

        return res.status(500).json({
            message:"Server error"
        });
    }

});


router.get(
    "/:albumId",
    authMiddleware,
    async (req,res) => {

        try {

            const result = await pool.query(
                `
                SELECT
                    a.*,
                    am.role,

                    (
                        SELECT COUNT(*)::int
                        FROM album_members am2
                        WHERE am2.album_id = a.id
                    ) AS member_count,

                    (
                        SELECT COUNT(*)::int
                        FROM photos p
                        WHERE p.album_id = a.id
                    ) AS photo_count

                FROM albums a

                INNER JOIN album_members am
                    ON a.id = am.album_id

                WHERE
                    a.id = $1
                    AND am.user_id = $2
                `,
                [
                    req.params.albumId,
                    req.user.userId
                ]
            );

            if(result.rows.length === 0)
            {
                return res.status(404).json({
                    success:false,
                    message:"Album not found"
                });
            }

            res.json({
                success:true,
                album:result.rows[0]
            });

        }
        catch(error)
        {
            console.error(error);

            res.status(500).json({
                success:false
            });
        }
    }
);
router.get(
  "/:albumId/settings",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;

      const result =
      await pool.query(
        `
        SELECT
          album_name,
          album_cover,
          location,
          upload_permission
        FROM albums
        WHERE id = $1
        `,
        [albumId]
      );

      if(result.rows.length === 0)
      {
        return res.status(404).json({
          success:false,
          message:"Album not found"
        });
      }

      res.json({
        success:true,
        settings:result.rows[0]
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);
router.patch(
  "/:albumId/settings",
  authMiddleware,
  async (req,res) => {

    try {

      const { albumId } = req.params;

      const {
        album_name,
        location,
        upload_permission,
        album_cover,
      } = req.body;

      const ownerCheck =
      await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role = 'owner'
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if(ownerCheck.rows.length === 0)
      {
        return res.status(403).json({
          success:false,
          message:"Only owner can modify settings"
        });
      }

      const result =
      await pool.query(
        `
        UPDATE albums
        SET
          album_name = $1,
          location = $2,
          upload_permission = $3,
          album_cover = $4
        WHERE id = $5
        RETURNING *
        `,
        [
          album_name,
          location,
          upload_permission,
          album_cover,
          albumId
        ]
      );
      
      albumUpdated(albumId);
      uploadMembersUpdated(albumId);

      res.json({
        success:true,
        album:result.rows[0]
      });

    }
    catch(error)
    {
      console.error(error);

      res.status(500).json({
        success:false
      });
    }

  }
);
router.delete(
  "/:albumId",
  authMiddleware,
  async (req, res) => {

    try {

      const { albumId } = req.params;

      const ownerCheck = await pool.query(
        `
        SELECT *
        FROM album_members
        WHERE
          album_id = $1
          AND user_id = $2
          AND role = 'owner'
        `,
        [
          albumId,
          req.user.userId
        ]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Only owner can delete album"
        });
      }

      const result = await pool.query(
        `
        DELETE FROM albums
        WHERE id = $1
        RETURNING id
        `,
        [albumId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Album not found"
        });
      }
      
      // Notify all members
      albumDeleted(albumId);

      return res.json({
        success: true,
        message: "Album deleted successfully"
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Server error"
      });

    }

  }
);
router.delete(
    "/:albumId/photos",
    authMiddleware,
    async (req, res) => {

        try {

            const { albumId } = req.params;
            const userId = req.user.userId;

            const { photoIds } = req.body;
            const userResult = await pool.query(
              `
              SELECT full_name
              FROM users
              WHERE id = $1
              `,
              [userId]
          );

const fullName = userResult.rows[0].full_name;

            const memberResult = await pool.query(
    `
    SELECT role
    FROM album_members
    WHERE album_id = $1
    AND user_id = $2
    `,
    [albumId, userId]
);

if (memberResult.rows.length === 0) {

    return res.status(403).json({
        success: false,
        message: "Not a member of this album."
    });

}

const role = memberResult.rows[0].role;
const albumResult = await pool.query(
    `
    SELECT access_type
    FROM albums
    WHERE id = $1
    `,
    [albumId]
);

if (albumResult.rows.length === 0) {

    return res.status(404).json({
        success: false,
        message: "Album not found."
    });

}

const accessType = albumResult.rows[0].access_type;
const photoResult = await pool.query(
    `
    SELECT *
    FROM photos
    WHERE album_id = $1
    AND id = ANY($2)
    `,
    [
        albumId,
        photoIds
    ]
);
const photosToDelete = photoResult.rows.filter(photo => {

    // Public album
    if (accessType === "public") {

        // Owner/Admin can delete any photo
        if (
            role === "owner" ||
            role === "admin"
        ) {
            return true;
        }

        // Viewer can delete only their uploads
        return photo.uploaded_by === userId;
    }

    // Private album
    return photo.uploaded_by === userId;

});
if (photosToDelete.length === 0) {

    return res.status(403).json({

        success: false,

        message: "You do not have permission to delete these photos."

    });

}
for (const photo of photosToDelete) {

    await cloudinary.uploader.destroy(
        photo.cloudinary_public_id
    );

}
const photoids = photosToDelete.map(
    photo => photo.id
);

await pool.query(
    `
    DELETE FROM photos
    WHERE id = ANY($1::int[])
    `,
    [photoids]
);
const remaining = await pool.query(
    `
    SELECT COUNT(*) AS remaining
    FROM photos
    WHERE album_id = $1
    AND face_indexed = FALSE
    `,
    [albumId]
);

if (Number(remaining.rows[0].remaining) === 0) {

    await pool.query(
        `
        UPDATE albums
        SET face_index_status = 'ready'
        WHERE id = $1
        `,
        [albumId]
    );

}
console.log("Deleted from Cloudinary");
// photosDeleted(
//   albumId,
//   userId,
//   fullName,
//   photoids.length,
//   photoids
// );
emitToAlbum(
    albumId,
    "photosDeleted",
    {
        userId,
        fullName,
        photoCount: photoids.length,
        photoIds:photoids
    }
);

            return res.json({
                success: true,
                message: `${photoids.length} photo(s) deleted successfully.`
            });

        }
        catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Delete failed"
            });

        }

    }
);



module.exports = router;