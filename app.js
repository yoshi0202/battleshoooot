var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require(__dirname + '/config/config.json');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = config.app.port;
// port設定
app.set('port', port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', function(socket){
  console.log(socket.id);
  //ルーム入室処理
  socket.on('joinroom', function(data,ack){
    socket.join('playroom');
    io.in('playroom').clients(function(error, clients){
      //レスポンスとしてルームに接続している人数を返す
      ack(clients.length - 1);
    });
  });

  socket.on('player1_move', function(data){
    io.to('playroom').emit('player1_place', data);
  });
  socket.on('player2_move', function(data){
    io.to('playroom').emit('player2_place', data);
  });
  socket.on('player_beam', function(data){
    socket.to('playroom').emit('enemy_beam', data);
  });
  socket.on('beam_hit', function(data){
    io.in('playroom').emit('hp_down', data);
  });
  socket.on('game_end', function(data){
    io.in('playroom').emit('game_end', data);
  });
});

http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
