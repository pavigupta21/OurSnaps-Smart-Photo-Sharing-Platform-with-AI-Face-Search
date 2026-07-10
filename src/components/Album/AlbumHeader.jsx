import defaultAlbumCover from "../../assets/DefaultAlbumCover.png";
import "./AlbumHeader.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AlbumHeader({
    album,
    role,
    API_URL,
    albumId,
    triggerToast
}) {
    const navigate = useNavigate();
    const [leavingAlbum,setLeavingAlbum] = useState(false);
    const [showLeaveAlbumModal,setShowLeaveAlbumModal] = useState(false);
    const leaveAlbum = async () => {

    try {

        setLeavingAlbum(true);

        const token = localStorage.getItem("token");

        const response = await axios.delete(
            `${API_URL}/api/albums/${albumId}/leave`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        triggerToast(
            response.data.message || "Left album successfully",
            "success"
        );

        setShowLeaveAlbumModal(false);

        navigate("/dashboard");

    }
    catch(error)
    {
        console.error(error);

        triggerToast(
            error.response?.data?.message ||
            "Failed to leave album",
            "error"
        );
    }
    finally
    {
        setLeavingAlbum(false);
    }

};
    return (
        <>
            <div className="albumpg-banner">

            <img
                src={album.album_cover || defaultAlbumCover}
                alt="cover"
                onError={(e) => {
                  e.target.src = defaultAlbumCover;
                }}
                className="albumpg-cover-image"
            />

            <div className="albumpg-overlay">

                <h1>{album.album_name}</h1>
                
                <div className="albumpg-meta">
            
                    <span>
                        👥 {album.member_count || 1} Members
                    </span>

                    <span>
                        📸 {album.photo_count || 0} Photos
                    </span>

                    <span>
                        📍 {album.location || "No Location"}
                    </span>

                    <span>
                        {album.access_type === "public"
                        ? "🌍 Public"
                        : "🔒 Private"}
                    </span>

                    <span>
                        {role === "owner"
                        ? "👑 Owner"
                        : role === "admin"
                        ? "🛡️ Admin"
                        : "👤 Viewer"}
                    </span>
                    

                </div>
                
                
                <div className="albumpg-created">
                    📅 Created on {new Date(album.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                </div>
                {role !== "owner" && (
                <button
                    className="leave-album-btn"
                    onClick={() => setShowLeaveAlbumModal(true)}
                >
                    Leave Album
                </button>
                )}

            </div>

        </div>
        {showLeaveAlbumModal && (
  <div className="otp-overlay">

    <div className="leave-album-modal">

      <div className="leave-modal-icon">
        🚪
      </div>

      <h2>Leave Album</h2>

      <p>
        Are you sure you want to leave this album?
      </p>

      <ul className="leave-warning-list">
        <li>You will lose access to album photos</li>
        <li>You will be removed from the member list</li>
        <li>You can only rejoin if invited again</li>
      </ul>

      <div className="modal-actions">

        <button
          className="btn-cancel"
          onClick={() => setShowLeaveAlbumModal(false)}
        >
          Cancel
        </button>

        <button
          className="leave-album-confirm-btn"
          disabled={leavingAlbum}
          onClick={leaveAlbum}
        >
          {leavingAlbum ? "Leaving..." : "Leave Album"}
        </button>

      </div>

    </div>

  </div>
)}
        </>
       
        
    );
}

export default AlbumHeader;