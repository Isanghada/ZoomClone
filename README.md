# ZOOM 클론 코딩

- 2023.02.01 : 1:N 대충 구현.

## 강의

- 노마드 코더 `Zoom 클론 코딩`
- https://nomadcoders.co/

## 필요 개념

- ExpressJS : http와 Connect 컴포넌트를 기반으로 하는 웹 프레임워크
- Pug : pug는 html을 조금 더 세련되게 쓸 수 있는 템플릿 언어, express 뷰 엔진. html과 js의 결합 형태.
- app.get() : express의 라우팅.
- req, res

## WebSocket

- 실시간 챗, 알림 등 real-time 서비스를 만들 수 있음.
- http는 백엔드가 유저를 기억하지 못함(response 이후에 잊음.)
- Secure Web Socket(WSS) : http와 전혀 다른 프로토콜. **양방향 프로토콜**
  - 클라이언트가 webSocket request를 보내면, 서버가 받거나 거절.
  - 서버가 받으면 연결이 성립(establish)
  - 터널과 같이 연결되어 클라이언트와 서버간의 통신이 된다.
  - 연결되었기 때문에 유저를 기억하고, 소통할 수 있음.
  - 전화 통화와 비슷.
- **ws** 라이브러리 사용.(node.js WebSocket library) : 웹 소켓의 핵심 부분.

## WebSocket 동작

dsadssad

- https://developer.mozilla.org/
- ws를 이용해 backend와 frontend 사이 연결.
- node.js의 Wewb Socket은 EventListener를 통해 동작.

## SocketIO

- 실시간 기능을 만들어주는 framework
- 실시간, 양방향, event 기반의 통신 제공.
- WebSocket을 사용하지만, WebSocket이 불가능하다면 다른 방식 사용.
  - (ex) Http long-polling
- SocketIO 장점
  - 자동 재연결 제공.
  - 커스텀 명령 가능.
  - 문자열이 아닌 데이터 전송 가능.
  - callback 가능. (bakc에서 front 함수 실행 가능)
- Backend를 위한 Admin UI : `npm i @socket.io/admin-ui`

## WebRTC

- Web Real-Time Communication
- 실시간 커뮤니케이션을 가능하게 해주는 기술.
- Signalling을 통해 peer-to-peer 구현.
  - 서버는 각 Client의 정보를 전달. (위치, 세팅 등의 정보)
  - 영상, 오디오 등이 서버를 거치지 않고 전달.
- 동작 방식
  - offer
  - answer
  - candidate : 연결 방식
- 웹 사이트 퍼블릭 : `npm i localtunnel`, `npm i -g localtunnel`
  - 서버의 URL 생성 : 일시적으로 무료
  - 시작 : `lt --port 포트번호`
- 추가 학습 영역 : Data Channel
  - 이미지, 파일, 게임 업데이트 패킷 등 모든 데이터를 peer-to-peer로 전달.
- Signalling의 단점
  - 너무 많은 peer를 가지면 느려지기 시작. (Full Mesh)

## STUN 서버

- 장치의 공용 IP 주소를 알려주는 역할.
  - 같은 네트워크에 있는 것이 아니라면 정상적으로 연결되지 않는다.
  - 각 기기의 IP 주소를 찾아야하기 때문에 필요.
- 간단하게는 구글에서 제공하는 서버를 사용할 수 있음.
  - **테스트 용도로 활용.**
  - 실제 서비스를 위해서는 직접 구현하는 것이 필요할 수 있음.
