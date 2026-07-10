import "./PhotoGrid.css";

function PhotoGrid({
    album,
    photoView,
    filteredPhotos,
    role,
    currentUserId,
    deleteMode,
    selectedPhotos,
    togglePhotoSelection,
    setSelectedPhoto,
    setSelectedPhotoIndex
})
{
    return(
        <>
            {
            photoView === "facesearch"
            ? null
            :(
            album.access_type === "private"
            &&
            photoView === "all"
            ) ? (

        <div className="private-gallery-container">

            <div className="private-gallery-overlay-card">

                <div className="private-lock-icon">
                    🔒
                </div>

                <h3>Private Album</h3>
                <p className="private-description">
                Members cannot browse the full gallery.
                Use Face Search to find your photos.
            </p>

                <p>
                    You can access:
                </p>

                <div className="private-access-list">

                    <div className="private-access-item">
                        📤 Your Uploads
                    </div>

                    <div className="private-access-item">
                        🤖 Face Search Results
                    </div>

                </div>

            </div>

        </div>

    )
    : (

        <div className="photo-grid">

    {filteredPhotos.map((photo, index) => {

        const canDeletePhoto =
            album.access_type === "public"
                ? (
                    role === "owner" ||
                    role === "admin" ||
                    Number(photo.uploaded_by) === Number(currentUserId)
                )
                : (
                    Number(photo.uploaded_by) === Number(currentUserId)
                );

        return (

            <div
    key={photo.id}
    className={`photo-card
    ${deleteMode && !canDeletePhoto ? "photo-card-disabled" : ""}
    ${selectedPhotos.includes(photo.id) ? "photo-card-selected" : ""}
`}
    onClick={() => {

    if (deleteMode) {

        if (!canDeletePhoto) {
            return;
        }

        togglePhotoSelection(photo.id);
        return;
    }

    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);

}}
>

                {
    deleteMode && canDeletePhoto && (
        <div
        className="delete-photo-checkbox"
        onClick={(e) => {
            e.stopPropagation();
            togglePhotoSelection(photo.id);
        }}
    >

            <div
    className={`delete-selector ${
        selectedPhotos.includes(photo.id)
            ? "selected"
            : ""
    }`}
>
    {selectedPhotos.includes(photo.id) && "✓"}
</div>

        </div>
            )
        }
    <div className="photo-image-wrapper">
        <img
                    src={photo.photo_url}
                    alt=""
                    className="photo-image"
                />
                {!photo.face_indexed && (
                <div className="photo-processing-overlay">

                <div className="photo-processing-spinner"></div>

                <div className="photo-processing-text">
                    <strong>Indexing...</strong>
                    <span>This photo is being prepared
for Face Search.</span>
                </div>

            </div>
            )}
    </div>
                
            

                <div className="photo-info">

                    <div className="photo-uploader">
                        {photo.full_name}
                    </div>

                    <div className="photo-date">
                        {new Date(photo.uploaded_at).toLocaleDateString()}
                    </div>

                </div>

            </div>

        );

    })}

</div>

    )
}
        </>
    )
}
export default PhotoGrid;