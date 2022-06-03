const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let shipWarsGame = require('./public/js/back/ShipWarsGame');
const mysql = require('mysql');
const session = require("express-session")({
  // CIR2-chat encode in sha256
  secret: "eb8fcc253281389225b4f7872f2336918ddc7f689e1fc41b64d5c4f378cdc438",
  resave: true,
  saveUninitialized: true,
  cookie: {
      maxAge: 2 * 60 * 60 * 1000, //24H
      secure: false
  }
});
const sharedsession = require("express-socket.io-session");
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.set("view engine", "ejs")
var path = require('path');
const { Server } = require('http');

let users = {}
let gameIdCounter = 1;

// Init of express, to point our assets
app.use(express.static(__dirname));
app.use(urlencodedParser);
app.use(session);
app.get('/', (req, res) => {
  let sessionData = req.session;

  // Test des modules 
  //states.printServerStatus();
  //states.printProfStatus();
  //let test = new Theoden();
  //trucs du prof on enleve

  // Si l'utilisateur n'est pas connecté
  if (!sessionData.username) {
      res.sendFile(__dirname + '/views/inscription.html');
  } else {
      res.sendFile(__dirname + '/views/index.html');
  }
});

// Configure socket io with session middleware
io.use(sharedsession(session, {
  // Session automatiquement sauvegardée en cas de modification
  autoSave: true
}));

// Détection de si nous sommes en production, pour sécuriser en https
if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  session.cookie.secure = true // serve secure cookies
}


io.on('connection', function (socket) {
  console.log('a user connected.');

  //Création d'objet user pour des données en plus
  users[socket.id] = {
    inGame: null,
    player: null,
    opponent: null,
    username: null
  };



  // Rejoint la file d'attente jusqu'à trouver un adversaire
  socket.join('queue');


  //Requete de l'utilisateur pour quitter la partie
  socket.on('leave', function () {
    console.log("User left");
    if (users[socket.id].inGame !== null) {
      leaveGame(socket);

      socket.join('queue');
      joinWaitingPlayers();
    }
  });

  //Déconnexion de l'utilisateur
  socket.on('disconnect', function () {
    console.log('user disconnected');
    leaveGame(socket);
    delete users[socket.id];
  });

  //update username
  socket.on('update_username', function (SUUUUUsername) {
    console.log('update d\'username');
    users[socket.id].username = SUUUUUsername;
  });

  //recevoir le tir du côté client
  socket.on('shot', function (index) {
    let game = users[socket.id].inGame;
    let opponent;

    //Si le joueur est dans une partie
    if (game !== null) {
      // Si c'est son tour
      if (game.getPlayerTurn() === users[socket.id].player) {
        opponent = game.getPlayerTurn() === 0 ? 1 : 0;
        currentPlayer = game.getPlayerTurn();
        //Si son arme est valide (=il a encore une charge dedans)
        if (!game.getPlayer(users[socket.id].player).isWeaponUsed(game.getPlayer(users[socket.id].player).getAttackMode())) {
          if (!game.isGameFinished()) {
            let tmpAttackMode = game.getPlayer(users[socket.id].player).getAttackMode(); //Je passe par une variable pour éviter le changement d'arme qui se fait suite au tir
            game.playerAttack(index, game.getGameMap(opponent));
            // Update game grids on both clients
            io.to(game.getPlayerId(currentPlayer)).emit('update', game.getSelfGridOnlyBoats(currentPlayer), game.getOpponentGridWithShipsHidden(currentPlayer), currentPlayer, game.getPlayerTurn());
            io.to(game.getPlayerId(opponent)).emit('update', game.getSelfGridOnlyBoats(opponent), game.getOpponentGridWithShipsHidden(opponent), opponent, game.getPlayerTurn());

            //If the player used a one-time-use-only weapon, tell him he has no charge left
            io.to(game.getPlayerId(currentPlayer)).emit('weaponUsed', tmpAttackMode);
            if (game.isGameFinished()) {
              checkGameOver(game);
            }
          }
        }

      }
    }
  });


  socket.on('changeWeapon', function (weapon) {
    let game = users[socket.id].inGame;
    //Si le joueur est dans une partie
    if (game !== null) {

      game.changeAttackMode(users[socket.id].player, weapon);
    }
  })

  joinWaitingPlayers();
});


