import "./SettingsHeader.css"

function SettingsHeader({
    hasUnsavedChanges
})
{
    return(
        <>
        <h2>Album Settings</h2>
              {
                    hasUnsavedChanges && (
                        <div className="unsaved-settings">
                            <span className="settings-unsaved-dot"></span>
                            You have unsaved changes.
                        </div>
                    )
                }
    </>
    )
    
}
export default SettingsHeader;