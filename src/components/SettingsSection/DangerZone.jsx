import "./DangerZone.css"

function DangerZone({
    setShowDeleteAlbumModal,
    showDeleteAlbumModal,
    deletingAlbum,
    deleteAlbum
})
{
    return (
        <>
            <div className="album-settings-card danger-zone">

                <div className="danger-zone-header">

                    <span className="danger-zone-icon">
                        ⚠️
                    </span>

                    <h3>Danger Zone</h3>

                </div>

                <p className="danger-zone-text">
                    Permanently delete this album and all associated data.
                </p>

                <ul className="danger-zone-list">
                    <li>All photos will be deleted</li>
                    <li>All album members will be removed</li>
                    <li>All invite links will stop working</li>
                    <li>This action cannot be undone</li>
                </ul>

                <button
                    className="delete-album-btn"
                    onClick={() => setShowDeleteAlbumModal(true)}
                >
                    Delete Album
                </button>

            </div>
            {
showDeleteAlbumModal && (

<div className="modal-overlay">

    <div className="delete-album-modal">

        <h2>Delete Album</h2>

        <p>
            Are you sure you want to delete this album?
        </p>

        <div className="modal-actions">

    <button
        className="btn-cancel"
        onClick={() => setShowDeleteAlbumModal(false)}
    >
        Cancel
    </button>

    <button
    className="delete-album-btn"
    disabled={deletingAlbum}
    onClick={deleteAlbum}
>
    {deletingAlbum
        ? "Deleting..."
        : "Delete Forever"}
</button>
</div>

    </div>

</div>

)
}

        </>
    )
}
export default DangerZone;