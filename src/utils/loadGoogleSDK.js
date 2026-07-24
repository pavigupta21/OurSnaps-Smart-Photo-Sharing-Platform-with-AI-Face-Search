export const loadGoogleSDK = () => {
    return new Promise((resolve, reject) => {

        if (window.google && window.gapi) {
            resolve();
            return;
        }

        const gisScript = document.createElement("script");
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.defer = true;

        const pickerScript = document.createElement("script");
        pickerScript.src = "https://apis.google.com/js/api.js";
        pickerScript.async = true;
        pickerScript.defer = true;

        let loaded = 0;

        const checkLoaded = () => {
            loaded++;

            if (loaded === 2) {
                resolve();
            }
        };

        gisScript.onload = checkLoaded;
        pickerScript.onload = checkLoaded;

        gisScript.onerror = reject;
        pickerScript.onerror = reject;

        document.body.appendChild(gisScript);
        document.body.appendChild(pickerScript);

    });
};