import { Util, RestApi } from '@magento/peregrine';
import actions from './actions';
import userActions from 'src/actions/user/actions';
import checkoutActions from 'src/actions/checkout/actions';
import checkoutReceiptActions from 'src/actions/checkoutReceipt';
import cartActions from 'src/actions/cart/actions';
import { getCartDetails, clearCartId, removeCart } from 'src/actions/cart';
import { getUserDetails, setToken } from 'src/actions/user';
import isObjectEmpty from 'src/util/isObjectEmpty';
import Identify from 'src/simi/Helper/Identify';
import { refresh } from 'src/util/router-helpers';

//const { request } = RestApi.Magento2;
import { request } from 'src/simi/Network/RestMagento'
import {getAllowedCountries} from 'src/simi/Helper/Countries'

const { BrowserPersistence } = Util;
const storage = new BrowserPersistence();

export const beginCheckout = () =>
    async function thunk(dispatch) {
        dispatch(checkoutActions.begin());
        dispatch(getShippingMethods());
    };

export const changeSampleValue = value => async dispatch => {
    dispatch(actions.changeSampleValue(value));
}

export const simiSignedIn = response => async dispatch => {
    dispatch(setToken(response));
    dispatch(getUserDetails()).then(() => dispatch(fullFillAddress()));
    dispatch(removeCart());
    dispatch(getCartDetails({ forceRefresh: true }));
    // dispatch(fullFillAddress());
}

export const simiSignOut = ({ history }) => async dispatch => {

    // Sign the user out in local storage and Redux.
    await clearToken();

    // Now that we're signed out, forget the old (customer) cart
    // and fetch a new guest cart.
    dispatch(removeCart());
    dispatch(getCartDetails({ forceRefresh: true }));

    // remove address
    storage.removeItem('cartId');
    storage.removeItem('signin_token');
    sessionStorage.removeItem("shipping_address");
    sessionStorage.removeItem("billing_address");
    await clearBillingAddress();
    await clearShippingAddress();

    // Finally, go back to the first page of the browser history.
    refresh({ history });
};

export const toggleMessages = value => async dispatch => {
    dispatch(actions.toggleMessages(value));
}

export const submitShippingAddress = payload =>
    async function thunk(dispatch, getState) {
        dispatch(checkoutActions.shippingAddress.submit(payload));
        const { cart, user } = getState();

        const { cartId } = cart;
        if (!cartId) {
            throw new Error('Missing required information: cartId');
        }

        const countries = getAllowedCountries()
        let { formValues: address } = payload;
        try {
            address = Identify.formatAddress(address, countries);
        } catch (error) {
            dispatch(
                checkoutActions.shippingAddress.reject({
                    incorrectAddressMessage: error.message
                })
            );
            return null;
        }
        dispatch(actions.changeCheckoutUpdating(true));
        await saveShippingAddress(address);
        dispatch(checkoutActions.shippingAddress.accept(address));

        const guestEndpoint = `/rest/V1/guest-carts/${cartId}/estimate-shipping-methods`;
        const authedEndpoint =
            '/rest/V1/carts/mine/estimate-shipping-methods';
        const endpoint = user.isSignedIn ? authedEndpoint : guestEndpoint;

        if (address && address.region_code && !address.region) {
            address['region'] = address.region_code;
            delete address.region_code;
        }

        const response = await request(endpoint, {
            method: 'POST',
            body: JSON.stringify({address})
        });
        dispatch(actions.changeCheckoutUpdating(false));
        dispatch(checkoutActions.getShippingMethods.receive(response));
    };

export const getShippingMethods = () => {
    return async function thunk(dispatch, getState) {
        const { cart, user, checkout } = getState();
        const { cartId } = cart;

        try {
            // if there isn't a guest cart, create one
            // then retry this operation
            if (!cartId) {
                await dispatch(createCart());
                return thunk(...arguments);
            }

            dispatch(checkoutActions.getShippingMethods.request(cartId));

            const guestEndpoint = `/rest/V1/guest-carts/${cartId}/estimate-shipping-methods`;
            const authedEndpoint =
                '/rest/V1/carts/mine/estimate-shipping-methods';
            const endpoint = user.isSignedIn ? authedEndpoint : guestEndpoint;
            let s_address = {
                country_id: 'US',
                postcode: null
            };
            if (checkout.shippingAddress) {
                s_address = checkout.shippingAddress;
                if (checkout.shippingAddress.region_code && !checkout.shippingAddress.region) {
                    s_address['region'] = checkout.shippingAddress.region_code;
                    delete s_address.region_code;
                }
            }

            const response = await request(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    address: s_address
                })
            });

            dispatch(checkoutActions.getShippingMethods.receive(response));
        } catch (error) {
            const { response } = error;

            dispatch(checkoutActions.getShippingMethods.receive(error));

            // check if the guest cart has expired
            if (response && response.status === 404) {
                // if so, clear it out, get a new one, and retry.
                await clearCartId();
                await dispatch(createCart());
                return thunk(...arguments);
            }
        }
    };
};

