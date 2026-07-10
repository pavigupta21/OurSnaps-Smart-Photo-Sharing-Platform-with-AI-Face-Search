import "./SaveSettings.css";

function SaveSettings({
    hasUnsavedChanges,
    saveSettings,
    savingSettings
}) {
    return (
        <>
            <div className="settings-save-bar">
            <button
                className="save-settings-btn"
                disabled={!hasUnsavedChanges}
                onClick={saveSettings}
            >
                {savingSettings ? "Saving..." : "Save Changes"}
            </button>
        </div>
        </>
    );
}

export default SaveSettings;