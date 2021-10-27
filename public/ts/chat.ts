/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="./declare/socket.io.d.ts"/>
/// <reference path="../../node_modules/peerjs/index.d.ts"/>

async function GetLocalStream(): Promise<MediaStream> {
    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    }
    catch {
        stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
    }
    return stream;
}

interface Media {
    Start(stream: MediaStream): void;
}
class AudioEl implements Media {
    readonly parent: JQuery;
    readonly audio: JQuery<HTMLAudioElement>;
    constructor(parent: JQuery, name: string | undefined) {
        this.parent = parent;
        this.audio = $(`<audio name="${name}" autoplay></audio>`);
        this.parent.append(this.audio);
    }
    Start(stream: MediaStream): void {
        this.audio.get(0).srcObject = stream;
    }
}

class VideoEl implements Media {
    readonly parent: JQuery;
    readonly video: JQuery<HTMLVideoElement>;
    constructor(parent: JQuery, name: string | undefined) {
        this.parent = parent;
        this.video = $(`<video name="${name}" autoplay></video>`);
        this.parent.append(this.video);
    }
    Start(stream: MediaStream): void {
        this.video.get(0).srcObject = stream;
    }
}

interface MediaFactory {
    Create(name: string | undefined): Media;
    Remove(id: string): void;
    Reset(): void;
}

class AudioFactory implements MediaFactory {
    readonly parent: JQuery;
    constructor(parent: JQuery) {
        this.parent = parent;
    }
    Create(name: string | undefined): Media {
        return new AudioEl(this.parent, name);
    }
    Remove(id: string): void {
        $(`audio[name="${id}"]`).remove();
    }
    Reset(): void {
        this.parent.empty();
    }
}
class VideoFactory implements MediaFactory {
    readonly parent: JQuery;
    constructor(parent: JQuery) {
        this.parent = parent;
    }
    Create(name: string | undefined): Media {
        return new VideoEl(this.parent, name);
    }
    Remove(id: string): void {
        $(`video[name="${id}"]`).remove();
    }
    Reset(): void {
        this.parent.empty();
    }
}
class Chat {
    private readonly socket: Socket;
    private readonly peer: Peer;
    private readonly MediaFactory: MediaFactory;
    constructor(MediaFactory: MediaFactory, socket: Socket = io.connect(), options: Peer.PeerJSOption = {}) {
        this.socket = socket;
        this.MediaFactory = MediaFactory;
        this.peer = new Peer(options);
        this.Events();
    }
    private Events(): void {
        this.peer.on("open", id => {
            this.socket.emit("peer", id);
        });
        this.peer.on("call", conn => {
            GetLocalStream().then(stream => {
                conn.answer(stream);
                const vid = this.MediaFactory.Create(conn.metadata);
                conn.on("stream", stream => {
                    vid.Start(stream);
                });
            });
        });
        this.socket.on("peers", (peers: string[]) => {
            peers.forEach(peer => {
                if (peer !== this.peer.id) {
                    this.Call(peer);
                }
            });
        });
        this.socket.on("disconn", (peer_id: string) => {
            this.MediaFactory.Remove(peer_id);
        });
    }
    Join(room_id: string): void {
        this.EndCall();
        this.socket.on(room_id, (peer_id: string) => {
            this.MediaFactory.Remove(peer_id);
        });
        this.socket.emit("join", this.peer.id, room_id);
    }
    Call(peer_id: string): void {
        GetLocalStream().then(stream => {
            const call = this.peer.call(peer_id, stream, {metadata: this.peer.id})
            call.answer(stream);
            const vid = this.MediaFactory.Create(peer_id);
            call.on("stream", stream => {
                vid.Start(stream);
            });
        });
    }
    EndCall(): void {
        this.MediaFactory.Reset();
    }
}