import "./FaceSearchSection.css";

function FaceSearchSection({
    album,
    photoView,
    faceRegistered,
    searchReason,
    bannerTitle,
    bannerMessage,
    searchPhotos,
    isSearching,
    setShowFaceModal,
    faceProfile,
    totalPhotoCount,
    matchedPhotos,
    photos,
    setSelectedPhoto,
    setSelectedPhotoIndex

})
{
    return(
        <>
            {
photoView === "facesearch" && (

    <div className="face-search-page">


    {faceRegistered && searchReason && (

        <div className="new-face-search-card">

    <div>

        <h3>{bannerTitle}</h3>

        <p>{bannerMessage}</p>

    </div>

       <button
    className="scan-face-btn"
    onClick={searchPhotos}
    disabled={
        isSearching ||
        album.face_index_status === "processing"
    }
>
    {album.face_index_status === "processing"
        ? "Face Search Updating..."
        : isSearching
        ? "Searching..."
        : "Search Photos"}
</button>

    </div>
    )}

    <div className="face-search-results">

        {
!faceRegistered ? (

    <div className="register-face-card">

        <div className="register-face-icon">
            👤
        </div>

        <h2>Register Your Face</h2>

        <p>
            Register your face once to automatically
            find every photo you're in from this album.
        </p>

        <button
            className="scan-face-btn"
            onClick={() => setShowFaceModal(true)}
        >
            Register Face
        </button>

    </div>

)
:
(
    <div className="registered-face-card">
        <h2 className="registered-face-title">
            Registered Face
        </h2>
       <img
        className="registered-face-image"
        src={faceProfile.previewPhoto}
        alt="Registered Face"
    />

        <h3 className="face-status-badge">
            Registered
        </h3>

        <p>
        This face will be used for future searches in all your albums.
    </p>

    <button className="scan-face-btn"
        onClick={() =>
            setShowFaceModal(true)
        }
    >
        Scan Again
    </button>

    </div>
)

}
{faceRegistered &&
 totalPhotoCount === 0 && (

    <div className="face-search-empty">

        <h3>📷 No Photos Yet</h3>

        <p>
            There are currently no photos in this album.
        </p>

    </div>

)}
{faceRegistered &&
 totalPhotoCount > 0 &&
 matchedPhotos.length === 0 &&
 !searchReason && (

    <div className="face-search-empty">

        <h3>No Matching Photos</h3>

        <p>
            We couldn't find your face in this album yet.
        </p>

    </div>

)}
{matchedPhotos.length > 0 && (

    <div className="face-search-gallery">

        <h2>Your Photos</h2>

        <div className="photo-grid">

            {matchedPhotos.map((photo, index) => (

                <div
                    key={photo.id}
                    className="photo-card"
                    onClick={() => {

                        const fullPhoto = photos.find(
                            p => p.id === photo.id
                        );

                        setSelectedPhoto(fullPhoto || photo);

                        setSelectedPhotoIndex(index);

                    }}
                >

                    <img
                        src={photo.photo_url}
                        alt=""
                        className="photo-image"
                    />
                   
                    

                </div>

            ))}

        </div>

    </div>

)}

    </div>

</div>

  

)

}
        </>
    )
}

export default FaceSearchSection;