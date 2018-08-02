var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.get('/',function (req,resp) {

    resp.sendFile(__dirname + '/index.html');

});


http.listen(4000,function () {
    console.log('server running ....')
});


//connect to mongo

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/MongoChat');

var db = mongoose.connection;

db.on('error',function (err) {
   console.log('error : cant connect to db' + err);
});

db.once('open',function () {
    console.log('connection success to db');

    //connect to socket.io
    io.on('connection',function (socket) {
       console.log('new user conn:');

       var sendStatus = function (s) {
           socket.emit('status',s);
       };

       //  //create a coll
       //  var Schema = mongoose.Schema;
       // var chatSchema = new Schema({
       //     name: String,
       //     message: String
       // });

       const Chats = db.collection('chats');
      // console.log(Chats.find({}));

       Chats.find({}).limit(100).sort({_id:1}).toArray(function (err,result) {
           if(err){
               throw err;
           }
            console.log(result);
           socket.emit('output',result);

       });

       socket.on('input',function (data) {

           var name = data.name;
           var msg = data.message;

           if(name == '' || msg == ''){
               sendStatus('Enter the name and msg');
           }else{
               //insert chat into db
              /* var chat1 = new Chats({
                   name: name,
                   message:msg
               });*/

               Chats.insert({
                   name: name,
                   message:msg},function () {


                   //err poss....
                   Chats.find({}).toArray(function (err,res) {
                       if(err){
                           throw err;
                       }
                       console.log(res);
                   });
                   io.sockets.emit('output',[data]);

                   sendStatus({
                       message: 'Message Sent',
                       clear: true
                   });

               });

           }
       });
       
       
       socket.on('clear',function () {

           Chats.remove({},function () {
             socket.emit('cleared')
           });
       });

    });



});






















