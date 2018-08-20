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
        let game = this.state.realm.create('GameState', {
          cells: [0,0,0,0,0,0,0,0,0]
        });
        game.cells[position] = 1;
      });
    } else {
      // check if the move is allowed (i.e ignore clicks on already set cells)
      if (gameSchemas[0].cells[position] === 0) {
        this.state.realm.write(() => {
          this.state.currentGame.cells[position] = 1;
        });
      }
    }
  }

  getImageForState(game, position) {
    if (game === undefined) {
      return require('./empty.png');
    }
    return game.cells[position] === 1 ? require('./player1.png') : game.cells[position] === 2 ? require('./player2.png') : require('./empty.png');
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