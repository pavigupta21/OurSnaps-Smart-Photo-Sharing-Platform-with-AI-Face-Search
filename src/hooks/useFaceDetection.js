import { useEffect, useRef, useState } from "react";
import { loadFaceLandmarker } from "../utils/faceLandmarker";
import { evaluateFace } from "../utils/faceQuality";

export default function useFaceDetection() {
    const canvasRef = useRef(
        document.createElement("canvas")
    );
    const webcamRef = useRef(null);
    const videoRef = useRef(null);

    const [cameraReady, setCameraReady] = useState(false);

    const [faceLandmarker, setFaceLandmarker] = useState(null);

    const [faceDetected, setFaceDetected] = useState(false);
    const [faceResult, setFaceResult] = useState(null);
    const [message, setMessage] = useState("");

    

    useEffect(() => {

        async function loadModel() {

            const model =
                await loadFaceLandmarker();

            setFaceLandmarker(model);

            console.log(
                "MediaPipe Loaded ✅"
            );

        }

        loadModel();

    }, []);
    const detectFace = () => {

    const video = videoRef.current;

    if (
        !faceLandmarker ||
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {
        return;
    }

    const results =
        faceLandmarker.detectForVideo(
            video,
            performance.now()
        );

    setFaceResult(results);

};
useEffect(() => {

    if (
        !cameraReady ||
        !faceLandmarker
    ) {
        return;
    }

    let animationId;

    const detect = () => {

        detectFace();

        animationId =
            requestAnimationFrame(detect);

    };

    detect();

    return () =>
        cancelAnimationFrame(animationId);

}, [
    cameraReady,
    faceLandmarker
]);
useEffect(() => {

    if (
        !faceResult ||
        !videoRef.current
    ) {
        return;
    }

    const quality =
        evaluateFace(
            faceResult,
            videoRef.current,
            canvasRef.current
        );

    setFaceDetected(
        quality.valid
    );

    setMessage(quality.message);

}, [faceResult]);

   return {

    webcamRef,
    videoRef,
    canvasRef,

    cameraReady,
    setCameraReady,

    faceDetected,
    message,

    faceLandmarker

};

}