export const submitBillingAddress = payload =>
    async function thunk(dispatch, getState) {
        dispatch(checkoutActions.billingAddress.submit(payload));

        const { cart } = getState();

        const { cartId } = cart;
        if (!cartId) {
            throw new Error('Missing required information: cartId');
        }

        let desiredBillingAddress = payload;
        if (!payload.sameAsShippingAddress) {
            const countries = getAllowedCountries()
            try {
                desiredBillingAddress = Identify.formatAddress(payload, countries);
            } catch (error) {
                dispatch(checkoutActions.billingAddress.reject(error));
                return;
            }
        }

        await saveBillingAddress(desiredBillingAddress);
        dispatch(checkoutActions.billingAddress.accept(desiredBillingAddress));
    };

export const fullFillAddress = () => {
    return async function thunk(dispatch, getState) {
        const { user, checkout } = getState();
        const { currentUser } = user;
        if (user && user.isSignedIn && currentUser && currentUser.hasOwnProperty('addresses') && currentUser.addresses.length) {
            const { addresses, default_shipping, default_billing } = currentUser;
            const { shippingAddress, billingAddress } = checkout;

            if (!shippingAddress && default_shipping) {
                let df_Address = addresses.find(
                    ({ id }) => parseInt(id, 10) === parseInt(default_shipping, 10)
                )
                if (df_Address) {
                    try {
                        const { region } = df_Address;
                        if (region instanceof Object && !isObjectEmpty(region)) {
                            df_Address = {
                                ...df_Address, region_id: parseInt(region.region_id, 10),
                                region_code: region.region_code,
                                region: region.region
                            }
                        }

                    } catch (error) {
                        dispatch(
                            checkoutActions.shippingAddress.reject({
                                incorrectAddressMessage: error.message
                            })
                        );
                        return null;
                    }

                    await saveShippingAddress(df_Address);
                    dispatch(checkoutActions.shippingAddress.accept(df_Address));
                }
            }

            if (!billingAddress && default_billing) {
                let df_BAddress = addresses.find(
                    ({ id }) => parseInt(id, 10) === parseInt(default_billing, 10)
                )

                if (default_shipping && (default_billing === default_shipping)) {
                    df_BAddress = { sameAsShippingAddress: true }
                }

                if (df_BAddress) {
                    if (!df_BAddress.sameAsShippingAddress) {
                        try {
                            const { region } = df_BAddress;
                            if (region instanceof Object && !isObjectEmpty(region)) {
                                df_BAddress = {
                                    ...df_BAddress, region_id: parseInt(region.region_id, 10),
                                    region_code: region.region_code,
                                    region: region.region
                                }
                            }
                        } catch (error) {
                            dispatch(
                                checkoutActions.billingAddress.reject({
                                    incorrectAddressMessage: error.message
                                })
                            );
                            return null;
                        }
                    }

                    await saveBillingAddress(df_BAddress);
                    dispatch(checkoutActions.billingAddress.accept(df_BAddress));
                }
            }

        }

    }
}

export const submitShippingMethod = payload =>
    async function thunk(dispatch, getState) {
        dispatch(actions.changeCheckoutUpdating(true));
        dispatch(checkoutActions.shippingMethod.submit(payload));

        const { cart, user } = getState();
        const { cartId } = cart;
        const { isSignedIn } = user;

        if (!cartId) {
            throw new Error('Missing required information: cartId');
        }

        const desiredShippingMethod = payload.formValues.shippingMethod;
        await saveShippingMethod(desiredShippingMethod);
        dispatch(checkoutActions.shippingMethod.accept(desiredShippingMethod));

        // try to update shipping totals
        let billing_address = await retrieveBillingAddress();
        const shipping_address = await retrieveShippingAddress();

        if (!billing_address || billing_address.sameAsShippingAddress) {
            if (billing_address.sameAsShippingAddress && shipping_address.hasOwnProperty('save_in_address_book') && shipping_address.save_in_address_book) {
                // avoid duplicate save same address book for both shipping address & billing address
                billing_address = { ...shipping_address, save_in_address_book: 0 }
            } else {
                billing_address = shipping_address;
            }
        } else {
            const { email, firstname, lastname, telephone } = shipping_address;

            billing_address = {
                email,
                firstname,
                lastname,
                telephone,
                ...billing_address
            };
        }

        let shipping_addressModify = shipping_address;
        if (shipping_address.region_code && !shipping_address.region) {
            shipping_addressModify['region'] = shipping_address.region_code;
            delete shipping_addressModify.region_code;
        }

        try{
            // POST to shipping-information to submit the shipping address and shipping method.
            const guestShippingEndpoint = `/rest/V1/guest-carts/${cartId}/shipping-information`;
            const authedShippingEndpoint =
                '/rest/V1/carts/mine/shipping-information';
            const shippingEndpoint = isSignedIn
                ? authedShippingEndpoint
                : guestShippingEndpoint;

            const response = await request(shippingEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    addressInformation: {
                        billing_address,
                        shipping_address : shipping_addressModify,
                        shipping_carrier_code: desiredShippingMethod.carrier_code,
                        shipping_method_code: desiredShippingMethod.method_code
                    }
                })
            });

            dispatch(cartActions.getDetails.receive({ paymentMethods: response.payment_methods, totals: response.totals }));
        }catch(error){
            dispatch(checkoutActions.shippingMethod.reject(error));
        }
        dispatch(actions.changeCheckoutUpdating(false));
    };

