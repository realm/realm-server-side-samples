import { BasicServer, FileConsoleLogger, auth } from 'realm-object-server'
import * as path from 'path'

const server = new BasicServer()

server.start({
        // For all the full list of configuration parameters see:
        // https://realm.io/docs/realm-object-server/latest/api/ros/interfaces/serverconfig.html
        dataPath: path.join(__dirname, '../data'),
        authProviders: [new auth.NicknameAuthProvider()]
    })
    .then(() => {
        console.log(`Realm Object Server was started on ${server.address}`)
    })
    .catch(err => {
        console.error(`Error starting Realm Object Server: ${err.message}`)
    })
