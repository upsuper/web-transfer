# Web Transfer

A simple web-based file transfer service written in JavaScript.

## Dependence

It certainly depends on [node.js](http://nodejs.org/), and needs
[express](http://expressjs.com/) and [socket.io](http://socket.io/) to run.

## Usage

Execute `node server.js`, then the server will start listening on port 7571.
Use any modern browser to access the service.

To transfer a file to another peer, one can select the file and the server will
provide a file id, which is by default 5 alphanumeric string. As soon as the
counterpart types the file id and press "Go", the transmission will start.

No data is buffered so it consumes nothing excepts bandwidth for server. Data 
is transmitted directly from the source to the destination through server.
