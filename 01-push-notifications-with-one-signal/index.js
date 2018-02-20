const Realm = require('realm');

// copy your instance URL here
var SERVER_URL = '//REPLACE_ME';

async function main() {
  const adminUser = await Realm.Sync.User.login(`https:${SERVER_URL}`, 'realm-admin', '')
  Realm.Sync.addListener(`realm:${SERVER_URL}`, adminUser, NOTIFIER_PATH, 'change', handleChange);
}