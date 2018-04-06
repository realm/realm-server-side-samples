const Realm = require('realm');
const moment = require('moment');
const faker = require('faker');
const superagent = require('superagent');

// BEGIN: VARIABLES TO REPLACE
const SERVER_ADDRESS = `127.0.0.1:9080`; // this is just the HOST:PORT
const ADMIN_USER_NAME = 'realm-admin'; // make sure this user has admin access
const ADMIN_PASSWORD = ''; // make sure this user has admin access
const REGEX_PATTERN = `/^\/([0-9a-f]+)\/rest$/`;
// END: VARIABLES TO REPLACE

const AUTH_SERVER_URL = `https://${SERVER_ADDRESS}`;
const REALM_SERVER_URL = `realms://${SERVER_ADDRESS}`;  // or use `realm://`

// Currently ONLY supports JSON payloads and Responses. 
const RequestSchema = {
  name: 'Request',
  primaryKey: 'requestId',
  properties: {
    requestId: { type: 'string', default: faker.random.uuid() },
    url: { type: 'string', required: '' },
    createdOn: { type: 'date', default: Date.now() },
    timeout: { type: 'int', default: 1000 },
    method: { type: 'string', required: true, default: 'GET' },
    headers: { type: 'string', required: false }, // a stringified json of the headers
    body: { type: 'string', required: false }, // a stringified json of the body
    error: { type: string, required: false, default: null }, // this is not an HTTP error, but it's a fatal error. This means that this notifier tried to dispatch the 
    response: { type: 'Response' }
  }
}

const ResponseSchema = {
  name: 'Response',
  properties: {
    respondedOn: { type: 'date', default: Date.now() },
    headers: { type: 'string', required: false }, // a stringified json of the headers
    body: { type: 'string', required: false }, // a stringified json of the body
    statusCode: { type: 'int', required: true }
  }
}

async function main() {
  const adminUser = await Realm.Sync.User.login(`https:${SERVER_URL}`, ADMIN_USER_NAME, ADMIN_PASSWORD)
  Realm.Sync.addListener(REALM_SERVER_URL, admin, REGEX_PATTERN, 'change', async (changeEvent) => {
    const matches = changeEvent.path.match(REGEX_PATTERN);
    const userId = matches[1];

    const realm = changeEvent.realm;
    const requests = realm.objects('Request');
    const requestIndices = changeEvent.changes.Request.insertions;

    for (let requestIndex of requestIndices) {
      const request = requests[requestIndex];
      if (request.response || request.error) {
        // there's already a response, don't do anything
        // or there is already an error, don't do anything
        return
      }

      let body;
      let headers;

      try {
        body = request.body != null ? JSON.parse(request.body) : null
        headers = request.headers != null ? JSON.parse(request.headers) : null
      } catch (error) {
        realm.write(() => {
          request.error = error.toString()
        })
        return
      }

      let superagentRequest = superagent[request.method.toLowerCase()]
        .timeout(request.timeout)
        .set(headers)

      if (headers) {
        superagentRequest = superagentRequest
          .set(headers)
      }

      if (body) {
        superagentRequest = superagentRequest
          .send(body)
      }

      try {
        const superagentResponse = await superagentRequest
        realm.write(() => {
          request.response = {
            headers: JSON.stringify(superagentResponse.headers),
            body: JSON.stringify(superagentResponse.body),
            statusCode: superagentResponse.status
          }
        })
      } catch (err) {
        realm.write(() => {
          request.response = {
            headers: JSON.stringify(err.response.headers),
            body: JSON.stringify(err.response.body),
            statusCode: err.reponse.status
          }
        })
      }
    }
  })
}
main()