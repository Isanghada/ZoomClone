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

//  axios
const api = axios.create({
  baseURL: "https://i8e201.p.ssafy.io/api",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

// include
const include = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
})

// 포차
let pochaInfo = {}; // 처음부터 필요한 포차 정보가 있다면 axios로 받아오기
const pochaChangeBtn = document.getElementById("pochaChange");
const pochaExtensionBtn = document.getElementById("pochaExtension");
const pochaCheersBtn = document.getElementById("pochaCheers");
const pochaExitBtn = document.getElementById("pochaExit");
const pochaGameBtn = document.getElementById("pochaGame");
const pochaGame = document.getElementById("game");

// 게임 테스트
let gameStep1 = null;
let gameStep2 = null;
let gameStep3 = null;
let gameSignal = null;

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
      const videoSender = myPeerConnection["peer"]
        .getSenders()
        .find((sender) => sender.track.kind === "video");
      videoSender.replaceTrack(videoTrack);
    }
  });
}
//////////////////////////////////////////////////////
// 포차 기능!!!!

// 포차 설정 변경 이벤트
async function handlePochaUpdate() {
  // 설정값 입력.
  let pocha_config = {};

  // axios를 통해 포차 설정 변경. (await 사용해야할 듯?)

  socket.emit("pocha_change", roomName);
}
pochaChangeBtn.addEventListener("click", handlePochaUpdate);

// 포차 시간 추가 이벤트
async function handlePochaExtension() {
  // axios를 통해 포차 시간 연장. (await 사용해야할 듯?)
  await api.put("/pocha/extension/3");

  socket.emit("pocha_extension", roomName);
}
pochaExtensionBtn.addEventListener("click", handlePochaExtension);

// 포차 짠!! 이벤트
async function handlePochaCheers() {
  // axios를 통해 포차 짠 실행.
  await api.put("/pocha/alcohol/3");

  socket.emit("pocha_cheers", roomName);
}
pochaCheersBtn.addEventListener("click", handlePochaCheers);

// 포차 나가기 이벤트
async function handlePochaExit() {
  await api.put("/pocha/exit", {
    isHost: false,
    pochaId: 3,
    username: "1zjK_Yrq6klkIxBWj8bj1WJkV5ng-7jhrRGvlIJXawI",
    waiting: false,
  });
  location.href = "http://localhost:3000";
}
pochaExitBtn.addEventListener("click", handlePochaExit);

// 포차 게임 선택 이벤트
async function handlePochaGame() {
  const inputString = prompt("게임 이름을 입력해주세요!");
  if (inputString === null || inputString === undefined) return;

  socket.emit("pocha_game", roomName, inputString);
}
pochaGameBtn.addEventListener("click", handlePochaGame);

//////////////////////////////////////////////////////

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
socket.on("users_of_room", async (users) => {
  console.log("--------------------");
  await users.forEach((user) => {
    console.log(user);
    myPeerConnections[user.id] = {
      username: user.username,
      nickname: user.nickname,
    };
  });

  console.log("방 입장--------------");
  await pocha_config_update(3);
});

socket.on("welcome", async (socketId, user) => {
  let myPeer = makeConnection();

  myPeerConnections[socketId] = {
    peer: myPeer,
    username: user.username,
    nickname: user.nickname,
  };
  console.log("환영!!!!----------------------------");

  const offer = await myPeerConnections[socketId]["peer"].createOffer();
  myPeerConnections[socketId]["peer"].setLocalDescription(offer);

  console.log(myPeerConnections[socketId]["peer"].getReceivers());

  const receivers = myPeerConnections[socketId]["peer"].getReceivers();
  const peerStream = new MediaStream([receivers[0].track, receivers[1].track]);
  handleAddStream(peerStream);
  console.log("sent the offer");

  await pocha_config_update(3);

  socket.emit("offer", offer, socketId, roomName, {
    username: "testname",
    nickname: "testnickname",
  });
});

