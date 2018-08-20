'use strict';

var fs = require('fs');
var Realm = require('realm');
var ticTacToeAiEngine = require("tic-tac-toe-ai-engine");

// Transforme the Realm model into the game state format understood by ticTacToeAiEngine  
function modelToGameState(gameState) {
    var state = [];
    for (var i = 0; i < gameState.cells.length; i++) {
        switch (gameState.cells[i]) {
            case 1:
                state.push('X');
                break;
            case 2:
                state.push('O');
                break;
            default:
                state.push('');                    
        }
    }
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

        for (var i = 0; i < 9; i++) {
            switch(nextMove.nextBestGameState[i]) {
                case 'X': 
                    model.cells[i] = 1;
                    break;
                case 'O': 
                    model.cells[i] = 2;
                    break; 
                default:
                    model.cells[i] = 0;                           
            }            
        }
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