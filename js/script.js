const video = document.getElementById("video"); //Get the video from HTML 
//Link the video html element with the video constant here in JS

Promise.all([ //wait until everything is fully loaded
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"), //
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
])
  .then(iniciarWebCam)
  .then(faceRecognition); //call to access the camera

function iniciarWebCam() {  //function to start the webcam  
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false, //No access to audio
    })
    .then((stream) => {
      video.srcObject = stream; //hook the webcam to video object
    })
    .catch((error) => {
      console.error(error); //error in console
    });
}

function getLabeledFaceDescriptions() {
  const labels = ["Camilo", "Nelson", "Sebastian"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function faceRecognition() {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  video.addEventListener("playing", () => { //after video is playing
    location.reload();
  });
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
      drawBox.draw(canvas);

      const messageElement = document.getElementById("message"); // Get the message element from HTML
      if (results[0].distance < 0.6) { // Check if the distance is less than a certain threshold
        messageElement.innerText = "Puede ingresar"; // Show the message "Puede ingresar"
      } else {
        messageElement.innerText = "No puede ingresar"; // Show the message "No puede ingresar"
      }
    });
  }, 100);
} 