const APP_ID = "859774df74c34c729ba872b25f3ee8e5";
const TOKEN = "007eJxTYJCsOs6xqv3cE83gogOSiTntPy4bbUphOV7tVVlzwWJH4VwFBgtTS3Nzk5Q0c5NkY5NkcyPLpEQLc6MkI9M049RUi1RTMWnx9IZARoYrYksZGKEQxGdhyE3MzGNgAAAkyB5E";
const CHANNEL = "main";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};
let joinTimeout;
let mediaRecorder;
let recordedChunks = [];

async function requestPermissions() {
    try {
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        return true;
    } catch (error) {
        showPermissionAlert();
        return false;
    }
}

function showPermissionAlert() {
    alert("Se requieren permisos de micrófono y cámara para continuar. ¡No te vayas! 😱 Arriba en el 🔒, puedes acceder para otorgar los permisos correspondientes.");
}

let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

    if (await requestPermissions()) {
        let player = `<div class="video-container" id="user-container-${UID}">
                            <div class="video-player" id="user-${UID}"></div>
                      </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        
        localTracks[1].play(`user-${UID}`);
        await client.publish([localTracks[0], localTracks[1]]);
    }
};

let joinStream = async () => {
    clearJoinTimeout();
    const permissionsGranted = await requestPermissions();

    if (permissionsGranted) {
        document.body.style.backgroundImage = "url('./454529.jpg')";
        document.body.style.backgroundSize = "cover";

        await joinAndDisplayLocalStream();
        document.getElementById('join-btn').style.display = 'none';
        document.getElementById('stream-controls').style.display = 'flex';
        document.querySelector('.lightsaber').style.display = 'block';
    }
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                 </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        await user.audioTrack.setMuted(true);
        user.audioTrack.play();
    }
};

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; localTracks.length > i; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.querySelector('.lightsaber').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
};

let toggleMic = async (e) => {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        e.target.innerText = 'Mic on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[0].setMuted(true);
        e.target.innerText = 'Mic off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        e.target.innerText = 'Camera on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

function clearJoinTimeout() {
    if (joinTimeout) {
        clearTimeout(joinTimeout);
    }
}

async function startConnection() {
    const permissionsGranted = await requestPermissions();
    if (permissionsGranted) {
        joinStream();
    } else {
        document.getElementById('join-btn').style.display = 'block';
    }
}

const sableSound = document.getElementById('sable-sound');
sableSound.volume = 0.1;

async function startRecording() {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
    }

    sableSound.currentTime = 0;
    sableSound.play();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(recordedBlob);
        const videoElement = document.getElementById('recorded-video');
        videoElement.src = url;
        videoElement.style.display = 'block';
        recordedChunks = [];
    };

    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}

document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.querySelector('.lightsaber').addEventListener('mouseover', startRecording);
document.querySelector('.lightsaber').addEventListener('mouseout', stopRecording);
document.addEventListener('DOMContentLoaded', startConnection);

async function startConnection() {
    const permissionsGranted = await requestPermissions();
    setTimeout(joinStream, 18000);
}

//Omni
