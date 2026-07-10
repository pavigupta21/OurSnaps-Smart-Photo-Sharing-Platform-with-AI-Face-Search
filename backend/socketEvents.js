const { getIO,connectedUsers } = require("./socket");

const emitToAlbum = (
    albumId,
    eventName,
    data = {}
) => {

    const io = getIO();

    io.to(`album_${albumId}`).emit(
        eventName,
        data
    );

};
;



/* Album */

const albumUpdated = (albumId) => {

    emitToAlbum(
        albumId,
        "albumUpdated"
    );

};
const albumDeleted=(albumId)=>{
    emitToAlbum(
        albumId,
        "albumDeleted"
    )
}

/* Upload Permissions */

const uploadMembersUpdated = (albumId) => {

    emitToAlbum(
        albumId,
        "uploadMembersUpdated"
    );

};
/* Upload Photos */


const photosUploaded = (
    albumId,
    userId,
    fullName,
    photoCount
) => {

    emitToAlbum(
        albumId,
        "photosUploaded",
        {
            userId,
            fullName,
            photoCount
        }
    );

};
/* Delete Photos */


const photosDeleted = (
    albumId,
    userId,
    fullName,
    photoCount,
    photoIds
) => {

    emitToAlbum(
        albumId,
        "photosDeleted",
        {
            userId,
            fullName,
            photoCount,
            photoIds
        }
    );

};

/*Member Joined */

const memberJoined = (
    albumId,
    userId,
    fullName
) => {

    emitToAlbum(
        albumId,
        "memberJoined",
        {
            userId,
            fullName
        }
    );

};
/* Member Left */

const memberLeft = (
    albumId,
    userId,
    fullName
) => {

    emitToAlbum(
        albumId,
        "memberLeft",
        {
            userId,
            fullName
        }
    );

};
/* Member Role Updated */

const memberRoleUpdated = (
    albumId,
    userId,
    fullName,
    newRole
) => {

    emitToAlbum(
        albumId,
        "memberRoleUpdated",
        {
            userId,
            fullName,
            newRole
        }
    );

};

/* Member Removed */

const memberRemoved = (
    albumId,
    userId,
    fullName
) => {

    emitToAlbum(
        albumId,
        "memberRemoved",
        {
            userId,
            fullName
        }
    );

};

module.exports = {

    emitToAlbum,
    albumUpdated,
    albumDeleted,
    uploadMembersUpdated,
    photosUploaded,
    photosDeleted,
    memberJoined,
    memberLeft,
    memberRoleUpdated,
    memberRemoved

};