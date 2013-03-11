var util = require('util'),
    http = require('http'),
    path = require('path'),
    crypto = require('crypto'),
    express = require('express');

var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

var APP_PORT = 7571,
    ID_CHARS = '023456789abcdefghijkmnopqrstuvwxyz',
    ID_LENGTH = 5,
    MAX_ID_NUM = Math.pow(ID_CHARS.length, ID_LENGTH);

var allFiles = {};

io.set('log level', 2);

app.use(express.static(__dirname + '/static'));

app.get('/download/:id', function (req, res) {
    var fileId = req.params.id,
        file = allFiles[fileId];
    if (!file)
        return res.send(404);
    res.redirect(util.format('/download/%s/%s', fileId, file.filename));
});
app.get('/download/:id/:filename', function (req, res) {
    var fileId = req.params.id,
        file = allFiles[fileId];
    if (!file)
        return res.send(404);
    if (file.transferring)
        return res.send(410);
    
    res.type(path.extname(file.filename));
    res.set('Content-Length', file.length);
    file.downloader = res;
    file.transferring = true;
    file.provider.emit('start upload', fileId);
});

app.post('/upload/:id', function (req, res) {
    var fileId = req.params.id,
        file = allFiles[fileId];
    if (!file)
        return res.send(404);
    if (!file.transferring)
        return res.send(405);
    // Authentication
    if (req.ip != file.provider.handshake.address.address)
        return res.send(403);
    if (req.get('Transfer-Secret') != file.secret)
        return res.send(403);
    
    req.pipe(file.downloader);
    req.on('end', function () {
        delete allFiles[fileId];
        res.send(200);
    });
});

io.sockets.on('connection', function (socket) {
    var fileId, secret;

    // give transfer secret
    crypto.randomBytes(96, function (ex, buf) {
        secret = buf.toString('base64');
        socket.emit('secret', secret);
    });

    // prepare uploading
    socket.on('upload', function (filename, length) {
        // generate file id
        while (!fileId || allFiles[fileId]) {
            var fileIdNum = Math.floor(Math.random() * MAX_ID_NUM);
            fileId = '';
            for (var i = 0; i < ID_LENGTH; i++) {
                fileId += ID_CHARS[fileIdNum % 36];
                fileIdNum = Math.floor(fileIdNum / 36);
            }
        }
        // notice client the id
        socket.emit('file id', fileId);
        // register file
        allFiles[fileId] = {
            provider: socket,
            filename: filename,
            length: length,
            secret: secret,
            transferring: false
        };
    });
    // cancel uploading
    socket.on('cancel', function () {
        if (fileId)
            delete allFiles[fileId];
        fileId = null;
    });
    // clean when disconnect
    socket.on('disconnect', function () {
        if (fileId)
            delete allFiles[fileId];
    });
});

server.listen(APP_PORT, '::');
