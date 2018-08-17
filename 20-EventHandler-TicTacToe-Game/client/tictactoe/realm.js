'use strict';

import Realm from 'realm';

export class GameSchema extends Realm.Object {}
GameSchema.schema = {
    name: 'GameState',
    properties: {
      cell_0_0:  {type: 'int', default: 0},//player X is 1, player O is 2
      cell_0_1:  {type: 'int', default: 0},
      cell_0_2:  {type: 'int', default: 0},
      cell_1_0:  {type: 'int', default: 0},
      cell_1_1:  {type: 'int', default: 0},
      cell_1_2:  {type: 'int', default: 0},
      cell_2_0:  {type: 'int', default: 0},
      cell_2_1:  {type: 'int', default: 0},
      cell_2_2:  {type: 'int', default: 0},
      gameStatus: {type: 'int', default: -1} // -1 not started, 0 started, 1 player one (X) won, 2 player 2 (O) won, 3 draw 
    }
  };
