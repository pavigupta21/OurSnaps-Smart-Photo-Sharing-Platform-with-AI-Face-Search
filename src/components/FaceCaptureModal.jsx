import useFaceDetection from "../hooks/useFaceDetection";
import "./FaceCaptureModal.css"
import Webcam from "react-webcam";
import { useState } from "react";
import axios from "axios";

const FaceCaptureModal = ({ onClose, onRegistered }) => {

    const [isRegistering, setIsRegistering] = useState(false);

    const {

        webcamRef,
        videoRef,

        cameraReady,
        setCameraReady,

        faceDetected,

        faceLandmarker,
        message

    } = useFaceDetection();

    const captureImage = async () => {

        if (isRegistering) return;

        try {

            setIsRegistering(true);

            const imageSrc = webcamRef.current.getScreenshot();

            if (!imageSrc) {

                alert("Unable to capture image. Please try again.");

                setIsRegistering(false);
                return;

            }

            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:5000/api/face-search/register-face",
                {
                    image: imageSrc
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await onRegistered();

            onClose();

        }
        catch (err) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                "Failed to register face."
            );

            setIsRegistering(false);

        }

    };

    if (!faceLandmarker) {

        return (

            <div className="modal-overlay">

                <div className="face-modal">

                    <h2>Loading Face Detector...</h2>

                </div>

            </div>

        );

    }

    return (

        <div
            className="modal-overlay"
            onClick={() => {

                if (!isRegistering) {
                    onClose();
                }

            }}
        >

            <div
                className="face-modal"
                onClick={(e) => e.stopPropagation()}
            >

                {!isRegistering && (

                    <button
                        className="face-modal-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                )}

                <div className="face-modal-content">

                    {!isRegistering && (
                        <>
                            <h2>Face Verification</h2>

                            <p>
                                Look directly at the camera and keep your face inside the frame.
                            </p>
                        </>
                    )}

                    <div
                        className="camera-frame"
                        style={{
                            display: isRegistering ? "none" : "block"
                        }}
                    >

                        <Webcam
                            ref={(webcam) => {

                                webcamRef.current = webcam;

                                if (webcam) {
                                    videoRef.current = webcam.video;
                                }

                            }}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            className="camera-preview"
                            mirrored={true}
                            onUserMedia={() => setCameraReady(true)}
                        />

                        <p className="face-status">
                            {message}
                        </p>

                        {cameraReady && (
                            <div
                                className={`face-guide ${
                                    faceDetected ? "valid" : ""
                                }`}
                            />
                        )}

                    </div>

                    {isRegistering && (

                        <div className="registering-message">

                            <div className="register-spinner"></div>

                            <h2>Registering Your Face</h2>

                            <p>
                                We've captured your photo successfully.
                            </p>

                            <p className="register-subtitle">
                                Please wait while we securely create your face profile.
                                <br />
                                This usually takes just a few seconds.
                            </p>

                        </div>

                    )}

                    {!isRegistering && (

                    <div className="face-modal-actions">

                        <button
                            className="btn-cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            className="scan-face-btn"
                            onClick={captureImage}
                            disabled={!faceDetected}
                        >
                            📷 Register Face
                        </button>

                    </div>

                    )}

                </div>

            </div>

        </div>

    );

};

export default FaceCaptureModal;