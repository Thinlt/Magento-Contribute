import React from 'react';
import { Util } from '@magento/peregrine';
// import {paypalExpressStart, paypalPlaceOrder} from 'src/simi/Model/Payment';
import Loading from 'src/simi/BaseComponents/Loading';
import { showFogLoading, hideFogLoading } from 'src/simi/BaseComponents/Loading/GlobalLoading';
import { toggleMessages, beginCheckout } from 'src/simi/Redux/actions/simiactions';
import { connect } from 'src/drivers';
import PropTypes from 'prop-types';
import Identify from 'src/simi/Helper/Identify'
import { getCartDetails, clearCartId } from 'src/actions/cart';

import { useEffect } from 'react';
import { useMutation } from '@apollo/react-hooks';
import PAYPAL_TOKEN_MUTATION from 'src/simi/queries/payment/createPaypalExpressToken.graphql';
import PAYPAL_SETPAYPMENT_MUTATION from 'src/simi/queries/payment/setPaymentMethodOnCart.graphql';
import PLACE_ORDER_MUTATION from 'src/simi/queries/payment/placeOrderMutation.graphql';
import SET_GUEST_EMAIL_MUTATION from 'src/simi/queries/payment/setGuestEmailOnCartMutation.graphql';

const PaypalExpress = props => {

    const { cartId, checkout, getCartDetails } = props;

    let email = '';
    const { BrowserPersistence } = Util;
    const storage = new BrowserPersistence();

    const billingAddress = storage.getItem('billing_address');
    if (billingAddress && billingAddress.sameAsShippingAddress) {
        const shippingAddress = storage.getItem('shipping_address');
        email = shippingAddress.email || '';
    } else {
        email = billingAddress.email || '';
    }

    const isUserSignedIn = () => {
        const { user } = props;
        return user && user.isSignedIn;
    }

    const getUserEmail = () => {
        const { user } = props;
        if (user && user.currentUser && user.currentUser.email) {
            email = user.currentUser.email
        }
        return email;
    }

    const placeOrderCallback = data => {
        hideFogLoading();
        if (data && data.placeOrder && data.placeOrder.order && data.placeOrder.order.order_number) {
            clearCartId()
            getCartDetails()
            props.history.push('/thankyou.html?order_increment_id='+data.placeOrder.order.order_number)
        } else {
            if (data.errors && data.errors.length) {
                data.errors.map(error => {
                    alert(error.message)
                });
            }
            props.toggleMessages([{ type: 'error', message: Identify.__('Payment Failed'), auto_dismiss: true }])
            props.history.push('/')
        }
    }

    let tokenDataGraphql = {};
    const [createToken, {
        data: tokenData,
        loading: createTokenLoading,
        error: createTokenError,
        called: createTokenCalled
    }] = useMutation(PAYPAL_TOKEN_MUTATION);
    if (tokenData && tokenData.createPaypalExpressToken) tokenDataGraphql = tokenData.createPaypalExpressToken;

    let dataSetPaymentGraphql = {};
    const [setPaymentMethodOnCart, {
        data: dataSetPayment,
        loading: setPaymentLoading,
        error: setPaymentError,
        called: setPaymentCalled
    }] = useMutation(PAYPAL_SETPAYPMENT_MUTATION);
    if (dataSetPayment && dataSetPayment.setPaymentMethodOnCart) dataSetPaymentGraphql = dataSetPayment.setPaymentMethodOnCart;

    const [placeOrder, {
        data: placeOrderData,
        loading: placeOrderLoading,
        error: placeOrderError,
        called: placeOrderCalled
    }] = useMutation(PLACE_ORDER_MUTATION);
    
    const [setGuestEmailOnCart, {
        data: emailOnCartData,
        loading: emailOnCartLoading,
        error: emailOnCartError,
        called: emailOnCartCalled
    }] = useMutation(SET_GUEST_EMAIL_MUTATION);

    
    useEffect(() => {
        if (createTokenError) {
            const errorMessage = createTokenError.message && createTokenError.message.replace('GraphQL error: ', '') || '';
            props.toggleMessages([{ type: 'error', message: Identify.__('Payment error.')+' '+errorMessage, auto_dismiss: true }])
            props.history.push('/checkout.html')
            return;
        }

        if (setPaymentError) {
            const errorMessage = setPaymentError.message && setPaymentError.message.replace('GraphQL error: ', '') || '';
            props.toggleMessages([{ type: 'error', message: Identify.__('Payment error.')+' '+errorMessage, auto_dismiss: true }])
            props.history.push('/checkout.html')
            return;
        }

        if (placeOrderError) {
            const errorMessage = placeOrderError.message && placeOrderError.message.replace('GraphQL error: ', '') || '';
            props.toggleMessages([{ type: 'error', message: Identify.__('Payment error.')+' '+errorMessage, auto_dismiss: true }])
            props.history.push('/')
            return;
        }
    }, [createTokenError, setPaymentError, placeOrderError])

    useEffect(() => {
        if (props.cartId) {
            if (!placeOrderCalled && !createTokenLoading && createTokenCalled 
                && tokenDataGraphql.token && tokenDataGraphql.paypal_urls && tokenDataGraphql.paypal_urls.start) {
                window.location.replace(tokenDataGraphql.paypal_urls.start);
                return;
            }

            if (!placeOrderLoading && placeOrderCalled && placeOrderData) {
                placeOrderCallback(placeOrderData)
                return;
            }
    
            if (!setPaymentLoading && setPaymentCalled && dataSetPaymentGraphql.cart 
                && dataSetPaymentGraphql.cart.selected_payment_method) {
                const cartMethod = dataSetPaymentGraphql.cart.selected_payment_method;
                if (cartMethod && cartMethod.code === 'paypal_express') {
                    if (!placeOrderCalled) {
                        if (!isUserSignedIn()) {
                            if (emailOnCartData && emailOnCartCalled && !emailOnCartLoading) {
                                placeOrder({ variables: { cartId } });
                            } else {
                                setGuestEmailOnCart({ variables: { cartId, email: getUserEmail() } });
                            }
                        } else {
                            placeOrder({ variables: { cartId } });
                        }
                    }
                }
            }
    
            const token = Identify.findGetParameter('token')
            const payerId = Identify.findGetParameter('PayerID'); //PayerID param
    
            if (payerId && token && !checkout.submitting && !setPaymentCalled) {
                setPaymentMethodOnCart({ variables: { cartId, payerId, token }})
            }else if(!checkout.submitting && !createTokenCalled && !setPaymentCalled){
                createToken({ variables: { cartId: props.cartId } });
            }
        }
    }, [tokenData, dataSetPayment, placeOrderData, emailOnCartData])

    showFogLoading();
    return <div style={{width: '100%', textAlign: 'center', marginTop: '50px'}}>
        <span>{Identify.__('Paypal Express checkout inprocessing!')}</span>
    </div>
}


const mapDispatchToProps = {
    toggleMessages,
    getCartDetails
};

const mapStateToProps = ({ cart, checkout, user }) => {
    const { cartId } = cart
    return {
        cartId,
        checkout,
        user
    }
}

PaypalExpress.propTypes = {
    cartId: PropTypes.string,
    checkout: PropTypes.shape({
        availableShippingMethods: PropTypes.array,
        billingAddress: PropTypes.object,
        editing: PropTypes.oneOf(['address', 'billingAddress', 'paymentMethod', 'shippingMethod']),
        invalidAddressMessage: PropTypes.string,
        isAddressInvalid: PropTypes.bool,
        paymentCode: PropTypes.string,
        paymentData: PropTypes.object,
        shippingAddress: PropTypes.object,
        shippingMethod: PropTypes.string,
        shippingTitle: PropTypes.string,
        step: PropTypes.oneOf(['cart', 'form', 'receipt']).isRequired,
        submitting: PropTypes.bool
    }).isRequired,
    user: PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(PaypalExpress);
