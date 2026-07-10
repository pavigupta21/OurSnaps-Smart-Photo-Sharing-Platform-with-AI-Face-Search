import { useState,useEffect } from "react";
import PhotoHeader from "./PhotoHeader";
import PhotoSubTabs from "./PhotoSubTabs";
import PhotoFilters from "./PhotoFilters";
import FaceSearchSection from "./FaceSearchSection";
import FaceCaptureModal from "../FaceCaptureModal";
import PhotoGrid from "./PhotoGrid";
import axios from "axios";
import socket from "../../socket";
import "./PhotoSection.css";

function PhotoSection ({
    role,
    album,
    albumId,
    canUpload,
    triggerToast,
    fetchPhotos,
    fetchAlbum,
    fetchNewFacePhotos,
    setPhotos,
    setAlbum,
    photoView,
    setPhotoView,
    uploaderSearch,
    setUploaderSearch,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
    faceRegistered,
    searchReason,
    bannerTitle,
    bannerMessage,
    loadMatchedPhotos,
    faceProfile,
    totalPhotoCount,
    matchedPhotos,
    photos,
    filteredPhotos,
    currentUserId,
    setSelectedPhoto,
    setSelectedPhotoIndex,
    selectedPhoto,
    selectedPhotoIndex,
    showPreviousPhoto,
    currentGallery,
    showNextPhoto,
    fetchFaceProfile,
    API_URL,
    token
    
}){
    /* PhotoHeader*/
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadMethodModal, setShowUploadMethodModal] = useState(false);
    const [showDeletePhotosModal, setShowDeletePhotosModal] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalUploadCount, setTotalUploadCount] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState([]);

    /*PhotoSubTabs*/
    /*PhotoFilters*/
    /*FaceSearchSection*/
    const [isSearching, setIsSearching] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);

    /*PhotoGrid*/
    const [isDownloading, setIsDownloading] = useState(false);
    
    

    useEffect(() => {

    const handleUploadProgress = (data) => {

        console.log("Upload Progress:", data);

        setUploadedCount(data.uploaded);
        setTotalUploadCount(data.total);

    };

    socket.on("uploadProgress", handleUploadProgress);

    return () => {
        socket.off("uploadProgress", handleUploadProgress);
    };

}, []);
const searchPhotos = async () => {

    try {

        setIsSearching(true);

        await axios.post(
            `${API_URL}/api/face-search/${albumId}/search-photos`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await loadMatchedPhotos();

        // Refresh banner state
        await fetchNewFacePhotos();

    }
    catch (err) {

    console.error(err);

    console.log(err.response);

    alert(
        err.response?.data?.message || "Failed to search photos."
    );

}
    finally {

        setIsSearching(false);

    }

};
const togglePhotoSelection = (photoId) => {

    if (selectedPhotos.includes(photoId)) {

        setSelectedPhotos(prev =>
            prev.filter(id => id !== photoId)
        );

    }
    else {

        setSelectedPhotos(prev => [
            ...prev,
            photoId
        ]);

    }

};

    const uploadPhotos = async () => {

    try {

        if(selectedFiles.length === 0)
        {
            return;
        }

        setIsUploading(true);
        setUploadedCount(0);
        setTotalUploadCount(selectedFiles.length);

        const token = localStorage.getItem("token");

        const formData = new FormData();

        selectedFiles.forEach((file) => {

            formData.append(
                "photos",
                file
            );

        });



    await axios.post(
        `http://localhost:5000/api/albums/${albumId}/photos`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },

        }
    );
    


        setIsUploading(false);


        triggerToast(
            "Photos uploaded successfully",
            "success"
        );
        
        await fetchPhotos();
        await fetchAlbum();
        await fetchNewFacePhotos();
        setUploadedCount(0);
        setTotalUploadCount(0);
        setSelectedFiles([]);
        setShowUploadModal(false);
    }
    catch(error)
{
    setIsUploading(false);

    console.error(error);
}
};
const handleFaceRegistered = async () => {

    await fetchFaceProfile();

    await fetchNewFacePhotos();

};
const handleDeletePhotos = async () => {

        setIsDeleting(true);
    try {

        const token = localStorage.getItem("token");

        await axios.delete(
            `http://localhost:5000/api/albums/${albumId}/photos`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    photoIds: selectedPhotos
                }
            }
        );
        setPhotos(prev =>
    prev.filter(
        photo => !selectedPhotos.includes(photo.id)
    )
);
setAlbum(prev => ({
    ...prev,
    photo_count:
        prev.photo_count - selectedPhotos.length
}));
setSelectedPhotos([]);
setDeleteMode(false);

        await fetchAlbum();
        await fetchPhotos();
        await fetchNewFacePhotos();

        triggerToast(
            "Photos deleted successfully.",
            "success"
        ); 
        

        setShowDeletePhotosModal(false);

    }
    catch (error) {

        triggerToast(
            "Unable to delete photos.",
            "error"
        );

    }
    finally {

        setIsDeleting(false);

    }

};
const handleDownload = async () => {

    try {

        setIsDownloading(true);

        const downloadUrl = selectedPhoto.photo_url.replace(
            "/upload/",
            "/upload/fl_attachment/"
        );

        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = "";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Gives the browser a moment to start the download
        setTimeout(() => {
            setIsDownloading(false);
        }, 1000);

    }
    catch (err) {

        console.error(err);
        setIsDownloading(false);

    }

};
const isFirstPhoto = selectedPhotoIndex === 0;
const isLastPhoto = selectedPhotoIndex === currentGallery.length - 1;


