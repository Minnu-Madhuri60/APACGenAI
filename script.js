// ============================================================
// VISIONVOICE AI
// IMAGE UPLOAD + LIVE WEBCAM
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const imageInput =
    document.getElementById("imageInput");

const dropZone =
    document.getElementById("dropZone");

const preview =
    document.getElementById("preview");

const previewContainer =
    document.getElementById("previewContainer");

const generateBtn =
    document.getElementById("generateBtn");

const result =
    document.getElementById("result");

const loading =
    document.getElementById("loading");

const metadata =
    document.getElementById("metadata");

const styleSelect =
    document.getElementById("style");

const languageSelect =
    document.getElementById("language");


// ============================================================
// WEBCAM ELEMENTS
// ============================================================

const openCameraBtn =
    document.getElementById("openCameraBtn");

const cameraSection =
    document.getElementById("cameraSection");

const cameraVideo =
    document.getElementById("cameraVideo");

const cameraCanvas =
    document.getElementById("cameraCanvas");

const captureBtn =
    document.getElementById("captureBtn");

const closeCameraBtn =
    document.getElementById("closeCameraBtn");

const cameraStatus =
    document.getElementById("cameraStatus");

const retakeBtn =
    document.getElementById("retakeBtn");


// ============================================================
// VARIABLES
// ============================================================

let cameraStream = null;

let capturedWebcamFile = null;


// ============================================================
// FILE VALIDATION
// ============================================================

function isValidImage(file) {

    if (!file) {
        return false;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        alert(
            "Please select a JPG, PNG or WEBP image."
        );

        return false;
    }


    if (file.size > 10 * 1024 * 1024) {

        alert(
            "Image size must be less than 10 MB."
        );

        return false;
    }


    return true;
}


// ============================================================
// SHOW PREVIEW
// ============================================================

function showPreview(file) {

    if (!isValidImage(file)) {

        imageInput.value = "";

        generateBtn.disabled = true;

        return;
    }


    // Uploaded image becomes the selected image.

    capturedWebcamFile = null;


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            preview.src =
                event.target.result;


            previewContainer.style.display =
                "block";


            result.textContent =
                "Image selected. Click Generate with Gemini.";

        };


    reader.readAsDataURL(file);


    generateBtn.disabled =
        false;
}


// ============================================================
// IMAGE UPLOAD
// ============================================================

imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];


        if (!file) {
            return;
        }


        showPreview(file);

    }
);


// ============================================================
// DRAG OVER
// ============================================================

dropZone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();


        dropZone.classList.add(
            "dragging"
        );

    }
);


// ============================================================
// DRAG LEAVE
// ============================================================

dropZone.addEventListener(
    "dragleave",
    function () {

        dropZone.classList.remove(
            "dragging"
        );

    }
);


// ============================================================
// DROP IMAGE
// ============================================================

dropZone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();


        dropZone.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (!isValidImage(file)) {
            return;
        }


        const dataTransfer =
            new DataTransfer();


        dataTransfer.items.add(file);


        imageInput.files =
            dataTransfer.files;


        showPreview(file);

    }
);


// ============================================================
// OPEN WEBCAM
// ============================================================

openCameraBtn.addEventListener(
    "click",
    async function () {

        try {

            // ------------------------------------------------
            // Browser support
            // ------------------------------------------------

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                alert(
                    "Your browser does not support webcam access."
                );

                return;
            }


            // ------------------------------------------------
            // Request camera permission
            // ------------------------------------------------

            cameraStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        },

                        facingMode: "user"

                    },

                    audio: false

                });


            // ------------------------------------------------
            // Connect stream to video
            // ------------------------------------------------

            cameraVideo.srcObject =
                cameraStream;


            cameraSection.style.display =
                "block";


            cameraStatus.textContent =
                "Camera active";


            cameraStatus.classList.add(
                "active"
            );


            result.textContent =
                "Camera is ready. Position yourself and capture a photo.";


        }

        catch (error) {

            console.error(
                "Webcam error:",
                error
            );


            cameraStatus.textContent =
                "Camera unavailable";


            alert(
                "Camera access was blocked. Please allow camera permission in Chrome and try again."
            );

        }

    }
);


// ============================================================
// CAPTURE WEBCAM PHOTO
// ============================================================

