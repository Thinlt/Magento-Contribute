import { sendRequest } from 'src/simi/Network/RestMagento';

import { useEffect } from 'react';
import { useMutation } from '@apollo/react-hooks';

import PAYPAL_TOKEN_MUTATION from 'src/simi/queries/payment/createPaypalExpressToken.graphql';
import PAYPAL_SETPAYPMENT_MUTATION from 'src/simi/queries/payment/setPaymentMethodOnCart.graphql';

export const paypalExpressStart = (callBack, getParams) => {
    sendRequest(`/rest/V1/simiconnector/ppexpressapis/start`, callBack, 'GET', getParams)
}

export const paypalPlaceOrder = (callBack, getParams) => {
    sendRequest(`/rest/V1/simiconnector/ppexpressapis/placeOrder`, callBack, 'GET', getParams)
}


export const paypalExpressCreateToken = (cartId, callBack = ()=>{}) => {
    let dataGraphql = {};
    const [createToken, { data, loading, error, called }] = useMutation(PAYPAL_TOKEN_MUTATION);
    if (data && data.createPaypalExpressToken) dataGraphql = data.createPaypalExpressToken;
    useEffect(() => {
        createToken({ variables: { cartId: cartId } });
    }, [])
    useEffect(() => {
        console.log(dataGraphql)
        if (dataGraphql) callBack(dataGraphql);
    }, [dataGraphql])
    
    return { data: dataGraphql, loading, error, called }
}

export const paypalExpressSetPayment = (cartId, payerId, token, callBack = ()=>{}) => {
    let dataGraphql = {};
    const [setPaymentMethodOnCart, { data, loading, error, called }] = useMutation(PAYPAL_SETPAYPMENT_MUTATION);
    if (data && data.setPaymentMethodOnCart) dataGraphql = data.setPaymentMethodOnCart;
    useEffect(() => {
        setPaymentMethodOnCart({ variables: { cartId: cartId, payerId: payerId, token: token }});
    }, [])
    useEffect(() => {
        if (dataGraphql) callBack(dataGraphql);
    }, [dataGraphql])
    return { data: dataGraphql, loading, error, called }
}