const Realm = require('realm');
const OneSignal = require('onesignal-node');

const oneSignalClient = new OneSignal.Client({
  userAuthKey: 'REPLACE_ME',
  // note that "app" must have "appAuthKey" and "appId" keys
  app: { appAuthKey: 'REPLACE_ME', appId: 'REPLACE_ME' }
});

// copy your instance URL here
const NOTIFIER_PATH = '/emails'
const SERVER_URL = '//REPLACE_ME';

const EmailSchema = {
  name: 'Email',
  properties: {
    toEmails: 'string[]',
    text: { type: 'string', default: '' }
  }
};

async function main() {
  const adminUser = await Realm.Sync.User.login(`https:${SERVER_URL}`, 'realm-admin', 'REPLACE_ME')
  Realm.Sync.addListener(`realm:${SERVER_URL}`, adminUser, NOTIFIER_PATH, 'change', async (changeEvent) => {
    const notifications = Realm.objects('Notification');
    const insertedNotificationsIndices = changeEvent.changes.Notification.insertions;

    for (let index of insertedNotificationsIndices) {
      const notification = notifications[index]
      const oneSignalNotification = new OneSignal.Notification({
        contents: {
          en: notification.text
        }
      });
      oneSignalNotification.setTargetDevices(notification.toUserIds.splice())
      await oneSignalClient(oneSignalNotification)
    }
  });
}
