var path = require("path"); 
var http = require("http"); 

var express = require("express"); 
var socketIO = require("socket.io"); 
//http://119.246.79.200:8080/

var publicPath = path.join(__dirname, '../client');
var port = process.env.PORT || 2000; 
var app = express(); 
var server = http.createServer(app); 
var io = socketIO(server);  
app.use(express.static(publicPath)); 

var playercount = 0;
var array = [];//array of players
var arrayofobstacles = [];
var gamestarted = 0;
var arrayofitem = [];
var quest = 0;
//var end = 0;

class Player {
    constructor(id, name, x, y, number) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.number = number;
        this.speedX = 0;
        this.speedY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.angle = 0;
        this.windowWidth = 0;
        this.windowHeight = 0;
        this.upperX = 5;
        this.lowerX = -5;
        this.upperY = 5;
        this.lowerY = -5;
        this.Ready = 0;
        this.caught = 0;
        this.team = 0;
        this.revive = 0;
        //this.ReadyToRestart = 0;

        this.setspeedlimit = function(upperX, lowerX, upperY, lowerY){
            this.upperX = upperX;
            this.lowerX = lowerX;
            this.upperY = upperY;
            this.lowerY = lowerY;
        }
        this.resetspeedlimit = function(){
            this.upperX = 5;
            this.lowerX = -5;
            this.upperY = 5;
            this.lowerY = -5;
        }

        this.getplayerdata = function(){
            return{id: this.id,
                name: this.name,
                x: this.x,
                y: this.y,
                number: this.number
            }
        }
        this.getplayerinfo = function(){
            return{id: this.id,
                name: this.name,
                x: this.x,
                y: this.y,
                speedX: this.speedX,
                speedY: this.speedY,
                angle: this.angle,
                number: this.number,
                team: this.team,
                caught:this.caught,
                Ready: this.Ready,
                revive: this.revive
            }
        }
        
        this.move = function(){
            if (this.speedX > this.upperX){
                this.x += this.upperX;
            }
            else if(this.speedX < this.lowerX){
                this.x += this.lowerX;
            }
            else{
                this.x += this.speedX;
            }

            if (this.speedY > this.upperY){
                this.y += this.upperY;
            }
            else if(this.speedY < this.lowerY){
                this.y += this.lowerY;
            }
            else{
                this.y += this.speedY;
            }
        }

        this.updateinfo = function(){
            this.move();
        }
        this.draw = function () {
            if (this.team == 1){
                fill(0, 0, 255);
            }
            else if (this.team == 0){
                fill(255, 0, 0);
            }
            push();
            translate(this.x, this.y);
            rotate(this.angle);
            circle(0, 0, 50);
            circle(10,-25,20);
            circle(10,25,20);
            pop();
        
        } 
        
        return this;
    }
}

class Obstacle{
    constructor(type, x, y){
        this.type = type;
        this.x = x;
        this.y = y;
    
        this.draw = function (){
            fill(211, 211, 211);
            circle(this.x, this.y, 250);
        };
        this.getobstacleinfo = function(){
            return{
                type: this.type,
                x: this.x,
                y: this.y
            }
        };
        return this;
    }
} 

class Item{
    constructor(type, x, y){
        this.type = type;
        this.x = x;
        this.y = y;
        this.picked = 0;
    
        this.draw = function (){
            if (this.type == 'revive'){
                fill(255, 255, 100);
            }
            else if (this.type == 'quest'){
                fill(128, 128, 0);
            }
            circle(this.x, this.y, 30);
        };
        
        return this;
    }
} 



function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function ObjectGeneration(){
    var numberofobstacles = 40;
    for(i = 0; i <= numberofobstacles; i++){
        var tempX = getRandomInt(8000) - 4000;
        var tempY = getRandomInt(8000) - 4000;
        var alreadyexist = checkspawnblock(tempX, tempY);
        if (alreadyexist == 0 &&(Math.abs(tempX)>700 && Math.abs(tempY)>700 )){
            arrayofobstacles[i] = new Obstacle("rock", tempX, tempY);
        }
        else{
            i--;
        }
    }
}

