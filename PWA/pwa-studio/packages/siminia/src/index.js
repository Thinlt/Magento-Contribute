import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloLink } from 'apollo-link';
import { setContext } from 'apollo-link-context';
import { RetryLink } from 'apollo-link-retry';

import { Util } from '@magento/peregrine';
import { Adapter } from '@magento/venia-drivers';
import store from './store';
import app from '@magento/peregrine/lib/store/actions/app';
import { AppContextProvider } from '@magento/venia-ui/lib/components/App';
import App from 'src/simi';

import { registerSW } from './registerSW';
import './index.css';

const { BrowserPersistence } = Util;
//simi use direct magento url to call graphql if defined on config:
//const apiBase = new URL('/graphql', location.origin).toString();
const apiBase = (window.SMCONFIGS && window.SMCONFIGS.directly_request && window.SMCONFIGS.merchant_url) ?
    new URL('', window.SMCONFIGS.merchant_url + 'graphql').toString() :
    new URL('/graphql', location.origin).toString();

/**
 * The Venia adapter provides basic context objects: a router, a store, a
 * GraphQL client, and some common functions.
 */

// The Venia adapter is not opinionated about auth.
const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists.
    const storage = new BrowserPersistence();
    const token = storage.getItem('signin_token');

    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : ''
        }
    };
});

// @see https://www.apollographql.com/docs/link/composition/.
const apolloLink = ApolloLink.from([
    // by default, RetryLink will retry an operation five (5) times.
    new RetryLink(),
    authLink,
    // An apollo-link-http Link
    Adapter.apolloLink(apiBase)
]);

ReactDOM.render(
    <Adapter apiBase={apiBase} apollo={{ link: apolloLink }} store={store}>
        {/*<AppContextProvider> comment out due to error with cart (from rest to graphql) make error on peregrint context provider*/}
            <App />
        {/*</AppContextProvider>*/}
    </Adapter>,
    document.getElementById('root')
);

registerSW();

window.addEventListener('online', () => {
    store.dispatch(app.setOnline());
});
window.addEventListener('offline', () => {
    store.dispatch(app.setOffline());
});

if (module.hot) {
    // When any of the dependencies to this entry file change we should hot reload.
    module.hot.accept();
}