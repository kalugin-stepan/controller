#!/usr/bin/python3
#socket client
import socket

conn = socket.socket()
conn.connect(("localhost", 2000))
conn.send(bytes(input(), "utf-8"))
answer = conn.recv(1024).decode("utf-8")
if answer == "1\n":
    while True:
        print(conn.recv(1024).decode("utf-8"))
elif answer == "0\n":
    print("uid not exists")