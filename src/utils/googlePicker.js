export const openGooglePicker = ({
    accessToken,
    apiKey,
    onPick,
}) => {

    window.gapi.load("picker", () => {

        const view = new google.picker.DocsView()
            .setIncludeFolders(false)
            .setMimeTypes(
                "image/jpeg,image/png,image/webp,image/heic"
            );

        const picker =
            new google.picker.PickerBuilder()

                .setOAuthToken(accessToken)

                .setDeveloperKey(apiKey)
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .setSize(
                Math.min(window.innerWidth - 32, 900),
                Math.min(window.innerHeight - 64, 700)
            )

                .addView(view)

                .setCallback((data) => {

                    if (
                        data.action ===
                        google.picker.Action.PICKED
                    ) {
                        onPick(data.docs);
                    }

                })

                .build();

        picker.setVisible(true);

    });

};