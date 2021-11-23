#!/usr/bin/python3
import socket
import json

conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
conn.connect(("localhost", 1000))
conn.send(json.dumps({"type": "connection", "value": input()}).encode("utf-8"))
answer = conn.recv(1024).decode("utf-8")
if answer == "1\n":
    while True:
        data = conn.recv(1024).decode("utf-8")
        if data == "ping\n":
            conn.send(json.dumps({"type": "ping"}).encode("utf-8"))
        print(data)
elif answer == "0\n":
    print("uid not exists")