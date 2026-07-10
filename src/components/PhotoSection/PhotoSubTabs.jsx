import "./PhotoSubTabs.css";

function PhotoSubTabs({
    setPhotoView,
    album,
    photoView
})
{
    return (
        <>
            <div className="photo-subtabs">
                         <button
                            className={`photo-tab ${
                            photoView === "all"
                                ? "active"
                                : ""
                            }`}
                            onClick={() => setPhotoView("all")}
                        >
                            All Photos
                        </button>

                        <button
                            className={`photo-tab ${
                            photoView === "uploads"
                                ? "active"
                                : ""
                            }`}
                            onClick={() => setPhotoView("uploads")}
                        >
                            My Uploads
                        </button>

                        <button
                            className={`photo-tab ${
                                photoView === "facesearch"
                                    ? "active"
                                    : ""
                            } ${
                                album.face_index_status === "processing"
                                    ? "disabled"
                                    : ""
                            }`}
                            disabled={album.face_index_status === "processing"}
                            title={
                                album.face_index_status === "processing"
                                    ? "Face Search is temporarily unavailable while photos are being indexed."
                                    : ""
                            }
                            onClick={() => setPhotoView("facesearch")}
                        >
                            My Face Search
                            {album.face_index_status === "processing" && " 🔒"}
                        </button>

                    </div>
        </>
    )
}

export default PhotoSubTabs;