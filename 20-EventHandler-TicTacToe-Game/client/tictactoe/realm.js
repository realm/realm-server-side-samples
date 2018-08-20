'use strict';

import Realm from 'realm';

export class GameSchema extends Realm.Object {}
  GameSchema.schema = {
    name: 'GameState',
    properties: {
      cells: 'int[]',//player X is 1, player O is 2
      gameStatus: {type: 'int', default: -1} // -1 not started, 0 started, 1 player one (X) won, 2 player 2 (O) won, 3 draw 
    }
  };
  