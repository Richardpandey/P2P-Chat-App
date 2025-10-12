# P2P-Chat-App

I believe AI is not replacing developers, but empowering them. This project shows how ideas can be turned into working apps faster with the help of AI, while still requiring technical understanding, programming language and design decisions. Through this project, I not only built a working chat app but also learned how real time communication works under the hood. I explored how WebRTC establishes peer to peer connections, how WebSockets handle signaling, and why this architecture ensures strong privacy. This gave me a practical understanding of networking, security beyond just coding the app itself


https://github.com/user-attachments/assets/5913e668-8f35-43cd-b2de-96a9bf6395c4

This project is a p2p chat application inspired by modern messaging platforms, offering real time file sharing, messaging, voice calls, and video calls. Signaling is handled via a WebSocket based server. Once signaling is complete, all data sharing is transferred directly using WebRTC, making privacy focused.
Simple React + Vite chat application with WebRTC calling and a small signaling server. Built with TypeScript, Tailwind CSS and Capacitor scaffolding for mobile support.


<img width="1440" height="900" alt="p2p" src="https://github.com/user-attachments/assets/2542d8f7-be99-4e44-8323-a5be4a8f222f" />

## Key features

- Peer to Peer chat UI with message bubbles and sidebar.
- WebRTC based audio/video calling with a small Node.js WebSocket signaling server (`server/signaling.js`).
- Uses Vite, React (TypeScript), Tailwind CSS  components.
- Ready for mobile packaging (Android / iOS) if you want to build a wrapper.

## Install

Clone the repository and install dependencies. Example using npm:

```bash
git clone https://github.com/Richardpandey/P2P-Chat-App.git
cd P2P-Chat-App
npm install
```

## Commands

- `npm run dev` — Starts the Vite dev server (web app) on host, default port 8080.
- `npm run signaling` — Start the signaling server (Node.js) on port 8081 by default.

Run the web app in development:

```bash
npm run dev
```

Start the signaling server in a separate terminal (required for WebRTC call signaling):

```bash
npm run signaling
```

## How to test calls locally

1. Start the Vite dev server: `npm run dev`
2. Start the signaling server: `npm run signaling`.
3. Open the app in two different browser windows (or two devices on the same network) and sign in.
4. Use the UI to make a call signaling server will relay on local browser server. 


## Contributing

Feel free to open issues or Contact me for further transfering your idea into working app. 

## My Achievements from this Project 

- Deep Dive: What I Learned from Building the Chat App
- WebRTC (Peer to Peer Communication)
- WebSockets (Signaling Server)
- Data Privacy & Security
- Frontend Design & User Experience