//Création d'une partie pour les joueur en file d'attente
function joinWaitingPlayers() {
  let players = getClientsInRoom('queue');

  if (players.length >= 2) {
    // 2 joueurs en attente, on créer une partie
    let game = new shipWarsGame(gameIdCounter++, players[0], players[1]);
    // on créer une room pour la partie
    io.sockets.sockets.get(players[0]).leave('queue');
    io.sockets.sockets.get(players[1]).leave('queue');
    io.sockets.sockets.get(players[0]).join('game' + game.getGameId());
    io.sockets.sockets.get(players[1]).join('game' + game.getGameId());
    users[players[0]].player = 0;
    users[players[1]].player = 1;
    users[players[0]].opponent = 1;
    users[players[1]].opponent = 0;
    users[players[0]].inGame = game;
    users[players[1]].inGame = game;

    io.to('game' + game.getGameId()).emit('join', game.getGameId());

    // on envoit la position des bateaux
    io.to(players[0]).emit('update', game.getGameMap(0), game.getGrid(1, 0), 0, game.getPlayerTurn());
    io.to(players[1]).emit('update', game.getGameMap(1), game.getGrid(0, 1), 1, game.getPlayerTurn());

    console.log((new Date().toISOString()) + " " + players[0] + " and " + players[1] + " have joined game ID " + game.getGameId());
  }
}

//Trouve tous les sockets dans la file d'attente
function getClientsInRoom(room) {
  let clients = [];
  tmp = io.sockets.adapter.rooms.get(room).values();
  for (let id of io.sockets.adapter.rooms.get(room)) {
    clients.push(tmp.next().value);
  }
  return clients;
}

//Quitte la partie de l'utilisateur
function leaveGame(socket) {
  if (users[socket.id].inGame !== null) {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' left game ID ' + users[socket.id].inGame.getGameId());

    if (users[socket.id].inGame.getGameStatus() !== 2) {
      // La partie n'est pas terminée, on l'annule
      console.log("Game aborted");
      users[socket.id].inGame.abortGame(users[socket.id].player);
      console.log("users[socket.id]");
      console.log(users[socket.id]);
      io.to(users[socket.id].inGame.getPlayerId(users[socket.id].opponent)).emit('gameover', users[socket.id].inGame.getWinner(), users[socket.id].inGame.getWinner());
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.getGameId());

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

//Notifie le joueur si la partie est terminée
function checkGameOver(game) {
  if (game.getGameStatus() === 2) {
    console.log((new Date().toISOString()) + ' Game ID ' + game.getGameId() + ' ended.');
    io.to(game.getWinner()).emit('gameover', game.getWinner(), game.getWinner());
    io.to(game.getLoser()).emit('gameover', game.getLoser(), game.getWinner());

    let winner = game.getWinner()
    console.log("winner ",winner);
    //ajout score au SQL
    batNavSQL.query("SELECT * FROM tab", function (err, result, fields) {
      if (err) throw err;
      let superi;
      let userExist = false;
      for(i = 0; i < result.length; i++){//on trouve l'user
        console.log(users[winner].username, result[i].User);
          if(result[i].User == users[winner].username){ //remplacer login pour socket
              userExist = true;
              superi = i;
              i = result.length;
          }}

      if(userExist){
        console.log('incrémentation du score du joueur connecté');
        batNavSQL.query("UPDATE tab SET NbVic =? WHERE User =?", [result[superi].NbVic, users[winner].username], function (err, result) {
          if (err) throw err;
          console.log(result.affectedRows + " record(s) updated");
        });
      }
      else{
        console.log('pas d\'incrémentation du score pour joueur non connecté');
      }
    });
  }
}


http.listen(4200, () => {
  console.log('Serveur lancé sur le port 4200');
});

/**** Config BDD ****/
//init bdd
const batNavSQL = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "batnav"
})

//verif accès au lancement
batNavSQL.connect( err => {
  if (err) throw err;
  else console.log('Connexion à la base de donnée OK');
})

