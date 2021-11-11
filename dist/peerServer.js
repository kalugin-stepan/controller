const PeerServer = require("peer").PeerServer
const path = require("path")
const fs = require("fs")
const port = parseInt(JSON.parse(fs.readFileSync(path.join(path.dirname(__dirname), "config.json"))).peer_port)
const server = PeerServer({port : port, path : "/peer", debug : true})

server.on("connection", id => {
    console.log("Connection from " + id.getId())
})

server.on("disconnect", id => {
    console.log("Disconection from " + id.getId())
})