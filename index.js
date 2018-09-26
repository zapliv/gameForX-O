var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/"] = requestHandlers.sendMain;
handle["/newgame"] = requestHandlers.newGame;
handle["/connect"] = requestHandlers.connect;
handle["/connect/"] = requestHandlers.connect;
handle["/game"] = requestHandlers.game;
handle["/game/"] = requestHandlers.game;

server.start(router.route, handle);