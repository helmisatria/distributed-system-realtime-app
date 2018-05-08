const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');

const index = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(cors());

app.use(favicon(path.join(__dirname, 'public/images/', 'logo_bakmi232.jpg')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
}));
app.use(express.static(path.join(__dirname, 'public')));

const io = require('socket.io').listen(app.listen(8080));

let URL;

if (process.env.PORT) {
  URL = `http://localhost:${process.env.PORT}`;
} else {
  URL = 'http://localhost:3000';
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.sockets.on('connection', (socket) => {
  console.log('client connected!');

  socket.on('getMenu', async () => {
    const menus = await axios.get(`${URL}/menu`);
    io.to(socket.id).emit('receiveMenu', { data: menus.data });
  });

  socket.on('pesan', async (data) => {
    const menu = await axios.get(`${URL}/menu/${data.menu}`);
    if (menu.data.stok - data.jumlah < 0) {
      return io.to(socket.id).emit('400', { error: 'Stok tidak cukup' });
    }

    const stok = await axios.patch(`${URL}/menu/${data.menu}`, {
      stok: menu.data.stok - data.jumlah,
    });

    const submit = {
      ...data,
      timestamp: moment(),
    };

    await axios.post(`${URL}/pesanan/`, submit);

    return io.sockets.emit('updateStok', stok.data);
  });

  socket.on('generateStok', async () => {
    const menus = await axios.get(`${URL}/menu`);

    menus.data.forEach(async (menu) => {
      await axios.patch(`${URL}/menu/${menu.id}`, {
        stok: _.random(10, 20),
      });
    });
  });
});

app.use('/', index);

console.log('Magic happened on port 8080');

module.exports = app;
