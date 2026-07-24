export const downloadDriveFiles = async (docs, accessToken) => {

    const files = await Promise.all(

        docs.map(async (doc) => {

            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const blob = await response.blob();

            return new File(
                [blob],
                doc.name,
                {
                    type: doc.mimeType,
                }
            );

        })

    );

    return files;
};