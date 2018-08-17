'use strict';

var fs = require('fs');
var Realm = require('realm');
var ticTacToeAiEngine = require("tic-tac-toe-ai-engine");

// Transforme the Realm model into the game state format understood by ticTacToeAiEngine  
function modelToGameState(gameState) {
    var state = [gameState.cell_0_0 === 1 ? 'X' : gameState.cell_0_0 === 2 ? 'O' : '',
    gameState.cell_0_1 === 1 ? 'X' : gameState.cell_0_1 === 2 ? 'O' : '',
    gameState.cell_0_2 === 1 ? 'X' : gameState.cell_0_2 === 2 ? 'O' : '',
    gameState.cell_1_0 === 1 ? 'X' : gameState.cell_1_0 === 2 ? 'O' : '',
    gameState.cell_1_1 === 1 ? 'X' : gameState.cell_1_1 === 2 ? 'O' : '',
    gameState.cell_1_2 === 1 ? 'X' : gameState.cell_1_2 === 2 ? 'O' : '',
    gameState.cell_2_0 === 1 ? 'X' : gameState.cell_2_0 === 2 ? 'O' : '',
    gameState.cell_2_1 === 1 ? 'X' : gameState.cell_2_1 === 2 ? 'O' : '',
    gameState.cell_2_2 === 1 ? 'X' : gameState.cell_2_2 === 2 ? 'O' : '',];
    return state;
}

// Update the model with the next move from the ticTacToeAiEngine
function gameStateToModel(realm, model, nextMove) {
    realm.write(() => {
        if (nextMove.winner === 'X') {
            model.gameStatus = 1;
        } else if (nextMove.winner === 'O') {
            model.gameStatus = 2;
        } else {
            var isDraw = true;
            for (var i = 0; i < nextMove.nextBestGameState.length; i++) {
                if (nextMove.nextBestGameState[i] === '') {
                    isDraw = false;
                    break;
                }
            }
            if (isDraw) {
                model.gameStatus = 3;
            } else {
                model.gameStatus = 0;
            }
        }

        model.cell_0_0 = nextMove.nextBestGameState[0] === 'X' ? 1 : nextMove.nextBestGameState[0] === 'O' ? 2 : 0;
        model.cell_0_1 = nextMove.nextBestGameState[1] === 'X' ? 1 : nextMove.nextBestGameState[1] === 'O' ? 2 : 0;
        model.cell_0_2 = nextMove.nextBestGameState[2] === 'X' ? 1 : nextMove.nextBestGameState[2] === 'O' ? 2 : 0;
        model.cell_1_0 = nextMove.nextBestGameState[3] === 'X' ? 1 : nextMove.nextBestGameState[3] === 'O' ? 2 : 0;
        model.cell_1_1 = nextMove.nextBestGameState[4] === 'X' ? 1 : nextMove.nextBestGameState[4] === 'O' ? 2 : 0;
        model.cell_1_2 = nextMove.nextBestGameState[5] === 'X' ? 1 : nextMove.nextBestGameState[5] === 'O' ? 2 : 0;
        model.cell_2_0 = nextMove.nextBestGameState[6] === 'X' ? 1 : nextMove.nextBestGameState[6] === 'O' ? 2 : 0;
        model.cell_2_1 = nextMove.nextBestGameState[7] === 'X' ? 1 : nextMove.nextBestGameState[7] === 'O' ? 2 : 0;
        model.cell_2_2 = nextMove.nextBestGameState[8] === 'X' ? 1 : nextMove.nextBestGameState[8] === 'O' ? 2 : 0;
    });
}
// The URL to the Realm Object Server
//format should be: 'IP_ADDRESS:port'  like example below 
//var SERVER_URL = '127.0.0.1:9080';
var SERVER_URL = 'REPLACE_ME.cloud.realm.io';

// The path used by the global notifier to listen for changes across all
// Realms that match.
var NOTIFIER_PATH = '^/([^/]+)/tictactoe$';

//enable debugging if needed 
//Realm.Sync.setLogLevel('all');

let adminUser = undefined
//INSERT HANDLER HERE
var handleChange = async function (changeEvent) {
    const realm = changeEvent.realm;
    const gameStates = realm.objects('GameState');//should be only one game per user 
    var gameState = gameStates[0];

    if (gameState != undefined) {
        const board = modelToGameState(gameState);
        const nextMove = ticTacToeAiEngine.computeMove(board);
        gameStateToModel(realm, gameState, nextMove);
    }
}

async function main() {
    adminUser = await Realm.Sync.User.login(`https://${SERVER_URL}`, 'REPLACE_ME_ADMIN_USER', 'REPLACE_ME_PASSWORD')
    Realm.Sync.addListener(`realms://${SERVER_URL}`, adminUser, NOTIFIER_PATH, 'change', handleChange);
    console.log('listening');
}

main()