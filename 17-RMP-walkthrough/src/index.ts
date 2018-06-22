import * as Realm from "realm";
import { Credentials, User, GraphQLConfig } from "realm-graphql-client";
import { concat, split } from "apollo-link";
import { fetch } from "cross-fetch";
import { HttpLink } from "apollo-link-http";
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { WebSocketLink } from 'apollo-link-ws';
import * as ws from "ws";
import { getMainDefinition } from 'apollo-utilities';
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import * as constants from './constants';

async function testGraphQL() {
    const credentials = Credentials.usernamePassword(constants.username, constants.password);
    const user = await User.authenticate(credentials, `https://${constants.serverUrl}`);

    const config = await GraphQLConfig.create( 
        user,
        '/default'
    );

    const client = setupGraphQL(config);

   const response = await client.query({
    query: gql`
      query {
        items {
          itemId
          body
        }
      }
    `
  });
  console.log(response.data);


    while (true) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

function setupGraphQL(config: GraphQLConfig) {
    const httpLink = concat(
        config.authLink,
        // Note: if using node.js, you'll need to provide fetch as well.
        new HttpLink({ uri: config.httpEndpoint, fetch })
    );

    const webSocketLink = new WebSocketLink({
        uri: config.webSocketEndpoint,
        options: {
            connectionParams: config.connectionParams,
        },
        webSocketImpl: ws
    });

    const link = split(({ query }) => {
            const definition = getMainDefinition(query);
            return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
        },
        webSocketLink,
        httpLink);
    
    return new ApolloClient({
        link: link,
        cache: new InMemoryCache()
    });
}

testGraphQL();