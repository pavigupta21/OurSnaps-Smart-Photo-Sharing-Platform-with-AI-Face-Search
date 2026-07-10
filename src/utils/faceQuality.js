
export function evaluateFace(results, video,canvas) {
    const landmarks = results.faceLandmarks;

    if (landmarks.length === 0) {

        return {
            valid: false,
            message: "No face detected."
        };

    }

    if (landmarks.length > 1) {

        return {
            valid: false,
            message: "Only one face allowed."
        };

    }

    const points = landmarks[0];
    const xs = points.map(p => p.x * video.videoWidth);
    const ys = points.map(p => p.y * video.videoHeight);

    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);

    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const imageData = ctx.getImageData(
        xmin,
        ymin,
        xmax - xmin,
        ymax - ymin
    ).data;
    let brightness = 0;

    for (let i = 0; i < imageData.length; i += 4) {

        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];

        brightness += (r + g + b) / 3;
    }

    brightness /= imageData.length / 4;
    const ovalWidth = 220;
    const ovalHeight = 280;

    const cx = video.videoWidth / 2;
    const cy = video.videoHeight / 2;
    const ovalLeft = cx - ovalWidth / 2;
    const ovalRight = cx + ovalWidth / 2;

    const ovalTop = cy - ovalHeight / 2;
    const ovalBottom = cy + ovalHeight / 2;
    const inside =

    xmin > ovalLeft &&
    xmax < ovalRight &&
    ymin > ovalTop &&
    ymax < ovalBottom;
    if (!inside) {

    return {

        valid: false,

        message: "Move your face inside the frame."

    };

}

    if (
        !results ||
        !results.faceLandmarks ||
        results.faceLandmarks.length === 0
    ) {

        return {

            valid: false,

            message: "No face detected.",

            checks: {

                faceCount: false

            }

        };

    }

    if (results.faceLandmarks.length > 1) {

        return {

            valid: false,

            message: "Only one face should be visible.",

            checks: {

                faceCount: false

            }

        };

    }
    if (brightness < 70) {

    return {

        valid: false,

        message: "Improve lighting."

    };

}
    if (brightness > 220) {

        return {

            valid: false,

            message: "Reduce bright light."

        };

    }

    return {

        valid: true,

        message: "Great! Hold still and click Register Face.",

        checks: {

            faceCount: true

        }

    };

}