const uploadPercentage =
    totalUploadCount > 0
        ? Math.round(
              (uploadedCount * 100) /
              totalUploadCount
          )
        : 0;

    return(
        <>  
            <PhotoHeader
                deleteMode={deleteMode}
                setDeleteMode={setDeleteMode}
                selectedPhotos={selectedPhotos}
                setSelectedPhotos={setSelectedPhotos}
                setSelectedFiles={setSelectedFiles}
                setShowUploadModal={setShowUploadModal}
                setIsUploading={setIsUploading}
                setShowUploadMethodModal={setShowUploadMethodModal}
                setShowDeletePhotosModal={setShowDeletePhotosModal}
                canUpload = {canUpload}
                triggerToast={triggerToast}
            />
            <PhotoSubTabs
                setPhotoView={setPhotoView}
                album={album}
                photoView={photoView}
            />
            <PhotoFilters
                photoView={photoView}
                album={album}
                uploaderSearch={uploaderSearch}
                setUploaderSearch={setUploaderSearch}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />
            {
    album.face_index_status === "processing" && (
        <div className="face-search-processing-note">
            ⏳ Face Search is temporarily unavailable while newly uploaded
            photos are being indexed. It will automatically become available
            once processing completes.
        </div>
    )
}   



{deleteMode && (
    <div className="delete-info-banner">

        {album.access_type === "private" ? (
            <>
                <span className="banner-icon">🔒</span>
                <span>
                    In a <strong>private album</strong>, you can only delete photos that you have uploaded.
                </span>
            </>
        ) : role === "viewer" ? (
            <>
                <span className="banner-icon">ℹ️</span>
                <span>
                    You can only delete photos that you have uploaded. Photos uploaded by other members can only be deleted by an admin or the album owner.
                </span>
            </>
        ) : role === "admin" ? (
            <>
                <span className="banner-icon">🛡️</span>
                <span>
                    As an <strong>Admin</strong>, you can delete any photo in this album.
                </span>
            </>
        ) : (
            <>
                <span className="banner-icon">👑</span>
                <span>
                    As the <strong>Owner</strong>, you can delete any photo in this album.
                </span>
            </>
        )}

    </div>
)}
<FaceSearchSection
    album={album}
    photoView={photoView}
    faceRegistered={faceRegistered}
    searchReason={searchReason}
    bannerTitle={bannerTitle}
    bannerMessage={bannerMessage}
    searchPhotos={searchPhotos}
    isSearching={isSearching}
    setShowFaceModal={setShowFaceModal}
    faceProfile={faceProfile}
    totalPhotoCount={totalPhotoCount}
    matchedPhotos={matchedPhotos}
    photos={photos}
    setSelectedPhoto={setSelectedPhoto}
    setSelectedPhotoIndex={setSelectedPhotoIndex}
/>
<PhotoGrid
    album={album}
    photoView={photoView}
    filteredPhotos={filteredPhotos}
    role={role}
    currentUserId={currentUserId}
    deleteMode = {deleteMode}
    selectedPhotos={selectedPhotos}
    togglePhotoSelection={togglePhotoSelection}
    setSelectedPhotos={setSelectedPhotos}
    setSelectedPhoto={setSelectedPhoto}
    setSelectedPhotoIndex={setSelectedPhotoIndex}
/>
            {showUploadModal && (
    <div className="modal-overlay">
        {
            !isUploading ?(
                <div className="upload-review-modal">

            <div className="upload-review-header">

                <h2>📤 Ready to Upload</h2>

                <button
                    className="upload-review-close"
                    onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFiles([]);
                    }}
                >
                    ✕
                </button>

            </div>

            <div className="upload-summary">

                <div className="upload-summary-card">

                    <div className="upload-summary-number">
                        {selectedFiles.length}
                    </div>

                    <div>
                        Photos Selected
                    </div>

                </div>

                <div className="upload-summary-card">

                    <div className="upload-summary-number">

                        {(
                            selectedFiles.reduce(
                                (sum,file) =>
                                    sum + file.size,
                                0
                            ) /
                            1024 /
                            1024
                        ).toFixed(1)}

                    </div>

                    <div>
                        MB Total
                    </div>

                </div>

            </div>

            <div className="upload-preview-list">

                {selectedFiles
                    .slice(0,5)
                    .map((file,index) => (

                    <div
                        key={index}
                        className="upload-file-row"
                    >
                        📷 {file.name}
                    </div>

                ))}

                {selectedFiles.length > 5 && (
                    <div className="upload-more-files">
                        +{selectedFiles.length - 5} more files
                    </div>
                )}

            </div>

            <div className="upload-review-actions">

                <button
                    className="btn-cancel"
                    onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFiles([]);
                    }}
                >
                    Cancel
                </button>

                <button
                    className="btn-save"
                    disabled={isUploading}
                    onClick={uploadPhotos}
                >
                    {
                        isUploading
                        ? "Uploading..."
                        : `Upload ${selectedFiles.length} Photos`
                    }
                </button>

            </div>

        </div>
            ):(
            <div className="upload-review-modal">
                <div className="upload-progress-screen">

    <div className="upload-progress-icon">
        📤
    </div>

    <h2>Uploading Photos</h2>

    <p className="upload-progress-subtitle">
        Please don't close this window.
    </p>

    <div className="upload-progress-bar">

        <div
            className="upload-progress-fill"
            style={{
                width: `${uploadPercentage}%`
            }}
        />

    </div>

    <div className="upload-progress-footer">

    <span>
        {uploadedCount}/{totalUploadCount} Photos Uploaded
    </span>

    <span>
        {
            uploadedCount === totalUploadCount
            ? "Finalizing upload..."
            : `Uploading photo ${uploadedCount + 1} of ${totalUploadCount}`
        }
    </span>

</div>

</div>
                </div>
            )
        }

        

    </div>
)}
{
  selectedPhoto && (

    <div
      className="photo-modal-overlay"
      onClick={() => {setSelectedPhoto(null)
        setSelectedPhotoIndex(null);
      }}
    >

      <div
  className="photo-modal"
  onClick={(e) => e.stopPropagation()}
>

  <button
    className="photo-modal-close"
    onClick={() => {setSelectedPhoto(null)
        setSelectedPhotoIndex(null);
    }}
  >
    ✕
  </button>

  <div className="photo-modal-image-section">
    
{
    !isFirstPhoto ? (
        <button
    className="photo-nav-btn left"
    onClick={showPreviousPhoto}
    >
    ‹
</button>
    )
    : (
        <div className="photo-nav-btn left" style={{opacity:0}}>‹</div>
    )   
}
{
    !isLastPhoto ? (
        <button
        className="photo-nav-btn right"
        onClick={showNextPhoto}
    >
        ›
    </button>
    )
    : (
        <div className="photo-nav-btn right" style={{opacity:0}}>›</div>
    )
}


    <img
      src={selectedPhoto.photo_url}
      alt=""
      className="photo-modal-image"
    />

  </div>

  <div className="photo-modal-info">

    <h2>Photo Details</h2>

    <div className="photo-detail-section">
    <h4>Uploader</h4>

    <div className="uploader-info">

        <div className="uploader-avatar">

    {
        selectedPhoto.profile_pic ? (

            <img
                src={selectedPhoto.profile_pic}
                alt={selectedPhoto.full_name}
                className="uploader-avatar-img"
            />

        ) : (

            selectedPhoto.full_name?.charAt(0)

        )
    }

</div>

        <div>
            <div className="uploader-name">
                {selectedPhoto.full_name}
            </div>
        </div>

    </div>
</div>

    <div className="photo-detail-section">
      <h4>Uploaded On</h4>
      <p>
        {new Date(
          selectedPhoto.uploaded_at
        ).toLocaleString()}
      </p>
    </div>

    <div className="photo-detail-section">
      <h4>Album</h4>
      <p>{album.album_name}</p>
    </div>
    <div className="photo-download-section">

    <button
    className="photo-download-btn"
    onClick={handleDownload}
    disabled={isDownloading}
>
    {isDownloading
        ? "⬇ Downloading..."
        : "⬇ Download Photo"}
</button>

</div>

  </div>
  

</div>


    </div>
    
    

  )
}
{
showFaceModal &&

<FaceCaptureModal

    onClose={() =>
        setShowFaceModal(false)
    }
    onRegistered={handleFaceRegistered}

/>
}
{
showUploadMethodModal && (

<div
    className="modal-overlay"
    onClick={() =>
        setShowUploadMethodModal(false)
    }
>

    <div
        className="upload-method-modal"
        onClick={(e) => e.stopPropagation()}
    >

        <h2>Upload Photos</h2>

        <p>
            Choose how you'd like to upload photos.
        </p>

        <div className="upload-method-options">

            <div
                className="upload-method-card"
                onClick={() => {

                    setShowUploadMethodModal(false);

                    document
                        .getElementById("photo-upload")
                        .click();
                }}
            >
                <div className="upload-method-icon">
                    📁
                </div>

                <h3>From Device</h3>

                <p>
                    Select photos from your computer
                </p>
            </div>

            <div
                className="upload-method-card"
                onClick={() => {

                    setShowUploadMethodModal(false);

                    document
                        .getElementById("folder-upload")
                        .click();
                }}
            >
                <div className="upload-method-icon">
                    🚀
                </div>

                <h3>Bulk Event Folder</h3>

                <p>
                    Upload an entire event folder
                </p>
            </div>

            <div className="upload-method-card disabled">

                <div className="upload-method-icon">
                    ☁️
                </div>

                <h3>Google Drive</h3>

                <p>Coming Soon</p>

            </div>

        </div>

    </div>

</div>

)}

{
    showDeletePhotosModal && (

        <div className="modal-overlay">

            <div className="delete-photos-modal">

                <div className="delete-modal-icon">
                    🗑️
                </div>

                <h2>Delete Photos?</h2>

                <p className="delete-modal-message">
                    You are about to permanently delete
                    <strong> {selectedPhotos.length} photo{selectedPhotos.length > 1 ? "s" : ""}</strong>.
                </p>

                <p className="delete-modal-warning">
                    Deleted photos will be removed from the album,
                    Cloudinary storage, and Face Search results.
                    Other album members will no longer be able to
                    access them.
                </p>

                <div className="delete-modal-actions">

                    <button
                        className="btn-cancel"
                        disabled={isDeleting}
                        onClick={() =>{
                            if(!isDeleting)
                            {
                                setShowDeletePhotosModal(false)
                            }
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn-delete-confirm"
                        onClick={handleDeletePhotos}
                        disabled={isDeleting}
                    >
                        {isDeleting
                            ? "Deleting..."
                            : "Delete Permanently"}
                    </button>

                </div>

            </div>

        </div>

    )
}
        </>
    )
}
export default PhotoSection