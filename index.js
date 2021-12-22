const { Client } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io')
const qrcode = require('qrcode');
const fs = require('fs');
const http = require('http');
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = socketIO(server);

const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});
app.post('/kirim', (req, res) => {
    const nohp = req.body.nohp;
    const pesan = req.body.pesan;
    client.sendMessage(nohp, pesan).then(response => {
        res.status(200).json({
            status: true,
            pesan: response
        })
    }).catch(err => {
        res.status(500).json({
            status: false,
            pesan: err
        })
    });
})

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

client.on('message', msg => {
    const pesan = msg.body;
    const arr = pesan.split("#");
    if (arr[0] == 'NIK') {
        msg.reply('NIK Anda adalah ' + arr[1] + ' Dan nama Anda adalah ' + arr[2]);
    }
    if (arr[0] == 'NAK') {
        msg.reply('Yo wes ndang mangan kono le..... ' + arr[1])
    }
    if (arr[0] == 'Limit' || arr[0] == 'limit') {
        msg.reply('kenapa harus dikasih limit .. ' + arr[1])
    }
});

client.initialize();
//io 
io.on('connection', function (socket) {
    socket.emit('pesan', 'Sedang dikonekkan .... ');

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('pesan', 'QR sudah dikriim, silahkan scan');
        })
    });
    client.on('ready', () => {
        socket.emit('pesan', 'Wa sudah siap.... g perlu scan lagi');
        // socket.emit('siap', 'Wa sudah siap.... g perlu scan lagi');
        console.log('wa sudah siap....');
    });
    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        // socket.emit('pesan', 'Wa sudah siap.... g perlu scan lagi');
        socket.emit('pesan', 'Wa sudah terautentikasi.... g perlu scan lagi');
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });
    socket.on('kirimWa', (data) => {
        const nohp = '62' + data.nohp + '@c.us';
        const pesan = data.pesan;
        client.sendMessage(nohp, pesan).then(response => {
            socket.emit('pesan', pesan + ' telah terkirim ke nomor 62' + data.nohp)
        }).catch(err => {
            console.log(err);
            socket.emit('pesan', pesan + ' Gaagal terkirim ke nomor 62' + data.nohp)
        });
    })

});
server.listen(port, function () {
    console.log('server berjalan di port: 5000');
})