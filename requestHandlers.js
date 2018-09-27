const fs = require('fs');
const url = require('url');
//const querystring = require('querystring');
const Game = require('./game_server/game.js');
var idGames = {};

// Создать игровую страницу с заполненными данными
function createGameHtml(idGame, mySign, cb) {
   var gameObject = idGames[idGame];
   fs.readFile('game_client/game.html', 'utf-8', (err, html) => {
      var playingArea = '<table class="playingAreaTable">';
      for (var y = 0; y < gameObject.sizePlayingArea; y++) {
         playingArea += '<tr>';
         for (var x = 0; x < gameObject.sizePlayingArea; x++) {
            playingArea += '<td id="id' + x + 'x' + y + '" class="cell" onclick="game.onClickToCell(this)"></td>';
         }
         playingArea += '</tr>';
      }
      playingArea += '</table>';
      html = html.replace(/{{idGame}}/g, idGame).replace('{{playingArea}}', playingArea).replace(/{{mySign}}/g, mySign);
      cb(html);
   });
   //result += '<p style="text-align: center">Id Game: ' + idGame + '</br>' + '<a href="/"><p style="text-align: center"><button onlick="return false;">back for main page</button></a>';
}

// Вернуть главную
function sendMain(request, response) {
   fs.readFile('main.html', 'utf-8', (err, html) => {
      response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html'});
      response.end(html);
   });
}

// Создание игры
function newGame(request, response) {
   var newIdGame = Math.floor(Math.random() * 10000).toString(),
      idUser = Math.random().toString(26).slice(2);
   idGames[newIdGame] = new Game({
      idUserX: idUser,
      idUserO: Math.random().toString(26).slice(2)
   });
   response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html', 'Set-Cookie': 'idUser=' + idUser + '; path=/'});
   createGameHtml(newIdGame, 'x', function(gameHtml) {
      response.end(gameHtml);
   });

   //response.end('<p style="text-align: center">Id Game: ' + newIdGame + '</br>' + '<a href="/"><p style="text-align: center"><button onlick="return false;">back for main page</button></a>');
}

// Присоединиться к игре
function connect(request, response) {
   var getParams = url.parse(request.url, true).query;
   if (idGames[getParams.idgame]) {
      response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html', 'Set-Cookie': 'idUser=' + idGames[getParams.idgame].idUserO + '; path=/'});
      createGameHtml(getParams.idgame, 'o', function(gameHtml) {
         response.end(gameHtml);
      });
      //response.end('You connect for this game' + getParams.idgame);
		
   } else {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('games with such an ID does not exist, or has not yet been created');
   }
		
}

// Сюда приходят все запросы по самой игре
// Ожидание игрока, ожидание хода другого игрока, ход
function game(request, response) {
   var postData = '';
   request.on('data', function(data) {
      postData += data;
   });
   request.on('end', function() {
      request.post = JSON.parse(postData);
      var cookie = getCookie(request),
         game = idGames[request.post.idGame];

      // Если это вопрос, не готов ли второй игрок играть
      if (request.post.type === 'checkReady') {
         response.end(JSON.stringify({
            ready: game.onReadyUser(cookie.idUser)
         }));
      }

      // Если это ход игрока
      if (request.post.type === 'step') {
         response.end(JSON.stringify(game.userStep(request.post.idCell, cookie.idUser)));
      }

      // Если это вопрос, не сделал ли второй игрок ход
      if (request.post.type === 'checkStepOtherUser') {
         response.end(JSON.stringify(game.checkStepOtherUser(cookie.idUser)));
      }

      // Если это утверждение, что время истекло
      if (request.post.type === 'timeIsUp') {
         response.end(JSON.stringify(game.timeIsUp(cookie.idUser)));
      }
   });
}

function getCookie(request) {
   var cookies = {};
   request.headers && request.headers.cookie.split(';').forEach(function(cookie) {
      var parts = cookie.match(/(.*?)=(.*)$/)
      cookies[ parts[1].trim() ] = (parts[2] || '').trim();
   });
   return cookies;
}

exports.sendMain = sendMain;
exports.newGame = newGame;
exports.connect = connect;
exports.game = game;