socket.on("offer", async (offer, socketId, userInfo) => {
  console.log("received the offer");
  // myPeerConnections[socketId] = {
  //   username: userInfo.username,
  //   nickname: userInfo.nickname,
  // };
  myPeerConnections[socketId]["peer"] = makeConnection();
  myPeerConnections[socketId]["peer"].setRemoteDescription(offer);
  const answer = await myPeerConnections[socketId]["peer"].createAnswer();

  myPeerConnections[socketId]["peer"].setLocalDescription(answer);

  const receivers = myPeerConnections[socketId]["peer"].getReceivers();
  const peerStream = new MediaStream([receivers[0].track, receivers[1].track]);
  handleAddStream(peerStream);

  socket.emit("answer", answer, socketId, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer, socketId) => {
  console.log("received the answer");
  myPeerConnections[socketId]["peer"].setRemoteDescription(answer);
});

socket.on("ice", (ice, socketId) => {
  console.log("received the candidate");
  if (
    myPeerConnections[socketId]["peer"] === null ||
    myPeerConnections[socketId]["peer"] === undefined
  ) {
    return;
  }
  myPeerConnections[socketId]["peer"].addIceCandidate(ice);
});

socket.on("user_exit", async ({ id }) => {
  delete myPeerConnections[id];
  console.log(`${id}==============>방 탈출!!!`);

  userCount = 1;
  const keys = Object.keys(myPeerConnections);
  for (let socketID of keys) {
    const receivers = myPeerConnections[socketID]["peer"].getReceivers();
    const peerStream = new MediaStream([
      receivers[0].track,
      receivers[1].track,
    ]);
    handleAddStream(peerStream);
    // const peerFace = document.getElementById(`peerFace${userCount}`);
    // peerFace.srcObject = media;
    // userCount += 1;
  }

  let temp = userCount;
  if (temp < 4) {
    while (temp < 4) {
      const peerFace = document.getElementById(`peerFace${temp}`);
      peerFace.srcObject = null;
      temp += 1;
    }
  }

  await pocha_config_update(3);
  // host인지 확인.
  // await pocha_participants();
});

socket.on("room_full", () => {
  alert("방이 가득 찼습니다!!!!!!!!");
  location.href = "http://localhost:3000";
});

//////////////////////////////////////////////////////
// 포차 기능 받기!!!
async function pocha_config_update(pochaId) {
  // 방 설정 다시 불러오기!!! 테스트
  await api.get(`/pocha/${pochaId}`).then((result) => {
    pochaInfo = result.data.data;
  });
  console.log("axios 결과-----------------");
  console.log(pochaInfo);
}

// 포차 설정 변경! : 방 설정 다시 불러오기.
socket.on("pocha_change", async () => {
  console.log("포차 설정 변경!----------------------");
  // 방 설정 다시 불러오기!!! 테스트
  await pocha_config_update(3);
});

// 포차 시간 연장! : 방 설정 다시 불러오기.
socket.on("pocha_extension", async () => {
  console.log("포차 시간 연장!----------------------");
  // 방 설정 다시 불러오기!!! 테스트
  await pocha_config_update(3);
});

// 포차 짠! 기능 : 방 설정 다시 불러오기.
socket.on("pocha_cheers", async () => {
  console.log("포차 짠!!!!!----------------------");
  // 방 설정 다시 불러오기!!! 테스트
  await pocha_config_update(3);
});
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// 포차 게임 기능
socket.on("pocha_game", async (game, data) => {
  console.log("포차 게임!!-------------------------");
  console.log(game);
  console.log(data);
  await include.get("/game")
    .then(result => {
      pochaGame.innerHTML = result.data;
    })
  
  gameStep1 = document.getElementById("gameStep1");
  gameStep1.addEventListener("click", () => {
    socket.emit("pocha_game_step1", roomName);
  })
});

// 포차 게임 다음 화면
socket.on("pocha_game_step1", async () => {
  await include.get("/game1")
    .then(result => {
      pochaGame.innerHTML = result.data;
    })
  
  gameStep2 = document.getElementById("gameStep2");
  gameStep2.addEventListener("click", () => {
    socket.emit("pocha_game_step2", roomName);
  })
  gameSignal = document.getElementById("gameSignal")
  gameSignal.addEventListener("click", () => {
    socket.emit("pocha_game_signal", roomName);
  })
});

// 포차 게임 신호 주고 받기!
socket.on("pocha_game_signal", async () => {
  alert("게임 시그널!!!!");
});

// 포차 게임 마지막 화면
socket.on("pocha_game_step2", async () => {
  await include.get("/game2")
    .then(result => {
      pochaGame.innerHTML = result.data;
    })
  
  gameStep3 = document.getElementById("gameStep3");
  gameStep3.addEventListener("click", () => {
    socket.emit("pocha_game_step3", roomName);
  })
});

// 포차 게임 마지막 화면
socket.on("pocha_game_step3", async () => {
  alert("게임 종료!!!")
  pochaGame.innerHTML = "";
});

//////////////////////////////////////////////////////

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
  //myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
  return myPeerConnection;
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(stream) {
  console.log("handleAddStream---------------------");
  const peerFace = document.getElementById(`peerFace${userCount}`);
  userCount += 1;

  /////////////////////////////////////////////////////
  // 상대 카메라 OFF로 시작
  stream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  /////////////////////////////////////////////////////
  
  peerFace.srcObject = stream;

  ///////////////////////////////////////////////////
  // 시간 계산
  console.log( "2023-02-07T16:43:00.000");  // 포차 시작 시간으로 설정?
  let date = new Date( "2023-02-07T16:43:00.000")
  console.log(date, date.getTime());
  let goal = date;
  goal.setMinutes(goal.getMinutes() + 2);
  console.log(goal, goal.getTime());
  let nowTime = new Date();
  console.log(nowTime, nowTime.getTime());
  let diff = goal.getTime() - nowTime.getTime()
  diff = diff < 0 ? 0 : diff;
  console.log(diff);

  // 시간 경과 후 자동으로 카메라 ON
  setTimeout(() => {
    alert("시간 경과!");
    peerFace.srcObject
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  }, diff);
  ///////////////////////////////////////////////////
  
  // 본인 비디오 제외 상대 비디오 클릭 시 이벤트 설정!!!
  peerFace.onclick = () => {
    alert("클릭 테스트!!!");
  };
  ///////////////////////////////////////////////////
}