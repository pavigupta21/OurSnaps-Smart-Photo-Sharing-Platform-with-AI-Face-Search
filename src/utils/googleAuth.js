// let tokenClient = null;

// export const getGoogleAccessToken = () => {

//     return new Promise((resolve, reject) => {

//         if (!window.google) {
//             reject("Google Identity Services not loaded");
//             return;
//         }

//         if (!tokenClient) {
//             console.log(
//     "Client ID:",
//     import.meta.env.VITE_GOOGLE_CLIENT_ID
// );
//             tokenClient =
//                 window.google.accounts.oauth2.initTokenClient({

//                     client_id:
//                         import.meta.env.VITE_GOOGLE_CLIENT_ID,

//                     scope:
//                         "https://www.googleapis.com/auth/drive.readonly",

//                     callback: (response) => {

//                         if (response.error) {
//                             reject(response);
//                             return;
//                         }

//                         resolve(response.access_token);

//                     }

//                 });

//         }

//         tokenClient.requestAccessToken();

//     });

// };
export const getGoogleAccessToken = () => {

    return new Promise((resolve, reject) => {

        const tokenClient =
            window.google.accounts.oauth2.initTokenClient({

                client_id:
                    import.meta.env.VITE_GOOGLE_CLIENT_ID,

                scope:
                    "https://www.googleapis.com/auth/drive.readonly",

                callback: (response) => {

                    if (response.error) {
                        reject(response);
                        return;
                    }

                    resolve(response.access_token);

                }

            });

        tokenClient.requestAccessToken();

    });

};