export const submitOrder = () =>
    async function thunk(dispatch, getState) {
        dispatch(checkoutActions.order.submit());

        const { cart, user } = getState();
        const { cartId } = cart;
        if (!cartId) {
            throw new Error('Missing required information: cartId');
        }

        let billing_address = await retrieveBillingAddress();
        const paymentMethod = await retrievePaymentMethod();
        const shipping_address = await retrieveShippingAddress();

        if (!billing_address || billing_address.sameAsShippingAddress) {
            if (billing_address.sameAsShippingAddress && shipping_address.hasOwnProperty('save_in_address_book') && shipping_address.save_in_address_book) {
                // avoid duplicate save same address book for both shipping address & billing address
                billing_address = { ...shipping_address, save_in_address_book: 0 }
            } else {
                billing_address = shipping_address;
            }
        } else {
            if (shipping_address && shipping_address.email) {
                const { email, firstname, lastname, telephone } = shipping_address;
                billing_address = {
                    email,
                    firstname,
                    lastname,
                    telephone,
                    ...billing_address
                };
            }
        }

        if (!billing_address.region && billing_address.region_code) {
            billing_address['region'] = billing_address.region_code;
            delete billing_address.region_code;
        }

        try {

            // POST to payment-information to submit the payment details and billing address,
            // Note: this endpoint also actually submits the order.
            const guestPaymentEndpoint = `/rest/V1/guest-carts/${cartId}/payment-information`;
            const authedPaymentEndpoint =
                '/rest/V1/carts/mine/payment-information';
            const paymentEndpoint = user.isSignedIn
                ? authedPaymentEndpoint
                : guestPaymentEndpoint;

            const bodyData = {
                billingAddress: billing_address,
                cartId: cartId,
                email: billing_address.email,
                paymentMethod: {
                    additional_data: {
                        payment_method_nonce: paymentMethod.data.nonce
                    },
                    method: paymentMethod.code
                }
            };

            // for CC payment: Stripe
            if (paymentMethod.data.hasOwnProperty('cc_token') && paymentMethod.data.cc_token){
                bodyData.paymentMethod['additional_data'] = paymentMethod.data;
            }

            // for payment type Purchase Order
            if (paymentMethod.data.hasOwnProperty('purchaseorder') && paymentMethod.data.purchaseorder){
                bodyData.paymentMethod['po_number'] = paymentMethod.data.purchaseorder;
            }

            const response = await request(paymentEndpoint, {
                method: 'POST',
                body: JSON.stringify(bodyData)
            });

            dispatch(
                checkoutReceiptActions.setOrderInformation({
                    id: response,
                    billing_address
                })
            );

            // Clear out everything we've saved about this cart from local storage.
            // await clearBillingAddress();
            await clearCartId();
            await clearPaymentMethod();
            // await clearShippingAddress();
            await clearShippingMethod();

            dispatch(checkoutActions.order.accept(response));
        } catch (error) {
            dispatch(checkoutActions.order.reject(error));
        }
    };

async function saveShippingAddress(address) {
    if (address.hasOwnProperty('region') && address.region instanceof Object) {
        address = (({ region, ...others }) => ({ ...others }))(address)
    }

    address = (({ id, default_billing, default_shipping, ...others }) => ({ ...others }))(address);
    return storage.setItem('shipping_address', address);
}

async function saveBillingAddress(address) {
    if (address.hasOwnProperty('region') && address.region instanceof Object) {
        address = (({ region, ...others }) => ({ ...others }))(address)
    }

    address = (({ id, default_billing, default_shipping, ...others }) => ({ ...others }))(address);
    return storage.setItem('billing_address', address);
}

async function retrieveBillingAddress() {
    return storage.getItem('billing_address');
}

async function clearBillingAddress() {
    return storage.removeItem('billing_address');
}

async function retrievePaymentMethod() {
    return storage.getItem('paymentMethod');
}

async function clearPaymentMethod() {
    return storage.removeItem('paymentMethod');
}

async function retrieveShippingAddress() {
    return storage.getItem('shipping_address');
}

async function clearShippingAddress() {
    return storage.removeItem('shipping_address');
}

async function retrieveShippingMethod() {
    return storage.getItem('shippingMethod');
}

async function saveShippingMethod(method) {
    return storage.setItem('shippingMethod', method);
}

async function clearShippingMethod() {
    return storage.removeItem('shippingMethod');
}

async function clearToken() {
    return storage.removeItem('signin_token');
}
