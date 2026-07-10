import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AlbumHeader from "../components/Album/AlbumHeader";
import AlbumTabs from "../components/Album/AlbumTabs";
import PhotoSection from "../components/PhotoSection/PhotoSection";
import MembersSection from "../components/MembersSection/MembersSection";
import SettingsSection from "../components/SettingsSection/SettingsSection";
import "./AlbumPage.css";

const API_URL = "http://localhost:5000";

function AlbumPage() {
    const navigate = useNavigate();

    const { albumId } = useParams();

    const [album,setAlbum] = useState(null);

    const [activeTab,setActiveTab] = useState("photos");

    const [members,setMembers] = useState([]);


    const [activeInvite,setActiveInvite] = useState(null);

    const [hasActiveInvite,setHasActiveInvite] = useState(false);

    const [timeRemaining,setTimeRemaining] = useState("");

    const [toastMessage,setToastMessage] = useState("");
    const [toastType,setToastType] = useState("success");
    const [showToast,setShowToast] = useState(false);

    const [settings, setSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


    const [photos,setPhotos] = useState([]);
    const [canUpload,setCanUpload] = useState(false);

    const [uploadMembers,setUploadMembers] = useState([]);

    const [selectedUploadMembers,setSelectedUploadMembers] = useState([]);

    const [photoView,setPhotoView] = useState("all");

    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const [selectedPhotoIndex,setSelectedPhotoIndex] = useState(null);

    const [uploaderSearch, setUploaderSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    const [searchReason, setSearchReason] = useState(null);
    const [newPhotoCount, setNewPhotoCount] = useState(0);
    const [matchedPhotos, setMatchedPhotos] = useState([]);

    const [faceProfile, setFaceProfile] = useState(null);
   
    const [faceRegistered, setFaceRegistered] = useState(false);
    const [totalPhotoCount, setTotalPhotoCount] = useState(0);
    
    const fetchFaceProfile = async () => {

    try{

        const token = localStorage.getItem("token");

        const response = await axios.get(
            "http://localhost:5000/api/face-search/my-face",
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        setFaceProfile(response.data);
        setFaceRegistered(response.data.registered);

    }
    catch(err){

        console.error(err);

    }

};

    const fetchNewFacePhotos = async () => {

    try {

        const token = localStorage.getItem("token");

        const response = await axios.get(
            `http://localhost:5000/api/face-search/${albumId}/new-face-photos`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setTotalPhotoCount(
            response.data.totalPhotoCount
        );
        setFaceRegistered(
            response.data.faceRegistered
        );
        setNewPhotoCount(
            response.data.newPhotoCount
        );

        setSearchReason(
            response.data.searchReason
        );

    }
    catch(err){

        console.error(err);

    }

};

    

    const fetchUploadPermission = async () => {

    try {

        const token = localStorage.getItem("token");

        const response = await axios.get(
            `${API_URL}/api/albums/${albumId}/upload-permission`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        setCanUpload(
            response.data.canUpload
        );

    }
    catch(error)
    {
        console.error(error);
    }

};
const fetchUploadMembers = async () => {

    try {

        const token = localStorage.getItem("token");

        const response =
        await axios.get(
            `${API_URL}/api/albums/${albumId}/upload-members`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        setUploadMembers(
            response.data.members
        );

        setSelectedUploadMembers(
            response.data.members
            .filter(member => member.can_upload)
            .map(member => member.user_id)
        );

    }
    catch(error)
    {
        console.error(error);
    }

};


    const fetchPhotos = async () => {

    try {

        const token = localStorage.getItem("token");

        const response = await axios.get(
            `${API_URL}/api/albums/${albumId}/photos`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );
        response.data.photos.forEach(photo => {
            console.log(photo.id, photo.face_indexed);
        });
        setPhotos(response.data.photos);

    }
    catch(error)
    {
        console.error(error);
    }

};


const showPreviousPhoto = () => {

    if (selectedPhotoIndex === 0)
        return;

    const prevIndex = selectedPhotoIndex - 1;

    const prevPhoto = currentGallery[prevIndex];

    if (photoView === "facesearch") {

        const fullPhoto =
            photos.find(p => p.id === prevPhoto.id);

        setSelectedPhoto(fullPhoto || prevPhoto);

    } else {

        setSelectedPhoto(prevPhoto);

    }

    setSelectedPhotoIndex(prevIndex);

};

const showNextPhoto = () => {

    if (selectedPhotoIndex >= currentGallery.length - 1)
        return;

    const nextIndex = selectedPhotoIndex + 1;

    const nextPhoto = currentGallery[nextIndex];

    if (photoView === "facesearch") {

        const fullPhoto =
            photos.find(p => p.id === nextPhoto.id);

        setSelectedPhoto(fullPhoto || nextPhoto);
    } else {

        setSelectedPhoto(nextPhoto);

    }
    setSelectedPhotoIndex(nextIndex);

};

    const fetchSettings = async () => {

  try {

    setSettingsLoading(true);

    const token = localStorage.getItem("token");

    const response = await axios.get(
      `${API_URL}/api/albums/${albumId}/settings`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    setSettings(response.data.settings);

  }
  catch(error)
  {
    console.error(error);
  }
  finally
  {
    setSettingsLoading(false);
  }

};

    const triggerToast = (
    message,
    type = "success"
) => {

    setToastMessage(message);
    setToastType(type);

    setShowToast(true);

    setTimeout(() => {
        setShowToast(false);
    },3000);

};
const token = localStorage.getItem("token");

const currentUserId = token
  ? JSON.parse(atob(token.split(".")[1])).userId
  : null;
useEffect(() => {

    if (photoView === "facesearch") {

        loadMatchedPhotos();

    }

}, [photoView]);


    useEffect(() => {
        fetchAlbum();
        fetchPhotos();
        fetchNewFacePhotos();
        fetchMembers();
        fetchUploadPermission();
        fetchNewFacePhotos();
        fetchFaceProfile();
    }, []);
    useEffect(() => {

    const handleAlbumUpdated = async () => {

        await fetchAlbum();
        await fetchSettings();
    };

const handleUploadMembersUpdated = async () => {

    // Everyone refreshes their upload permission
    await fetchUploadPermission();

    // Only the owner refreshes the Configure Members list
    if (role === "owner") {
        await fetchUploadMembers();
    }

};

const handleAlbumDeleted = () => {

    triggerToast(
        "This album has been deleted by the owner.",
        "error"
    );

    setTimeout(() => {

        navigate("/dashboard");

    },3000);

};

const handlePhotosUploaded = async ({
    userId,
    fullName,
    photoCount
}) => {

    await fetchPhotos();
    await fetchAlbum();
    await fetchNewFacePhotos();

    if (userId !== currentUserId) {

        triggerToast(
            `📸 ${fullName} uploaded ${photoCount} photo${photoCount > 1 ? "s" : ""}.`,
            "success"
        );

    }

};
const handlePhotosDeleted = async ({
    userId,
    fullName,
    photoCount,
    photoIds
}) => {

    await fetchPhotos();
    await fetchAlbum();
    await fetchNewFacePhotos();

    setMatchedPhotos(prev =>
        prev.filter(photo => !photoIds.includes(photo.id))
    );
    // if (photoView === "facesearch") {
    //     await loadMatchedPhotos();
    // }


    if (userId !== currentUserId) {

        triggerToast(
            `🗑 ${fullName} deleted ${photoCount} photo${photoCount > 1 ? "s" : ""}.`,
            "success"
        );

    }

};
const handleMemberJoined = async ({
    userId,
    fullName
}) => {

    await fetchMembers();
    await fetchAlbum();

    if (Number(userId) !== Number(currentUserId)) {

        triggerToast(
            `👋 ${fullName} joined the album.`,
            "success"
        );

    }

};
const handleMemberLeft = async ({
    userId,
    fullName
}) => {

    await fetchMembers();
    await fetchAlbum();

    if (Number(userId) !== Number(currentUserId)) {

        triggerToast(
            `👋 ${fullName} left the album.`,
            "success"
        );

    }

};
const handleMemberRoleUpdated = async ({
    userId,
    fullName,
    newRole
}) => {

    await fetchMembers();
    await fetchAlbum();

    if (Number(userId) === Number(currentUserId)) {

        triggerToast(
            `Your role has been changed to ${newRole}.`,
            "success"
        );

    }

};
const handleMemberRemoved = async ({
    userId,
    fullName
}) => {

    await fetchMembers();
    await fetchAlbum();

    if (Number(userId) === Number(currentUserId)) {

        triggerToast(
            "You have been removed from this album.",
            "error"
        );

        setTimeout(() => {
            navigate("/dashboard");
        }, 1500);

        return;
    }

    triggerToast(
        `🚪 ${fullName} was removed from the album.`,
        "success"
    );

};

    socket.on("albumUpdated",handleAlbumUpdated);
    socket.on("uploadMembersUpdated",handleUploadMembersUpdated);
    socket.on("albumDeleted",handleAlbumDeleted);
    socket.on("photosUploaded",handlePhotosUploaded);
    socket.on("photosDeleted",handlePhotosDeleted);
    socket.on("memberJoined", handleMemberJoined);
    socket.on("memberLeft",handleMemberLeft);
    socket.on("memberRoleUpdated", handleMemberRoleUpdated);
    socket.on("memberRemoved", handleMemberRemoved);
    return () => {

        socket.off("albumDeleted",handleAlbumDeleted);
        socket.off("uploadMembersUpdated",handleUploadMembersUpdated);
        socket.off("albumUpdated",handleAlbumUpdated);
        socket.off("photosUploaded",handlePhotosUploaded);
        socket.off("photosDeleted",handlePhotosDeleted);
        socket.off("memberJoined",handleMemberJoined);
        socket.off("memberLeft",handleMemberLeft);
        socket.off("memberRoleUpdated", handleMemberRoleUpdated);
        socket.off("memberRemoved", handleMemberRemoved);
    };
    

}, [albumId]);
    useEffect(() => {

    socket.emit("joinAlbum", {
        albumId
    });

    return () => {

        socket.emit("leaveAlbum", {
            albumId
        });

    };

}, [albumId]);

    useEffect(() => {

    const handleFaceIndexReady = async ({ albumId: receivedAlbumId }) => {

        if (Number(receivedAlbumId) !== Number(albumId))
            return;

        await fetchAlbum();
        await fetchPhotos();
        await fetchNewFacePhotos();
        triggerToast(
        "Face indexing completed! You can now use Face Search.",
        "success"
        );

    };

    socket.on(
        "faceIndexReady",
        handleFaceIndexReady
    );
    socket.on(
    "photoIndexed",
    ({ albumId: receivedAlbumId, photoId }) => {

        if (Number(receivedAlbumId) !== Number(albumId))
            return;

        setPhotos(prev =>
            prev.map(photo =>
                photo.id === photoId
                    ? {
                        ...photo,
                        face_indexed: true
                    }
                    : photo
            )
        );

        setMatchedPhotos(prev =>
            prev.map(photo =>
                photo.id === photoId
                    ? {
                        ...photo,
                        face_indexed: true
                    }
                    : photo
            )
        );

    }
);
    return () => {

        socket.off(
            "faceIndexReady",
            handleFaceIndexReady
        );

    };

}, [albumId]);
useEffect(() => {
    if (
        activeTab === "settings" &&
        settings?.upload_permission === "selected_members"
    ) {
        fetchUploadMembers();
    }
}, [activeTab, settings?.upload_permission]);
useEffect(() => {

    if (!currentUserId)
        return;

    socket.emit("registerUser", {
        userId: currentUserId
    });

}, [currentUserId]);
useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e) => {
        switch (e.key) {
            case "ArrowRight":
                showNextPhoto();
                break;

            case "ArrowLeft":
                showPreviousPhoto();
                break;

            case "Escape":
                setSelectedPhoto(null);
                break;

            default:
                break;
        }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
    };
}, [selectedPhoto]);

    useEffect(() => {

    if(!activeInvite) return;

    const interval = setInterval(() => {

        const expiry =
            new Date(
                activeInvite.expires_at
            );

        const now = new Date();

        const diff =
            expiry - now;

        if(diff <= 0)
        {
            setTimeRemaining("Expired");

            clearInterval(interval);

            fetchActiveInvite();

            return;
        }

        const days =
            Math.floor(
                diff / (1000*60*60*24)
            );

        const hours =
            Math.floor(
                (diff % (1000*60*60*24))
                /
                (1000*60*60)
            );

        const minutes =
            Math.floor(
                (diff % (1000*60*60))
                /
                (1000*60)
            );

        const seconds =
            Math.floor(
                (diff % (1000*60))
                /
                1000
            );

        setTimeRemaining(
            `${days}d ${hours}h ${minutes}m ${seconds}s`
        );

    },1000);

    return () => clearInterval(interval);

},[activeInvite]);
    

    const fetchActiveInvite = async () => {

    try {

        const token =
            localStorage.getItem("token");

        const response =
        await axios.get(
            `http://localhost:5000/api/albums/${albumId}/invite`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        if(response.data.hasActiveInvite)
        {
            setHasActiveInvite(true);
            setActiveInvite(response.data.invite);
        }
        else
        {
            setHasActiveInvite(false);
            setActiveInvite(null);
        }

    }
    catch(error)
    {
        console.error(error);
    }
};

    const fetchAlbum = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/albums/${albumId}`,
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            );
            console.log("Album fetched:", response.data.album);

            setAlbum(response.data.album);

        }
        catch(error)
        {
            console.error(error);
        }
    };

    const fetchMembers = async () => {

    try {

        const token =
            localStorage.getItem("token");

        const response = await axios.get(
            `http://localhost:5000/api/albums/${albumId}/members`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        setMembers(
            response.data.members
        );

    }
    catch(error)
    {
        console.error(error);
    }
};
    if(!album)
    {
        return <div>Loading...</div>;
    }

    const role = album.role || "viewer";

    const canManageMembers =
  role === "owner" || role === "admin";
  


const displayedPhotos =
    photoView === "uploads"
    ? photos.filter(
        photo => Number(photo.uploaded_by) === Number(currentUserId)
      )
    : photos;

let filteredPhotos = [...displayedPhotos];
if (
    photoView === "all" &&
    uploaderSearch.trim() !== ""
)
{
    filteredPhotos = filteredPhotos.filter(photo =>
        photo.full_name
            .toLowerCase()
            .includes(
                uploaderSearch.toLowerCase()
            )
    );
}
const currentGallery =
    photoView === "facesearch"
        ? matchedPhotos
        : filteredPhotos

if(dateFilter !== "all")
{
    const now = new Date();

    filteredPhotos = filteredPhotos.filter(photo => {

        const uploadDate =
        new Date(photo.uploaded_at);

        const diffDays =
        (now - uploadDate) /
        (1000 * 60 * 60 * 24);

        if (dateFilter === "today") {
            return uploadDate.toDateString() === now.toDateString();
        }

        if(dateFilter === "7days")
        {
            return diffDays <= 7;
        }

        if(dateFilter === "30days")
        {
            return diffDays <= 30;
        }

        if(dateFilter === "year")
        {
            return (
                uploadDate.getFullYear() ===
                now.getFullYear()
            );
        }

        return true;
    });
}
filteredPhotos.sort((a,b) => {

    if(sortOrder === "newest")
    {
        return (
            new Date(b.uploaded_at) -
            new Date(a.uploaded_at)
        );
    }

    return (
        new Date(a.uploaded_at) -
        new Date(b.uploaded_at)
    );

});

const loadMatchedPhotos = async () => {

    try {

        const response = await axios.get(
        `${API_URL}/api/face-search/${albumId}/my-photos`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

        setMatchedPhotos(response.data.photos);
        console.log("Matched photos:", response.data.photos.length);
        console.log("Current searchReason:", searchReason);

    }
    catch(err)
    {
        console.error(err);
    }

};

let bannerTitle = "";
let bannerMessage = "";

switch (searchReason) {

    case "firstSearch":
        bannerTitle = "🔍 Find Your Photos";
        bannerMessage =
            "You've registered your face. Search this album to find every photo you're in.";
        break;

    case "newPhotos":
        bannerTitle = "📸 New Photos Available";
        bannerMessage =
            `${newPhotoCount} new photo${newPhotoCount !== 1 ? "s are" : " is"} waiting to be searched.`;
        break;

    case "newFace":
        bannerTitle = "✨ Face Updated";
        bannerMessage =
            "Your face profile has been updated. Search the album again to refresh your results.";
        break;

    case "both":
        bannerTitle = "📸 Album Updated";
        bannerMessage =
            `${newPhotoCount} new photo${newPhotoCount !== 1 ? "s have" : " has"} been uploaded and your face profile was updated. Search again to refresh your results.`;
        break;

    default:
        break;

}

    return (
    <div className="albumpg-page">

        <AlbumHeader
            album={album}
            role={role}
            API_URL={API_URL}
            albumId={albumId}
            triggerToast={triggerToast}
            
        />

        <AlbumTabs
            role={role}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            settings={settings}
            fetchSettings={fetchSettings}
            hasUnsavedChanges={hasUnsavedChanges}
        />

       

        <div className="albumpg-content">

            {activeTab==="photos" && (

                <div>

                    <PhotoSection
                    role={role}
                    album={album}
                    albumId={albumId}
                    canUpload={canUpload}
                    triggerToast={triggerToast}
                    fetchPhotos={fetchPhotos}
                    fetchAlbum={fetchAlbum}
                    fetchNewFacePhotos={fetchNewFacePhotos}
                    setPhotos={setPhotos}
                    setAlbum={setAlbum}
                    photoView={photoView}
                    setPhotoView={setPhotoView}
                    uploaderSearch={uploaderSearch}
                    setUploaderSearch={setUploaderSearch}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    faceRegistered={faceRegistered}
                    searchReason={searchReason}
                    bannerTitle={bannerTitle}
                    bannerMessage={bannerMessage}
                    loadMatchedPhotos={loadMatchedPhotos}
                    faceProfile={faceProfile}
                    totalPhotoCount={totalPhotoCount}
                    matchedPhotos={matchedPhotos}
                    photos={photos}
                    filteredPhotos={filteredPhotos}
                    currentUserId={currentUserId}
                    setSelectedPhoto={setSelectedPhoto}
                    setSelectedPhotoIndex={setSelectedPhotoIndex}
                    selectedPhoto={selectedPhoto}
                    selectedPhotoIndex={selectedPhotoIndex}
                    showPreviousPhoto={showPreviousPhoto}
                    currentGallery={currentGallery}
                    showNextPhoto={showNextPhoto}
                    fetchFaceProfile={fetchFaceProfile}
                    API_URL={API_URL}
                    token={token}
                    />

                </div>

            )}

            {activeTab==="members" && (

    <div>
        <MembersSection
            members = {members}
            role = {role}
            fetchActiveInvite={fetchActiveInvite}
            currentUserId={currentUserId}
            fetchMembers={fetchMembers}
            albumId={albumId}
            triggerToast={triggerToast}
            hasActiveInvite={hasActiveInvite}
            activeInvite={activeInvite}
            timeRemaining={timeRemaining}
        />

    </div>

)}

           {activeTab==="settings" && (

    <div>
        <SettingsSection
            hasUnsavedChanges={hasUnsavedChanges}
            settings={settings}
            setSettings={setSettings}
            setHasUnsavedChanges={setHasUnsavedChanges}
            selectedUploadMembers={selectedUploadMembers}
            fetchUploadMembers={fetchUploadMembers}
            setSelectedUploadMembers={setSelectedUploadMembers}
            API_URL={API_URL}
            albumId={albumId}
            triggerToast={triggerToast}
            uploadMembers={uploadMembers}
            fetchAlbum={fetchAlbum}
            fetchNewFacePhotos={fetchNewFacePhotos}
            fetchSettings={fetchSettings}

        />
    </div>

    )}

    </div>
           
<div
    className={`toast-notification ${
        showToast ? "show" : ""
    } ${toastType}`}
>
    <span className="toast-icon">
        {toastType === "success" ? "✓" : "⚠"}
    </span>

    <span>
        {toastMessage}
    </span>
</div>
</div>


);

}

export default AlbumPage;