function collisionwallhandle(collidedplayernumber){
    var Ux = 5;
    var Lx = -5;
    var Uy = 5;
    var Ly = -5;
    if (array[collidedplayernumber].x >= 4475){
        array[collidedplayernumber].upperX = 0;

    }
    else if(array[collidedplayernumber].x <= -4475){
        array[collidedplayernumber].lowerX = 0;

    }
    if (array[collidedplayernumber].y >= 4475){
        array[collidedplayernumber].upperY = 0;

    }
    else if (array[collidedplayernumber].y <= -4475){
        array[collidedplayernumber].lowerY = 0;
    }
    
    //array[collidedplayernumber].setspeedlimit(Ux,Lx,Uy,Ly);
    
}

function collisionhandle(collidedplayernumber, collidedobstacle){
    var UX = 5;
    var LX = -5;
    var UY = 5;
    var LY = -5;
    if (collidedobstacle.x > array[collidedplayernumber].x){
        UX = 0;
    }
    else{
        LX = 0;
    }
    if (collidedobstacle.y > array[collidedplayernumber].y){
        UY = 0;
    }
    else {
        LY = 0;
    }
    array[collidedplayernumber].setspeedlimit(UX,LX,UY,LY);
    
}

function getobstacledata(){
    var obstacledata = [];
    for(var i in arrayofobstacles){
        obstacledata.push(arrayofobstacles[i].getobstacleinfo());
    }
    return obstacledata;
}
function checkspawnblock(X, Y){
    for (var j in arrayofobstacles){
        var Xdistance = Math.abs(arrayofobstacles[j].x - X);
        var Ydistance = Math.abs(arrayofobstacles[j].y - Y);
        if(Xdistance <= 500 && Ydistance <= 500){
            return 1;
        }
    }
    for (var i in array){
        var Xdistance2 = Math.abs(array[i].x - X);
        var Ydistance2 = Math.abs(array[i].y - Y);
        if(Xdistance2 <= 500 && Ydistance2 <= 500){
            return 1;
        }
    }
    return 0;
}
function getotherplayerdata() {
    var arrayofotherplayerdata = [];
    for(var i in array) {
        arrayofotherplayerdata.push(array[i].getplayerinfo());
    }
    return arrayofotherplayerdata;
}

function checkeveryoneready(){
    for(var i in array){
        if(array[i].Ready == 0){
            return false;
        }
    }
    return true;
}

function updategameinfo(){
    var arrayofupdatedinfo = [];
    for(var i in array){
        array[i].updateinfo();
        arrayofupdatedinfo.push(array[i].getplayerinfo());
    }
    io.emit('infoupdate', {arrayofupdatedinfo});
}

function initializegame(){
    for(var i in array){
        array[i].caught = 0;;
        array[i].team = 0;
        //array[i].ReadyToRestart = 0;
        while(true){
            var tempx = getRandomInt(6000) - 3000;
            var tempy = getRandomInt(6000) - 3000;
            var blocked = checkspawnblock(tempx,tempy);
            if (blocked == 0){
                array[i].x = tempx;
                array[i].y = tempy;
                break;
            }
        }
    }
    spawnitem();
    io.emit('setupitemdata', arrayofitem);
    
    var seeker = getRandomInt(playercount);
    array[seeker].team = 1;
   // end = 0;
    gamestarted = 1;
    io.emit('GameStart', {seeker: seeker});
    io.emit('GameStartUpdate', {arrayofinfoforini: getinfoforinitialize()});
    
    
}

function spawnitem(){
    for (var i in arrayofitem){
        arrayofitem.splice(i, 1);
    }
    var item1 = new Item('revive', 100, 100);
    arrayofitem.push(item1);
    var item2 = new Item('quest', -100, 100);
    arrayofitem.push(item2);
    var item3 = new Item('quest', 100, -100);
    arrayofitem.push(item3);
    var item4 = new Item('quest', -100, -100);
    arrayofitem.push(item4);
}

/*function everyonereadytorestart(){
    for (var i in array){
        if (array[i].ReadyToRestart == 0){
            return false;
        }
    }
    return true;
}*/

function checkwin(){
    for(var i in array){
        if(array[i].team == 0 && array[i].caught == 0){
            //console.log(array[i]);
            return false;
        }
    }
    return true;
}

function getinfoforinitialize(){
    var arrayofinfoforini = [];
    for(var i in array) {
        arrayofinfoforini.push(array[i].getplayerinfo());
    }
    return arrayofinfoforini;
}

server.listen(port, function() {
    console.log("Server successfully runned on port " + port);
    ObjectGeneration();
    //GamePrep();
});

  

