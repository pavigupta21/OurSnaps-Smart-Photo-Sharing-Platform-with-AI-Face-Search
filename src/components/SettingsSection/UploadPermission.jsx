import "./UploadPermission.css"

function UploadPermission({
    settings,
    setSettings,
    setHasUnsavedChanges,
    selectedUploadMembers,
    fetchUploadMembers,
    uploadMembers,
    setShowNoMembersPopup,
    setShowUploadMembersModal,
    showNoMembersPopup,
    showUploadMembersModal,
    uploadMemberSearch,
    setUploadMemberSearch,
    filteredUploadMembers,
    setSelectedUploadMembers,
    saveUploadMembers
})
{
    return(
        <>
            <div className="album-settings-card settings-section-card">
        <h3>Upload Permissions</h3>

        <div className="settings-radio-group">

            <label className="settings-radio-option">
            <input
                type="radio"
                value="owner_only"
                checked={settings?.upload_permission==="owner_only"}
                onChange={(e)=>{
                    setSettings({
                    ...settings,
                    upload_permission:e.target.value
                })
                setHasUnsavedChanges(true);
                }
                
                }
            />
            <div>
                <strong>Owner Only</strong>
                <p>Only album owner can upload photos.</p>
            </div>
            </label>

            <label className="settings-radio-option">
            <input
                type="radio"
                value="owner_and_admins_only"
                checked={settings?.upload_permission==="owner_and_admins_only"}
                onChange={(e)=>{
                    setSettings({
                    ...settings,
                    upload_permission:e.target.value
                })
                setHasUnsavedChanges(true);
                }
                
                }
            />
            <div>
                <strong>Owner and Admins Only</strong>
                <p>Owner and admins can upload photos.</p>
            </div>
            </label>

            <label className="settings-radio-option">
            <input
                type="radio"
                value="all_members"
                checked={settings?.upload_permission==="all_members"}
                onChange={(e)=>{
                    setSettings({
                    ...settings,
                    upload_permission:e.target.value
                })
                setHasUnsavedChanges(true);
                }
                
                }
            />
            <div>
                <strong>All Members</strong>
                <p>Everyone in the album can upload photos.</p>
            </div>
            </label>

            <label className="settings-radio-option">
            <input
                type="radio"
                value="selected_members"
                checked={settings?.upload_permission==="selected_members"}
                onChange={(e)=>{
                    setSettings({
                    ...settings,
                    upload_permission:e.target.value
                })
                setHasUnsavedChanges(true);
                }
                
                }
            />
            <div className="settings-option-body">
                <strong>Selected Members</strong>
                <p>Choose exactly who can upload photos.</p>
                {settings?.upload_permission === "selected_members" && (

    <div className="selected-members-settings">

        <div className="selected-members-note">
            💡 {selectedUploadMembers.length} member
            {selectedUploadMembers.length !== 1 ? "s" : ""}
            {" "}currently have upload permission.
        </div>

        <button
            className="configure-upload-members-btn"
            onClick={async () => {

                await fetchUploadMembers();
                {

                    if(uploadMembers.length === 0)
                    {
                        setShowNoMembersPopup(true);
                    }
                    else
                    {
                        setShowUploadMembersModal(true);
                    }

                }

            }}
        >
            Configure Members ({selectedUploadMembers.length})
        </button>

    </div>

)}
            </div>
           
            </label>

        </div>
        </div>
        {showNoMembersPopup && (

<div
    className="modal-overlay"
    onClick={() => setShowNoMembersPopup(false)}
>

    <div
        className="small-info-modal"
        onClick={(e)=>e.stopPropagation()}
    >

        <div className="small-info-icon">
            👥
        </div>

        <h3>No Members Yet</h3>

        <p>
            There are no members available to grant upload permission.
            Invite members to this album first. Once they join,
            you'll be able to choose who can upload photos.
        </p>

        <button
            className="albumpg-primary-btn"
            onClick={() => setShowNoMembersPopup(false)}
        >
            Got it
        </button>

    </div>

</div>

)}
{
    showUploadMembersModal &&
    (
        <div className="modal-overlay">

            <div className="upload-members-modal">

                <h2>
                    Select Upload Members
                </h2>

                <p>
                    Choose who can upload photos.
                </p>
                
                <input
                type="text"
                className="upload-member-search"
                placeholder="🔍 Search members..."
                value={uploadMemberSearch}
                onChange={(e) =>
                    setUploadMemberSearch(e.target.value)
                }
            />

                {   
                    <div className="upload-members-list">

    {filteredUploadMembers.map((member) => (

        <label
            key={member.user_id}
            className="upload-member-item"
        >

            <input
                type="checkbox"
                checked={selectedUploadMembers.includes(member.user_id)}
                onChange={(e) => {

                    if(e.target.checked)
                    {
                        setSelectedUploadMembers(prev => [
                            ...prev,
                            member.user_id
                        ]);
                    }
                    else
                    {
                        setSelectedUploadMembers(prev =>
                            prev.filter(
                                id => id !== member.user_id
                            )
                        );
                    }

                }}
            />

            <div className="upload-member-info">

    {member.profile_pic ? (
        <img
            src={member.profile_pic}
            alt={member.full_name}
            className="upload-member-avatar"
        />
    ) : (
        <div className="upload-member-avatar-fallback">
            {member.full_name.charAt(0).toUpperCase()}
        </div>
    )}

    <div className="upload-member-details">
        <div className="upload-member-name">
            {member.full_name}
        </div>

        <div className="upload-member-role">
            {member.role === "owner"
                ? "👑 Owner"
                : member.role === "admin"
                ? "🛡️ Admin"
                : "👤 Viewer"}
        </div>
    </div>

</div>

        </label>

    ))}

</div>
                    
                }

                <div
                    style={{
                        display:"flex",
                        gap:"12px",
                        marginTop:"20px"
                    }}
                >

                    <button
                        onClick={() =>
                            setShowUploadMembersModal(false)
                        }
                        className="btn-cancel"
                    >
                        Cancel
                    </button>

                    <button onClick={saveUploadMembers}
                        className="btn-save"
                    >
                        Save
                    </button>

                </div>

            </div>

        </div>
    )
}
        </>
    )
}

export default UploadPermission;