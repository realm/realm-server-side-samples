const Realm = require('realm');
const twilio = require('twilio')

const twilioClient = twilio('REPLACE_ME', 'REPLACE_ME')
const twilioPhoneNumber = 'REPLACE_ME'

// copy your instance URL here
const NOTIFIER_PATH = '/textmessages'
var SERVER_URL = '//REPLACE_ME';

const TextMessageSchema = {
  name: 'TextMessage',
  properties: {
    toPhoneNumber: 'string',
    text: { type: 'string', default: '' }
  }
};

async function main() {
  const adminUser = await Realm.Sync.User.login(`https:${SERVER_URL}`, 'realm-admin', 'REPLACE_ME')
  Realm.Sync.addListener(`realm:${SERVER_URL}`, adminUser, NOTIFIER_PATH, 'change', async (changeEvent) => {
    const textMessages = realm.objects('TextMessage');
    const insertedNotificationsIndices = changeEvent.changes.Notification.insertions;
    for (let index of insertedNotificationsIndices) {
      const textMessage = notifications[index]
      await twilioClient.messages.create({
        body: textMessage.text,
        to: textMessage.phoneNumber,
        from: twilioPhoneNumber
      })
    }
  });
}