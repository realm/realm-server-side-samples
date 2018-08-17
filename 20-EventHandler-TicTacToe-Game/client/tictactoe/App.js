import React from 'react';
import { StyleSheet, Text, View, Image, TouchableWithoutFeedback, TouchableOpacity, Alert, Button } from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";
import { GameSchema } from './realm';
import Realm from 'realm';

export default class TicTacToeBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
      currentGame: undefined
    };
  }

  componentWillMount() {
    Realm.Sync.User.login('https://REPLACE_ME.cloud.realm.io', 'REPLACE_ME_USER', 'REPLACE_ME_PASSWORD').then(user => {
      Realm.open({
        schema: [GameSchema],
        sync: {
          user: user,
          url: 'realms://REPLACE_ME.cloud.realm.io/~/tictactoe',
          error: err => console.log(err)
        }
      }).then(realm => {
        this.setState({ isReady: true, currentGame: realm.objects('GameState')[0], realm: realm });

        // register the listener 
        realm.addListener('change', (realm) => {
          this.setState(previousState => {
            if (previousState.currentGame === undefined) {
              return { isReady: true, currentGame: realm.objects('GameState')[0] }
            }
            return previousState;
          });
        });
      });
    }).catch(error => {
      // an auth error has occurred
    });
  }

  _onPressButton(position) {
    let gameSchemas = this.state.realm.objects('GameState');
    if (gameSchemas.length < 1) {
      this.state.realm.write(() => {
        let game = this.state.realm.create('GameState', {});
        this.setPlayerMove(game, position);
      });
    } else {
      // check if the move is allowed (i.e ignore clicks on already set cells)
      let cell = this.findCellFromPosition(gameSchemas[0], position);
      if (cell == 0) {
        this.state.realm.write(() => {
          this.setPlayerMove(gameSchemas[0], position);
        });
      }
    }
  }

  setPlayerMove(game, position) {
    switch (position) {
      case 0:
        game.cell_0_0 = 1;
        break;
      case 1:
        game.cell_1_0 = 1;
        break;
      case 2:
        game.cell_2_0 = 1;
        break;
      case 3:
        game.cell_0_1 = 1;
        break;
      case 4:
        game.cell_1_1 = 1;
        break;
      case 5:
        game.cell_2_1 = 1;
        break;
      case 6:
        game.cell_0_2 = 1;
        break;
      case 7:
        game.cell_1_2 = 1;
        break;
      case 8:
        game.cell_2_2 = 1;
        break;
    }
  }

  getImageForState(game, position) {
    if (game === undefined) {
      return require('./empty.png');
    }
    switch (position) {
      case 0:
        return game.cell_0_0 === 1 ? require('./player1.png') : game.cell_0_0 === 2 ? require('./player2.png') : require('./empty.png');
      case 1:
        return game.cell_1_0 === 1 ? require('./player1.png') : game.cell_1_0 === 2 ? require('./player2.png') : require('./empty.png');
      case 2:
        return game.cell_2_0 === 1 ? require('./player1.png') : game.cell_2_0 === 2 ? require('./player2.png') : require('./empty.png');
      case 3:
        return game.cell_0_1 === 1 ? require('./player1.png') : game.cell_0_1 === 2 ? require('./player2.png') : require('./empty.png');
      case 4:
        return game.cell_1_1 === 1 ? require('./player1.png') : game.cell_1_1 === 2 ? require('./player2.png') : require('./empty.png');
      case 5:
        return game.cell_2_1 === 1 ? require('./player1.png') : game.cell_2_1 === 2 ? require('./player2.png') : require('./empty.png');
      case 6:
        return game.cell_0_2 === 1 ? require('./player1.png') : game.cell_0_2 === 2 ? require('./player2.png') : require('./empty.png');
      case 7:
        return game.cell_1_2 === 1 ? require('./player1.png') : game.cell_1_2 === 2 ? require('./player2.png') : require('./empty.png');
      case 8:
        return game.cell_2_2 === 1 ? require('./player1.png') : game.cell_2_2 === 2 ? require('./player2.png') : require('./empty.png');
    }
  }

  findCellFromPosition(game, position) {
    switch (position) {
      case 0:
        return game.cell_0_0;
      case 1:
        return game.cell_1_0;
      case 2:
        return game.cell_2_0;
      case 3:
        return game.cell_0_1;
      case 4:
        return game.cell_1_1;
      case 5:
        return game.cell_2_1;
      case 6:
        return game.cell_0_2;
      case 7:
        return game.cell_1_2;
      case 8:
        return game.cell_2_2;
    }
  }

  render() {
    if (!this.state.isReady) {
      return (
        <Text> Opening Realm ... </Text>
      );
    } else {
      return (
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* display score if the game is over */}
          {(this.state.currentGame != undefined && this.state.currentGame.gameStatus > 0) &&
            <View>
              {this.state.currentGame.gameStatus == 1 &&
                <Text> Game Over, X Won!  </Text>
              }

              {this.state.currentGame.gameStatus == 2 &&
                <Text> Game Over, O Won!  </Text>
              }

              {this.state.currentGame.gameStatus == 3 &&
                <Text> Game Over, Draw!  </Text>
              }
              <Button
                onPress={() => {
                  this.state.realm.write(() => {
                    this.state.realm.delete(this.state.currentGame);
                    this.state.currentGame = undefined;
                  });
                }}
                title="New Game"
              />
            </View>
          }

          <Grid style={styles.container}>
            <Col style={{ height: 300, width: 100 }}>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 0)}>
                  <Image source={this.getImageForState(this.state.currentGame, 0)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 1)}>
                  <Image source={this.getImageForState(this.state.currentGame, 1)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 2)}>
                  <Image source={this.getImageForState(this.state.currentGame, 2)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
            </Col>
            <Col style={{ height: 300, width: 100 }}>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 3)}>
                  <Image source={this.getImageForState(this.state.currentGame, 3)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 4)}>
                  <Image source={this.getImageForState(this.state.currentGame, 4)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 5)}>
                  <Image source={this.getImageForState(this.state.currentGame, 5)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
            </Col>
            <Col style={{ height: 300, width: 100 }}>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 6)}>
                  <Image source={this.getImageForState(this.state.currentGame, 6)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 7)}>
                  <Image source={this.getImageForState(this.state.currentGame, 7)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
              <Row style={styles.border}>
                <TouchableWithoutFeedback
                  onPress={this._onPressButton.bind(this, 8)}>
                  <Image source={this.getImageForState(this.state.currentGame, 8)} style={styles.cell} />
                </TouchableWithoutFeedback>
              </Row>
            </Col>
          </Grid>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: 100,
    height: 100
  },
  border: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  }
});