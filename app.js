var express = require('express'),
    app = express()
  , http = require('http')
  , log4js = require('log4js')
  , i18n = require("i18n")
  , server = http.createServer(app);
var config = require('./config.json');

__dirname = 'C:\\wamp_server\\www\\demoNodejs\\';

//Configuració dels locale del i18n
i18n.configure({
    locales:['ca','es','en', 'fr'],
    directory: __dirname + 'locale',
    defaultLocale: 'en'
});

// Configuració del logger
log4js.configure({
 appenders: [
   { type: 'console', category: 'loggerAnotacionsConsole' },
   { type: 'file', filename: './logs/anotacions.log', category: 'loggerAnotacionsFile' }
  ]
});

var logger = log4js.getLogger('loggerAnotacionsFile');
logger.setLevel('TRACE');
var loggerConsole = log4js.getLogger('loggerAnotacionsConsole');
loggerConsole.setLevel('TRACE');

app.set('port', config.port);
app.set('url_materials', config.materials);
app.set('mySql', config.mySql);
app.set('user', config.user);
app.set('password', config.password);

app.configure(function(){
	app.use(express.json());
  app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname));
	app.use('/annotator/css', express.static(__dirname + '/css'));
	app.use('/annotator/img', express.static(__dirname + '/img'));
  app.use('/annotator/js',express.static(__dirname + '/js'));
  app.use('/annotator/locale',express.static(__dirname + '/locale'));
  app.use('/css', express.static(__dirname + '/css'));
  app.use('/img', express.static(__dirname + '/img'));
  app.use('/js',express.static(__dirname + '/js'));
  app.use('/locale',express.static(__dirname + '/locale'));
  app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }));
  app.use(i18n.init); //i18n Multiidioma
})

require('./lib/router/router')(app);

var port  = config.port;

server.listen(port);
loggerConsole.debug("Loaded." + config.port);
logger.debug("Loaded..." + config.port);


/* socket.io express config  */
io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){

  socket.on('login',function(username) {
    socket.set('username',username,function(err) {
      if (err) throw err;
      console.log('SocketIO: Username '+ username +' connected...');  
    });
  });
  socket.emit('login');
  
  
  socket.on('disconnect', function () {
    console.log('SocketIO: User Disconnected...');    
    var rooms = io.sockets.manager.roomClients[socket.id]
    for(var room in rooms) {
        room = room.replace('/',''); //Important
        if(room){
          //socket.leave(room);          
          var counter_refresh = setTimeout(function(){
            io.sockets.in(room).emit('notification', { online:io.sockets.clients(room).length});
            clearTimeout(counter_refresh)
          }, 2000);

        }  
     }
  });

  /* Each content is a room
   *
  */
  socket.on('join',function(room) {
      socket.set('room',room,function(err) {
        if (err) { throw err; }
        socket.join(room);
        socket.get('username',function(err,username) {
          console.log(username + 'esta al room ' + room)
        });
        var clients = io.sockets.clients(room); 
        io.sockets.in(room).emit('notification', { online: clients.length });

      });
  });

});