//login
app.post('/login', body('login'), (req, res) => {
  const login = req.body.login;
  const password = req.body.password;
  console.log("combinaison connexion test:",login,password);



  // Error management
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log(errors);
      //return res.status(400).json({ errors: errors.array() });
  } else {
      //Test des mdps
      let userExist = false; //si user existe
      batNavSQL.query("SELECT * FROM tab", function (err, result, fields) {
          if (err) throw err;
          let superi;
          for(i = 0; i < result.length; i++){//on trouve l'user
              if(result[i].User == login){
                  userExist = true;
                  superi = i;
              }
          }
          if(userExist){
              if(result[superi].MDP == password){ // l'user a le bon mdp
                  console.log("bonne combinaison");
                  req.session.username = login;
                  req.session.password = password;
                  req.session.save();
                  res.redirect('/');
                  //socket.emit('update_username', session.login); a mettre ailleurs en ft
              }
              else{
                  console.log("mauvaise combinaison user/mdp")
              }
          }
          else{
              console.log("cet utilisateur n'existe pas")
          }
      });
  }
});

//register
app.post('/register', body('register'), (req, res) => {
  const Rlogin = req.body.Rlogin;
  const Rpassword = req.body.Rpassword;
  const Rpassword2 = req.body.Rpassword2;
  console.log("combinaison inscription:",Rlogin,Rpassword,Rpassword2);

  // Error management
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log('Erreur validation');
      //return res.status(400).json({ errors: errors.array() });
  } else {
      //Test des mdps si les 2 inscrits sont ==
      if(Rpassword == Rpassword2){
          //verif si username déjà utilisé
          used = false;
          batNavSQL.query("SELECT * FROM tab", function (err, result, fields) {
              if (err) throw err;
              for(i = 0; i < result.length; i++){
                  if(result[i].User == Rlogin){ // /!\
                      used = true; 
                  }
              }

          //envois de l'insc seulement si username unused
          if(used == false){
              let sql = "INSERT INTO tab ( User, MDP, NbVic ) VALUES (?,?,0)";
              batNavSQL.query(sql,[Rlogin, Rpassword], (err, result) => {
                  if (err) throw err;
                  console.log("Nouveau utilisateur enregistré");
                  console.log(result);
              })
          }
          else{
              console.log("Nom d'utilisateur déjà prit ):");
          }
          });
      }
      else{
          console.log('MDPs non égaux');
      }
  }
});


//menu du haut
app.get('/index.html', function (req, res) {
  res.sendFile('views/index.html', {
      root: __dirname
  });
});
app.get('/play.html', function (req, res) {
  res.sendFile('views/play.html', {
      root: __dirname
  });
});
app.get('/leaderboard.ejs', function (req, res) {
  res.sendFile('views/leaderboard.html', {
      root: __dirname
  });
});
app.get('/inscription.html', function (req, res) {
  res.sendFile('views/inscription.html', {
      root: __dirname
  });
});

//leaderboard a refaire
app.get("/leaderboard.html", (req, res) => {
  let leaderboard = [];
  let Scoreboard = [];
  batNavSQL.query("SELECT User as User, NbVic as NbVic FROM tab ORDER BY NbVic DESC", (err, result) => {
      if (err) throw err;
      console.log(result);
      result.forEach(element => {
          leaderboard.push(element.User)
          Scoreboard.push(element.NbVic)
      });
      console.log(leaderboard);
      res.render(path.join(__dirname, "views", "leaderboard"), {
          top_1: leaderboard[0],
          S_1: Scoreboard[0],

          top_2: leaderboard[1],
          S_2: Scoreboard[1],

          top_3: leaderboard[2],
          S_3: Scoreboard[2],

          top_4: leaderboard[3],
          S_4: Scoreboard[3],

          top_5: leaderboard[4],
          S_5: Scoreboard[4],

          top_6: leaderboard[5],
          S_6: Scoreboard[5],

          top_7: leaderboard[6],
          S_7: Scoreboard[6],

          top_8: leaderboard[7],
          S_8: Scoreboard[7],

          top_9: leaderboard[8],
          S_9: Scoreboard[8],

          top_10: leaderboard[9],
          S_10: Scoreboard[9]

      });
  });
})