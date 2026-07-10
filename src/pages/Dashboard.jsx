import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import defaultAlbumCover from "../assets/DefaultAlbumCover.png";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
  const user = JSON.parse(localStorage.getItem("user"));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempName, setTempName] = useState(user.fullName || '');
  const [tempPhoto, setTempPhoto] = useState(user.profilePic || null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");

  const [albumCoverPreview, setAlbumCoverPreview] = useState(null);

  const albumCoverInputRef = useRef(null);

  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);

  const [albumName, setAlbumName] = useState("");
  const [albumLocation, setAlbumLocation] = useState("");
  const [accessType, setAccessType] = useState("private");
  const [uploadPermission, setUploadPermission] = useState("owner_only");
  const [albumCover, setAlbumCover] = useState(null);

  const [showJoinModal,setShowJoinModal] = useState(false);
  const [inviteCode,setInviteCode] = useState("");
  
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [albums, setAlbums] = useState([]);

  

const filteredAlbums = albums.filter(album =>
  album.album_name
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const joinAlbum = async () => {

    try {

        const token =
            localStorage.getItem("token");

        const response =
        await fetch(
            "http://localhost:5000/api/albums/join",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                },

                body:JSON.stringify({
                    inviteCode
                })
            }
        );

        const data =
        await response.json();

        if(!data.success)
        {
            triggerToast(
                data.message,
                "error"
            );

            return;
        }

        triggerToast(
            "Joined album successfully!"
        );

        setShowJoinModal(false);

        setInviteCode("");

        navigate(`/album/${data.albumId}`);

    }
    catch(error)
    {
        console.error(error);

        triggerToast(
            "Failed to join album",
            "error"
        );
    }
};
  const fetchAlbums = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/albums/my-albums",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setAlbums(data.albums);
      }

    } catch (error) {

      console.error(
        "Failed to fetch albums:",
        error
      );

    }

  };


  useEffect(() => {
  fetchAlbums();

}, []);
  const triggerToast = (
    message,
    type = "success"
  ) => {

    setToastMessage(message);
    setToastType(type);

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenEditProfile = () => {
    setTempName(user.fullName);
    setTempPhoto(user.profilePic);
    setShowModal(true);
    setShowDropdown(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast('File is too large! Please choose an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhoto(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
  e.preventDefault();

  if (!tempName.trim()) {
    triggerToast("Name cannot be empty!", "error");
    return;
  }

  try {

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/auth/update-profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: tempName,
          profilePic: tempPhoto
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      triggerToast(data.message || "Failed to update profile", "error");
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: data.user.id,
        fullName: data.user.full_name,
        email: data.user.email,
        profilePic: data.user.profile_pic
      })
    );

    setShowModal(false);

    triggerToast(
      "Profile updated successfully!",
      "success"
    );

    window.location.reload();

  } catch (error) {

    console.error(error);

    triggerToast(
      "Something went wrong",
      "error"
    );
  }
};

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleCreateAlbum = async (e) => {
  e.preventDefault();

  if (!albumName.trim()) {
    triggerToast(
      "Album name is required",
      "error"
    );
    return;
  }

  try {

    const token =
      localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/albums/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          albumName,
          albumCover,
          accessType,
          uploadPermission,
          location: albumLocation
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      triggerToast(
        data.message,
        "error"
      );
      return;
    }

    triggerToast(
      "Album created successfully!"
    );

    setShowCreateAlbumModal(false);

    setAlbumName("");
    setAlbumLocation("");
    setAlbumCover(null);
    setAlbumCoverPreview(null);
    setAccessType("private");
    setUploadPermission("owner_only");

    fetchAlbums();

  } catch (error) {

    console.error(error);

    triggerToast(
      "Failed to create album",
      "error"
    );
  }
};
const handleAlbumCoverChange = (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = () => {

    setAlbumCover(reader.result);
    setAlbumCoverPreview(reader.result);

  };

  reader.readAsDataURL(file);
};

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-navbar">
        <div className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <span>OurSnaps</span>
        </div>
        <nav className="navbar-links">
          <button onClick={() => setShowCreateAlbumModal(true)}>Create Album</button>
          <button onClick={() => setShowJoinModal(true)}>Join Album</button>
        </nav>
        <div className="mobile-menu-btn">
          <button
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰  
          </button>
        </div>
        <div className="navbar-profile" ref={dropdownRef}>
          <button 
            className="profile-trigger" 
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User Profile Dropdown"
          >
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.fullName} className="profile-img-avatar" />
            ) : (
              <div className="profile-initials-avatar">{getInitials(user.fullName)}</div>
            )}
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-user-info">
                <span className="user-name">{user.fullName}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <hr className="dropdown-divider" />
              <button onClick={handleOpenEditProfile} className="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Edit Profile</span>
              </button>
              <button onClick={handleLogout} className="dropdown-item logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
        {showMenu && (
          <div className="mobile-menu">
            <button onClick={() => setShowCreateAlbumModal(true)}>Create Album</button>
            <button onClick={() => setShowJoinModal(true)}>Join Album</button>
          </div>
        )}
      </header>
        

      {/* Main Empty Dashboard Body */}
      <main className="dashboard-main">

        <div className="dashboard-hero">
          <h1>Hello, <span>{user.fullName}</span> 👋</h1>
          <p>Manage your event memories and discover photos instantly.</p>
        </div>

        <div className="albums-toolbar">

          <input
            type="text"
            placeholder="Search albums..."
            className="album-search"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

      </div>

        <div className="albums-section">

          <div className="section-header">
            <h2>Recent Albums</h2>
          </div>

          <div className="albums-grid">

            {filteredAlbums.map(album => (
              <div
                key={album.id}
                className="album-card"
                onClick={() => navigate(`/album/${album.id}`)}
              >

                {album.album_cover ? (
                  <img
                    src={album.album_cover || defaultAlbumCover}
                    alt={album.album_name}
                    onError={(e) => {
                      e.target.src = defaultAlbumCover;
                    }}
                    className="album-cover"
                  />
                ) : (
                  <div className="album-cover default-cover"></div>
                )}

                <div className="album-info">

                  <h4>{album.album_name}</h4>

                  {album.location && (
                    <p className="album-location">
                      📍 {album.location}
                    </p>
                  )}
                  {album.created_at && (
                    <p className="album-created">
                      📅 Created on {new Date(album.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  )}
                  <div className="album-badges">

                    <span
                      className={
                        album.access_type === "public"
                          ? "badge badge-public"
                          : "badge badge-private"
                      }
                    >
                      {album.access_type === "public"
                        ? "🌍 Public"
                        : "🔒 Private"}
                    </span>

                    <span
                      className={`role-badge role-${album.role}`}
                    >
                      {album.role === "owner" && "👑 Owner"}
                      {album.role === "admin" && "🛡️ Admin"}
                      {album.role === "viewer" && "👤 Viewer"}
                    </span>

                  </div>

                  <div className="album-stats">

                    <span>
                      👥 {album.member_count || 1} Members
                    </span>

                    <span>
                      📸 {album.photo_count || 0} Photos
                    </span>

                  </div>

                </div>

              </div>
            ))}
            {filteredAlbums.length === 0 && (
              <div className="no-albums">
                No albums found
              </div>
            )}

          </div>

        </div>

      </main>
      {showModal && (
        <div className="modal-overlay">

          <div className="modal-content">

            <h2>Edit Profile</h2>

            <form onSubmit={handleSaveProfile}>

              <div className="profile-photo-section">

                {tempPhoto ? (
                  <img
                    src={tempPhoto}
                    alt="Profile"
                    className="modal-profile-preview"
                  />
                ) : (
                  <div className="modal-profile-preview initials">
                    {getInitials(tempName)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTriggerFileInput}
                  className="change-photo-btn"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={() => setTempPhoto(null)}
                  className="remove-photo-btn"
                >
                  Remove Photo
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

              </div>

              <div className="form-group">

                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) =>
                    setTempName(e.target.value)
                  }
                  className="input-field"
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-save"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
      {
      showCreateAlbumModal && (
        <div className="modal-overlay">

          <div className="modal-content">

            <div className="modal-header">
              <h2>Create Album</h2>

              <p>
                Organize photos from an event and
                share memories with your guests.
              </p>
            </div>

            <form
              onSubmit={handleCreateAlbum}
            >
              <div className="album-cover-section">

  {
    albumCoverPreview ? (

      <img
        src={albumCoverPreview}
        alt="Album Cover"
        className="album-cover-preview"
      />

    ) : (

      <div className="album-cover-placeholder">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
          />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <h4>Add Cover Photo</h4>

        <p>
          Optional but recommended
        </p>

      </div>

    )
  }

  <button
    type="button"
    className="change-cover-btn"
    onClick={() =>
      albumCoverInputRef.current?.click()
    }
  >
    Upload Cover Photo
  </button>

  <input
    type="file"
    accept="image/*"
    ref={albumCoverInputRef}
    onChange={handleAlbumCoverChange}
    style={{ display: "none" }}
  />

</div>
          <h3 className="section-title">
            Album Details
          </h3>
              <div className='form-section'>
                <div className="album-form-group">

                <label>
                  Album Name
                </label>

                <input
                  type="text"
                  value={albumName}
                  onChange={(e) =>
                    setAlbumName(
                      e.target.value
                    )
                  }
                  className="input-field"
                />

              </div>
              </div>
              
              <div className='form-section'>
                  <div className="form-group">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  value={albumLocation}
                  onChange={(e) =>
                    setAlbumLocation(
                      e.target.value
                    )
                  }
                  className="input-field"
                />

              </div>
              </div>
              <h3 className="section-title">
                Privacy & Upload Settings
              </h3>
              
              <div className='form-section'>
                <div className="form-group">

                <label>
                  Access Type
                </label>

                <div className="access-options">

                  <label
                    className={`access-card ${
                      accessType === "private"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value="private"
                      checked={accessType === "private"}
                      onChange={() =>
                        setAccessType("private")
                      }
                    />

                    <div>

                      <h4>🔒 Private Album</h4>
                      <p>Personalized viewing only.</p>
                      <p>
                        Members can see photos that contain them using face search.
                      </p>

                    </div>

                  </label>

                  <label
                    className={`access-card ${
                      accessType === "public"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value="public"
                      checked={accessType === "public"}
                      onChange={() =>
                        setAccessType("public")
                      }
                    />

                    <div>

                      <h4>🌍 Public Album</h4>
                      <p>Full album access.</p>

                      <p>
                        Members can browse all event photos and use face search.
                      </p>

                    </div>

                  </label>

                </div>
                  

              </div>
              </div>
              
              <div className='form-section'>
                    <div className="form-group">

                <label>
                  Upload Permission
                </label>

                <div className="upload-options">

                <label
                    className={`upload-card ${
                      uploadPermission === "owner_only"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value="owner_only"
                      checked={
                        uploadPermission === "owner_only"
                      }
                      onChange={() =>
                        setUploadPermission(
                          "owner_only"
                        )
                      }
                    />

                    <div>
                      <h4>👑 Owner Only</h4>

                      <p>
                        Only the album owner can upload
                        photos.
                      </p>
                    </div>
                  </label>
                      <label
                    className={`upload-card ${
                      uploadPermission === "owner_and_admins_only"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value="owner_and_admins_only"
                      checked={
                        uploadPermission === "owner_and_admins_only"
                      }
                      onChange={() =>
                        setUploadPermission(
                          "owner_and_admins_only"
                        )
                      }
                    />

                    <div>
                      <h4>👑 Owner and Admins Only</h4>

                      <p>
                        Only the album owner and admins can upload
                        photos.
                      </p>
                    </div>
                  </label>
                  <label
                  className={`upload-card ${
                    uploadPermission === "all_members"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    value="all_members"
                    checked={
                      uploadPermission === "all_members"
                    }
                    onChange={() =>
                      setUploadPermission(
                        "all_members"
                      )
                    }
                  />

                  <div>
                    <h4>👥 All Members</h4>

                    <p>
                      Anyone in the album can upload
                      photos.
                    </p>
                  </div>
                </label>

               <label
                  className={`upload-card ${
                    uploadPermission === "selected_members"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    value="selected_members"
                    checked={
                      uploadPermission === "selected_members"
                    }
                    onChange={() =>
                      setUploadPermission(
                        "selected_members"
                      )
                    }
                  />


                  <div>
                    <h4>⭐ Selected Members</h4>

                    <p>
                      Owner chooses specific uploaders.
                    </p>
                    {uploadPermission === "selected_members" && (
                      <div className="upload-card-note">
                          💡 Configure uploaders later in Album Settings after members join.
                      </div>
                  )}
                  </div>
                </label>
              </div>

              </div>
              </div>
              <div className="album-create-note">

  <h4>ℹ️ Before you create the album</h4>

  <div className="album-note-item">

    <span>✅ You can edit later</span>

    <p>
      Album name, cover photo, location and upload permissions.
    </p>

  </div>

  <div className="album-note-item">

    <span>🔒 Cannot be changed later</span>

    <p>
      Album visibility (Public / Private) is permanent once the album is created.
    </p>

  </div>

</div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    setShowCreateAlbumModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-save"
                >
                  Create Album
                </button>

              </div>

            </form>

          </div>

        </div>
      )
    }
      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? 'show' : ''} ${toastType}`}>
        {
          toastType === "success" ? (

            <svg
              className="toast-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>

          ) : (

            <svg
              className="toast-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>

          )
        }
        <span>{toastMessage}</span>
      </div>
      {showJoinModal && (

    <div className="modal-overlay">

        <div className="join-modal">

            <h2>Join Album</h2>

            <p>
                Enter the invite code shared with you.
            </p>

            <input
                type="text"
                placeholder="Invite Code"
                className="input-field"
                maxLength={6}
                value={inviteCode}
                onChange={(e)=>
                    setInviteCode(
                        e.target.value.toUpperCase()
                    )
                }
            />

            <div className="modal-actions">

                <button
                  className="btn-cancel"
                    onClick={() =>
                        setShowJoinModal(false)
                    }
                >
                    Cancel
                </button>

                <button
                  className="btn-save"
                    onClick={joinAlbum}
                >
                    Join Album
                </button>

            </div>

        </div>

    </div>

)}
    </div>
  );
}
