import "./AlbumDetails.css"
import defaultAlbumCover from "../../assets/DefaultAlbumCover.png";

function AlbumDetails({
    settings,
    setCoverFile,
    setSettings,
    setHasUnsavedChanges
})
{
    return(
        <>
            <div className="album-settings-card">

            <h3>Album Details</h3>

            <div className="settings-form-group">
            <label>Album Cover</label>

            <img
                src={settings?.album_cover || defaultAlbumCover}
                className="settings-cover-preview"
            />

            <input
                type="file"
                accept="image/*"
                onChange={(e)=>{

                    const file = e.target.files[0];

                    if(!file) return;

                    setCoverFile(file);

                    const reader = new FileReader();

                    reader.onloadend = () => {

                        setSettings(prev => ({
                            ...prev,
                            album_cover: reader.result
                        }));
                        setHasUnsavedChanges(true);

};

reader.readAsDataURL(file);

                }}
            />
            </div>

            <div className="settings-form-group">

                <label>Album Name</label>

                <input
            type="text"
            value={settings?.album_name || ""}
            onChange={(e)=>{
                setSettings({
                ...settings,
                album_name:e.target.value
                })
                setHasUnsavedChanges(true);
            }
                
                
            }
            />

            </div>

            <div className="settings-form-group">

                <label>Location</label>

                <input
                type="text"
                value={settings?.location || ""}
                onChange={(e)=>{
                    setSettings({
                    ...settings,
                    location:e.target.value
                    });
                    setHasUnsavedChanges(true);
                }}
                />

            </div>

            </div>
        </>
    )
}

export default AlbumDetails;