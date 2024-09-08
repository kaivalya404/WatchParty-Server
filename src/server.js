const express = require("express");
const { parse } = require("path");
const { stringify } = require("querystring");
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");
const port = 3000;
const wss = new WebSocket.Server({ server: server });
const groups = {};

wss.on('connection', (socket) => {
    console.log("A new client connected");

    socket.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.pathid === "keep-alive") {
                // Handle keep-alive
                console.log("Received keep-alive message");
                socket.send(JSON.stringify({ pathid: 'keep-alive' }));
            } else if (parsedMessage.pathid === "createParty") {
                console.log("Received message:", parsedMessage);
                const group = parsedMessage.group;
                if (!groups[group]) {
                    groups[group] = { members: [], url: parsedMessage.url };
                }

                // Avoid adding the same socket multiple times
                if (!groups[group].members.includes(socket)) {
                    groups[group].members.push(socket);
                }
                const toSend = JSON.stringify({ group: group, pathid: 'createParty', });
                socket.send(toSend);

            }else if (parsedMessage.pathid === 'joinParty'){
              const group = parsedMessage.group;
              if (!groups[group].members.includes(socket)) {
                groups[group].members.push(socket);
                socket.send(JSON.stringify({ pathid: 'joinParty', url: groups[group].url, group : group }));
              }
            }else if (parsedMessage.pathid === 'sync'){
              const group = parsedMessage.group;
              const message = JSON.stringify(parsedMessage);
              groups[group].members.forEach(client => {
                  if (client !== socket) {
                      client.send(message);
                  }
              });
            }
        } catch (error) {
            console.error('Invalid message:', message, 'Error:', error);
        }
    });

    socket.on('close', () => {
        // Remove the socket from all groups
        for (const group in groups) {
            groups[group].members = groups[group].members.filter(client => client !== socket);
        }
        console.log("A client disconnected");
    });
});

app.get('/', (req, res) => res.send("Hello World"));

server.listen(port, () => console.log("Listening on port " + port));