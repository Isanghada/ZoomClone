// const socket = io("https://pocha.online");
// const socket = io("https://pocha.online", {
//   cors: {
//     origin: "*",
//     methods: ["GET", "PUT", "POST", "HEAD", "PATCH", "DELETE"],
//   },
// });
const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

const call = document.getElementById("call");
call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnections = {};
let userCount = 1;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.id === option.value) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraing = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraing = {
    audio: true,
    video: { deviceid: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraing : initialConstraing
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
  } else {
    muteBtn.innerText = "Mute";
  }
  muted = !muted;
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Turn Camera On";
  } else {
    cameraBtn.innerText = "Turn Camera Off";
  }
  cameraOff = !cameraOff;
}

async function handleCameraChange() {
  await getMedia(cameraSelect.value);
  myPeerConnections.forEach((myPeerConnection) => {
    if (myPeerConnection) {
      const videoTrack = myStream.getVideoTracks()[0];
      const videoSender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
      videoSender.replaceTrack(videoTrack);
    }
  });
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;

  await getMedia();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", {
    roomName: input.value,
    username: "testname",
    nickname: "testnickname",
  });
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
socket.on("welcome", async (socketId) => {
  let myPeer = makeConnection();

  myPeerConnections[socketId] = myPeer;

  const offer = await myPeerConnections[socketId].createOffer();
  myPeerConnections[socketId].setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, socketId, roomName, {
    username: "testname",
    nickname: "testnickname",
  });
});

socket.on("offer", async (offer, socketId, userInfo) => {
  console.log("received the offer");
  myPeerConnections[socketId] = makeConnection();
  myPeerConnections[socketId].setRemoteDescription(offer);
  const answer = await myPeerConnections[socketId].createAnswer();

  myPeerConnections[socketId].setLocalDescription(answer);
  socket.emit("answer", answer, socketId, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer, socketId) => {
  console.log("received the answer");
  myPeerConnections[socketId].setRemoteDescription(answer);
});

socket.on("ice", (ice, socketId) => {
  console.log("received the candidate");
  myPeerConnections[socketId].addIceCandidate(ice);
});

socket.on("user_exit", ({ id }) => {
  delete myPeerConnections[id];
  console.log("==============>방 탈출!!!");
  console.log(id);

  userCount = 1;
  const keys = Object.keys(myPeerConnections);
  for (let socketID of keys) {
    console.log("---------");
    console.log(myPeerConnections[socketID]);
    console.log(myPeerConnections[socketID].getReceivers());
    console.log("---------");
    const receivers = myPeerConnections[socketID].getReceivers();
    const media = new MediaStream([receivers[0].track, receivers[1].track]);
    const peerFace = document.getElementById(`peerFace${userCount}`);
    peerFace.srcObject = media;
    userCount += 1;
  }

  console.log(userCount + "==================");
  let temp = userCount;
  if (temp < 4) {
    while (temp < 4) {
      const peerFace = document.getElementById(`peerFace${temp}`);
      peerFace.srcObject = null;
      temp += 1;
    }
  }
});

socket.on("room_full", () => {
  alert("방이 가득 찼습니다!!!!!!!!");
  location.href = "http://localhost:3000";
});

// RTC Code
function makeConnection() {
  let myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
  return myPeerConnection;
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log("handleAddStream---------------------");
  console.log(data);
  const peerFace = document.getElementById(`peerFace${userCount}`);
  userCount += 1;
  peerFace.srcObject = data.stream;
}
