import "./AlbumTabs.css";

function AlbumTabs({
    role,
    activeTab,
    setActiveTab,
    settings,
    fetchSettings,
    hasUnsavedChanges
}) {
    return (
       <div className="albumpg-tabs">

            <button
                className={activeTab==="photos"
                    ? "albumpg-tab-active"
                    : ""}
                onClick={()=>setActiveTab("photos")}
            >
                Photos
            </button>

            
                <button
                    className={activeTab==="members"
                        ? "albumpg-tab-active"
                        : ""}
                    onClick={()=>setActiveTab("members")}
                >
                    Members
                </button>

            {role === "owner" && (
                <button
                    className={activeTab==="settings"
                        ? "albumpg-tab-active"
                        : ""}
                    onClick={() => {

                      setActiveTab("settings");

                      if(!settings)
                      {
                        fetchSettings();
                      }

                    }}
                >
                    Settings
                    {hasUnsavedChanges &&
                    (
                        <span className="settings-unsaved-dot"></span>
                    )
                    }
                </button>
                
            )}

        </div>
    );
}

export default AlbumTabs;