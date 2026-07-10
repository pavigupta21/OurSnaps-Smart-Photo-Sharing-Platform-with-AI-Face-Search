import "./SettingsSection.css"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import SettingsHeader from "./SettingsHeader"
import AlbumDetails from "./AlbumDetails"
import UploadPermission from "./UploadPermission"
import SaveSettings from "./SaveSettings"
import DangerZone from "./DangerZone"

function SettingsSection({
    hasUnsavedChanges,
    settings,
    setSettings,
    setHasUnsavedChanges,
    selectedUploadMembers,
    fetchUploadMembers,
    setSelectedUploadMembers,
    API_URL,
    albumId,
    triggerToast,
    uploadMembers,
    fetchAlbum,
    fetchNewFacePhotos,
    fetchSettings
})
{   
    const navigate = useNavigate();
    /*AlbumDetails*/
    const [coverFile,setCoverFile] = useState(null);
    /*UploadPermission*/
    const [showNoMembersPopup, setShowNoMembersPopup] = useState(false);
    const [showUploadMembersModal,setShowUploadMembersModal] = useState(false);
    const [uploadMemberSearch, setUploadMemberSearch] = useState("");

    /*SaveSettings*/
    const [savingSettings, setSavingSettings] = useState(false);

    /*DangerZone*/
    const [deletingAlbum,setDeletingAlbum] = useState(false);
    const [showDeleteAlbumModal,setShowDeleteAlbumModal] = useState(false);
    const saveSettings = async () => {

    if(!settings.album_name.trim())
{
    triggerToast(
        "Album name cannot be empty",
        "error"
    );
    return;
}
  try {

    setSavingSettings(true);

    const token = localStorage.getItem("token");

    const response = await axios.patch(
      `${API_URL}/api/albums/${albumId}/settings`,
      {
        album_name: settings.album_name,
        location: settings.location,
        upload_permission: settings.upload_permission,
        album_cover: settings.album_cover
      },
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    triggerToast(
      response.data.message || "Settings saved successfully",
      "success"
    );
    setHasUnsavedChanges(false);

    await fetchAlbum();
    await fetchNewFacePhotos();
    await fetchSettings();

  }
  catch(error)
  {
    console.error(error);

    triggerToast(
      error.response?.data?.message ||
      "Failed to save settings",
      "error"
    );
  }
  finally
  {
    setSavingSettings(false);
  }

};

    const filteredUploadMembers = uploadMembers.filter((member) =>
    member.full_name
        .toLowerCase()
        .includes(uploadMemberSearch.toLowerCase())
);
const saveUploadMembers = async () => {

    try {

        const token = localStorage.getItem("token");

        await axios.post(
            `${API_URL}/api/albums/${albumId}/upload-members`,
            {
                memberIds:selectedUploadMembers
            },
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        triggerToast(
            "Upload members updated successfully",
            "success"
        );

        setShowUploadMembersModal(false);

    }
    catch(error)
    {
        console.error(error);

        triggerToast(
            error.response?.data?.message ||
            "Failed to update upload members",
            "error"
        );
    }
};
const deleteAlbum = async () => {

    try {

        setDeletingAlbum(true);

        const token = localStorage.getItem("token");

        const response = await axios.delete(
            `${API_URL}/api/albums/${albumId}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        triggerToast(
            response.data.message || "Album deleted successfully",
            "success"
        );
        
        setShowDeleteAlbumModal(false);
        
        setDeletingAlbum(false);
        

        setTimeout(() => {
            navigate("/dashboard");
        }, 1500);
        

    }
    catch(error)
    {
        console.error(error);

        triggerToast(
            error.response?.data?.message ||
            "Failed to delete album",
            "error"
        );
    }
    
};
    return(
        <>
            <SettingsHeader
                hasUnsavedChanges={hasUnsavedChanges}
            />
            <div className="albumpg-empty-card">
                <AlbumDetails
                    settings={settings}
                    setCoverFile={setCoverFile}
                    setSettings={setSettings}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                />
                <UploadPermission
                    settings={settings}
                    setSettings={setSettings}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                    selectedUploadMembers={selectedUploadMembers}
                    fetchUploadMembers={fetchUploadMembers}
                    uploadMembers={uploadMembers}
                    setShowNoMembersPopup={setShowNoMembersPopup}
                    setShowUploadMembersModal={setShowUploadMembersModal}
                    showNoMembersPopup={showNoMembersPopup}
                    showUploadMembersModal={showUploadMembersModal}
                    uploadMemberSearch={uploadMemberSearch}
                    setUploadMemberSearch={setUploadMemberSearch}
                    filteredUploadMembers={filteredUploadMembers}
                    setSelectedUploadMembers={setSelectedUploadMembers}
                    saveUploadMembers={saveUploadMembers}
                />
                <SaveSettings
                    hasUnsavedChanges={hasUnsavedChanges}
                    saveSettings={saveSettings}
                    savingSettings={savingSettings}
                />
                <DangerZone
                    setShowDeleteAlbumModal={setShowDeleteAlbumModal}
                    showDeleteAlbumModal={showDeleteAlbumModal}
                    deletingAlbum={deletingAlbum}
                    deleteAlbum={deleteAlbum}
                />
            </div>
        </>
    )
}
export default SettingsSection