captureBtn.addEventListener(
    "click",
    function () {

        if (!cameraStream) {

            alert(
                "Please open the webcam first."
            );

            return;
        }


        // ----------------------------------------------------
        // Check camera is ready
        // ----------------------------------------------------

        if (
            cameraVideo.videoWidth === 0 ||
            cameraVideo.videoHeight === 0
        ) {

            alert(
                "Camera is still starting. Please wait a moment."
            );

            return;
        }


        // ----------------------------------------------------
        // Canvas dimensions
        // ----------------------------------------------------

        cameraCanvas.width =
            cameraVideo.videoWidth;

        cameraCanvas.height =
            cameraVideo.videoHeight;


        // ----------------------------------------------------
        // Draw current video frame
        // ----------------------------------------------------

        const context =
            cameraCanvas.getContext(
                "2d"
            );


        context.drawImage(

            cameraVideo,

            0,
            0,

            cameraCanvas.width,
            cameraCanvas.height

        );


        // ----------------------------------------------------
        // Convert canvas to JPEG
        // ----------------------------------------------------

        cameraCanvas.toBlob(

            function (blob) {

                if (!blob) {

                    alert(
                        "Unable to capture the photo."
                    );

                    return;
                }


                capturedWebcamFile =
                    new File(

                        [blob],

                        "webcam_capture.jpg",

                        {
                            type: "image/jpeg"
                        }

                    );


                // --------------------------------------------
                // Show captured image
                // --------------------------------------------

                const imageURL =
                    URL.createObjectURL(
                        blob
                    );


                preview.src =
                    imageURL;


                previewContainer.style.display =
                    "block";


                generateBtn.disabled =
                    false;


                result.textContent =
                    "Photo captured successfully. Click Generate with Gemini.";


                // --------------------------------------------
                // Stop camera
                // --------------------------------------------

                stopCamera();


                cameraSection.style.display =
                    "none";

            },

            "image/jpeg",

            0.90

        );

    }
);


// ============================================================
// CLOSE WEBCAM
// ============================================================

closeCameraBtn.addEventListener(
    "click",
    function () {

        stopCamera();


        cameraSection.style.display =
            "none";


        result.textContent =
            "Webcam closed.";

    }
);


// ============================================================
// STOP CAMERA
// ============================================================

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );

        cameraStream = null;
    }


    cameraVideo.srcObject =
        null;


    cameraStatus.textContent =
        "Camera inactive";


    cameraStatus.classList.remove(
        "active"
    );
}


// ============================================================
// RETAKE / CHOOSE ANOTHER
// ============================================================

retakeBtn.addEventListener(
    "click",
    function () {

        // Clear upload

        imageInput.value =
            "";


        // Clear webcam

        capturedWebcamFile =
            null;


        // Clear preview

        preview.src =
            "";


        previewContainer.style.display =
            "none";


        // Disable generate

        generateBtn.disabled =
            true;


        // Clear result

        result.textContent =
            "Upload an image or capture one using the webcam.";

        metadata.textContent =
            "";

    }
);


// ============================================================
// GENERATE WITH GEMINI
// ============================================================

generateBtn.addEventListener(
    "click",
    async function () {

        // ----------------------------------------------------
        // Select image
        // ----------------------------------------------------

        let selectedFile = null;


        if (capturedWebcamFile) {

            selectedFile =
                capturedWebcamFile;

        }

        else if (
            imageInput.files.length > 0
        ) {

            selectedFile =
                imageInput.files[0];

        }


        // ----------------------------------------------------
        // No image
        // ----------------------------------------------------

        if (!selectedFile) {

            alert(
                "Please upload an image or capture one using the webcam."
            );

            return;
        }


        // ----------------------------------------------------
        // Disable button
        // ----------------------------------------------------

        generateBtn.disabled =
            true;


        generateBtn.textContent =
            "⏳ Gemini is analyzing...";


        loading.classList.remove(
            "hidden"
        );


        result.textContent =
            "";


        metadata.textContent =
            "";


        // ----------------------------------------------------
        // FormData
        // ----------------------------------------------------

        const formData =
            new FormData();


        formData.append(
            "image",
            selectedFile,
            selectedFile.name
        );


        formData.append(
            "language",
            languageSelect.value
        );


        formData.append(
            "style",
            styleSelect.value
        );


        // ----------------------------------------------------
        // SEND TO FLASK
        // ----------------------------------------------------

        try {

            const response =
                await fetch(
                    "/caption",
                    {

                        method: "POST",

                        body: formData

                    }
                );


            let data;


            try {

                data =
                    await response.json();

            }

            catch {

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            // ------------------------------------------------
            // SERVER ERROR
            // ------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to generate description."
                );
            }


            // ------------------------------------------------
            // DISPLAY RESULT
            // ------------------------------------------------

            result.textContent =
                data.caption;


            metadata.textContent =
                `${data.provider} | ` +
                `${data.model} | ` +
                `${data.language} | ` +
                `${data.style}`;

        }


        catch (error) {

            console.error(
                "Generation error:",
                error
            );


            result.textContent =
                "⚠️ " + error.message;

        }


        finally {

            loading.classList.add(
                "hidden"
            );


            generateBtn.disabled =
                false;


            generateBtn.textContent =
                "✨ Generate with Gemini";

        }

    }
);


// ============================================================
// PAGE CLOSE / REFRESH
// STOP WEBCAM
// ============================================================

window.addEventListener(
    "beforeunload",
    function () {

        stopCamera();

    }
);