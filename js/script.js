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
  const labels = ["Camilo", "Nelson", "Sebastian"]; //array de etiquetas con los nombres de las personas
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`); //faceapi.fetchImage -> Carga las imagenes
        const detections = await faceapi
          .detectSingleFace(img) //detecta una unica cara
          .withFaceLandmarks()
          .withFaceDescriptor();
          // se devuelve un objeto FaceDetection que contiene las coordenadas de la caja delimitadora (bounding box)
          // y los vectores de características (descriptores) de la cara detectada.
        descriptions.push(detections.descriptor); //agrega los vectores de características (descriptores)...
        // de las dos imágenes en un array para la etiqueta correspondiente
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions); // se crea un objeto LabeledFaceDescriptors
      //para cada nombre de label  y el array de vectores de características (descriptores) correspondiente
    })
  );
}

async function faceRecognition() {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  video.addEventListener("playing", () => {
    location.reload();
  });

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });

      // Change color of the box based on the match confidence
      const matchConfidence = results[i].distance;  
      drawBox.draw(canvas);


      const messageElement = document.getElementById("message");
      if (matchConfidence < 0.6) {
        messageElement.innerText = "Puede ingresar";
        messageElement.style.color = "green";
      } else {
        messageElement.innerText = "No puede ingresar";
        messageElement.style.color = "red";
      }
    });
  }, 100);
}
