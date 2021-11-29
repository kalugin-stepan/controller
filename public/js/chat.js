"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="./declare/socket.io.d.ts"/>
/// <reference path="../../node_modules/peerjs/index.d.ts"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function GetLocalStream() {
    return __awaiter(this, void 0, void 0, function* () {
        let stream;
        try {
            stream = yield navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        catch (_a) {
            stream = yield navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
        return stream;
    });
}
class AudioEl {
    constructor(parent, name) {
        this.parent = parent;
        this.audio = $(`<audio name="${name}" autoplay></audio>`);
        this.parent.append(this.audio);
    }
    Start(stream) {
        const aud = this.audio.get(0);
        if (aud !== undefined) {
            aud.srcObject = stream;
        }
    }
}
class VideoEl {
    constructor(parent, name) {
        this.parent = parent;
        this.video = $(`<video name="${name}" autoplay></video>`);
        this.parent.append(this.video);
    }
    Start(stream) {
        const vid = this.video.get(0);
        if (vid !== undefined) {
            vid.srcObject = stream;
        }
    }
}
class AudioFactory {
    constructor(parent) {
        this.parent = parent;
    }
    Create(name) {
        return new AudioEl(this.parent, name);
    }
    Remove(id) {
        $(`audio[name="${id}"]`).remove();
    }
    Reset() {
        this.parent.empty();
    }
}
class VideoFactory {
    constructor(parent) {
        this.parent = parent;
    }
    Create(name) {
        return new VideoEl(this.parent, name);
    }
    Remove(id) {
        $(`video[name="${id}"]`).remove();
    }
    Reset() {
        this.parent.empty();
    }
}
class Chat {
    constructor(MediaFactory, socket = io.connect(), options = {}) {
        this.socket = socket;
        this.MediaFactory = MediaFactory;
        this.peer = new Peer(options);
        this.Events();
    }
    Events() {
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
        this.socket.on("peers", (peers) => {
            peers.forEach(peer => {
                if (peer !== this.peer.id) {
                    this.Call(peer);
                }
            });
        });
        this.socket.on("disconn", (peer_id) => {
            this.MediaFactory.Remove(peer_id);
        });
    }
    Join(room_id) {
        this.EndCall();
        this.socket.on(room_id, (peer_id) => {
            this.MediaFactory.Remove(peer_id);
        });
        this.socket.emit("join", this.peer.id, room_id);
    }
    Call(peer_id) {
        GetLocalStream().then(stream => {
            const call = this.peer.call(peer_id, stream, { metadata: this.peer.id });
            call.answer(stream);
            const vid = this.MediaFactory.Create(peer_id);
            call.on("stream", stream => {
                vid.Start(stream);
            });
        });
    }
    EndCall() {
        this.MediaFactory.Reset();
    }
}