io.sockets.on('connection', function(socket) {
    console.log('someone conencted, Id: ' + socket.id);
    var player = {};
    socket.on('ready', function(data){
        while(true){
            var tempx = getRandomInt(6000) - 3000;
            var tempy = getRandomInt(6000) - 3000;
            var blocked = checkspawnblock(tempx,tempy);
            if (blocked == 0){
                player = new Player(socket.id, data.name, tempx, tempy, playercount);
                break;
            }
        
        }
    playercount++;
    array.push(player);
    socket.emit('yourid', {id: player.id, number: player.number});
    socket.broadcast.emit('newplayer', player.getplayerdata());
    socket.emit('otherplayerdata', {arrayofotherplayerdata: getotherplayerdata()});
    socket.emit('obstacledata', {obstacledata: getobstacledata()});
})

socket.on('inputdata', function(data){
        if(gamestarted == 1){
            player.angle = data.angle;
            player.windowWidth = data.windowWidth;
            player.windowHeight = data.windowHeight;
            player.speedX = data.movementX;
            player.speedY = data.movementY;
        }
})

socket.on("disconnect", () => {
    for(var i = 0;i < array.length; i++){
        if(array[i].id == socket.id){
            var disconnectednumber = array[i].number;
        }
    }
    for(var i in array) {
        if(array[i].id === socket.id) {
            array.splice(i, 1);
        }
    }
    io.emit('playerleft', {id: socket.id, number: disconnectednumber});
    socket.on('updateplayernumber', function(data){
        for(var i in array) {
            if(array[i].id === data.id) {
                array[i].number = data.number;
            }
        }
    });
    playercount--;
});

socket.on('collidewall', function(data){
    collisionwallhandle(data.player);
})

socket.on('collide', function(data){
    collisionhandle(data.player, arrayofobstacles[data.object]);
})

socket.on('uncollide', function(data){
    array[data.player].resetspeedlimit();
})

socket.on('pickitem', function(data){
    if(data.pickeditemtype == 'revive'){
            array[data.pickedplayer].revive = 1;
            io.emit('reviveitempicked', {pickedplayernum: data.pickedplayer});
    }
    else if(data.pickeditemtype == 'quest'){
        quest++;
    }
    io.emit('pickitemupdate', {pickeditem: data.pickeditem});
    arrayofitem.splice(data.pickeditem, 1);
})

socket.on('Catch', function(data){
    array[data.caughtnum].caught = 1;
    socket.broadcast.emit('catchupdate',{caughtnum: data.caughtnum})
})

socket.on('release', function(data){
    array[data.releasenum].caught = 0;
    array[data.reviver].revive = 0;
    io.emit('reviveupdate', {releasenum: data.releasenum, reviver: data.reviver})
})



socket.on('sendcaught', function(data){
    array[data.number].x = 0;
    array[data.number].y = 0;
})

socket.on('GameReady', function(data){
    
    if(data.Ready == 0){
        array[data.number].Ready = 0;
    } 
    else if(data.Ready == 1){
        array[data.number].Ready = 1;
    } 
})
})

process.on('exit', function() {
    io.emit('disconnect');
    server.close();
});

setInterval(function(){
    
    if(checkeveryoneready() ==true && playercount >= 2 && gamestarted == 0){
        
            initializegame();
            gamestarted = 1;
          
        
    }
    if(gamestarted == 1){
        updategameinfo();
        var win = checkwin();
        if (win == true && quest < 3 ){
            setTimeout(function (){
                io.emit('GG');
                quest = 0;
                //end = 1;
                
                    for(var i in array){
                        array[i].team = 0;
                        array[i].caught = 0;
                        array[i].Ready = 0;
                        array[i].revive = 0;
                        array[i].speedY = 0;
                        array[i].speedX = 0;
                    }
                  
                    gamestarted = 0;
              }, 1000);
              
            
        }
        else if (quest == 3 ){
            setTimeout(function (){
                io.emit('hiderGG');
                quest = 0;
               
                
                    for(var i in array){
                        array[i].team = 0;
                        array[i].caught = 0;
                        array[i].Ready = 0;
                        array[i].revive = 0;
                        array[i].speedX = 0;
                        array[i].speedY = 0;
                    }
                  
                    gamestarted = 0;
              }, 1000);  
              
        }
        
    }
},10)


