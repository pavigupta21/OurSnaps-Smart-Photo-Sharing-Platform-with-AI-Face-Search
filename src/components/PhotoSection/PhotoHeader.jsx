import "./PhotoHeader.css";

function PhotoHeader({
    setSelectedFiles,
    setShowUploadModal,
    setIsUploading,
    deleteMode,
    canUpload,
    triggerToast,
    setShowUploadMethodModal,
    setDeleteMode,
    setSelectedPhotos,
    selectedPhotos,
    setShowDeletePhotosModal
}) {
    return (
       <div className="albumpg-section-header">

                        <h2>Photos</h2>

                        <>
    <input
        type="file"
        id="photo-upload"
        hidden
        multiple
        accept="image/*"
        onChange={(e) => {

            const files = Array.from(e.target.files);

            setSelectedFiles(files);

            if(files.length > 0)
            {
                setShowUploadModal(true);
            }
            setIsUploading(false);
        }}
    />
    <input
    type="file"
    id="folder-upload"
    hidden
    multiple
    webkitdirectory=""
    onChange={(e) => {

        const files = Array.from(e.target.files);

        setSelectedFiles(files);

        if(files.length > 0)
        {
            setShowUploadModal(true);
        }
    }}
/>

    <div className="photo-action-buttons">

    {
        !deleteMode ? (
            <>
                <button
                    className={`albumpg-primary-btn ${
                        !canUpload ? "upload-disabled-btn" : ""
                    }`}
                    onClick={() => {

                        if (!canUpload) {
                            triggerToast(
                                "The album owner has not granted you upload permission.",
                                "error"
                            );
                            return;
                        }

                        setShowUploadMethodModal(true);

                    }}
                >
                    {!canUpload ? "🔒 Upload Photos" : "Upload Photos"}
                </button>

                <button
                    className="albumpg-secondary-btn"
                    onClick={() => setDeleteMode(true)}
                >
                    🗑 Delete Photos
                </button>
            </>
        ) : (
            <>
    <button
        className="albumpg-secondary-btn"
        onClick={() => {
            setDeleteMode(false);
            setSelectedPhotos([]);
        }}
    >
        Cancel
    </button>

    <button
        className="delete-selected-btn"
        disabled={selectedPhotos.length === 0}
        onClick={() => setShowDeletePhotosModal(true)}
    >
        🗑 Delete ({selectedPhotos.length})
    </button>
</>
        )
    }

</div>
</>
</div>
    );
}

export default PhotoHeader;