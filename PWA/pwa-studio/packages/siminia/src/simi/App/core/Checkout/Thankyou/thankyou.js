import React from 'react';
import Button from 'src/components/Button';
import { hideFogLoading } from 'src/simi/BaseComponents/Loading/GlobalLoading';
import Identify from 'src/simi/Helper/Identify';
import TitleHelper from 'src/simi/Helper/TitleHelper'

require('./thankyou.scss')

const Thankyou = props => {
    hideFogLoading()
    const {  history } = props;
    const padOrderId = Identify.findGetParameter('order_increment_id')

    const handleViewOrderDetails = () => {
        if (!padOrderId) {
            history.push('/');
            return;
        }
        const orderId = '/orderdetails.html/' + padOrderId;
        const orderLocate = {
            pathname: orderId,
            state: {
                orderData: {
                    increment_id: padOrderId
                }
            }
        }
        history.push(orderLocate);
    }

    return (
        <div className="container" style={{ marginTop: 40 }}>
            {TitleHelper.renderMetaHeader({
                title:Identify.__('Thank you for your purchase!')
            })}
            <div className="root">
                <div className="body">
                    <h2 className='header'>{Identify.__('Thank you for your purchase!')}</h2>
                    <div className='textBlock'>{Identify.__('You will receive an order confirmation email with order status and other details.')}</div>
                    <div className='textBlock'>{Identify.__('You can also visit your account page for more information.')}</div>
                    <Button onClick={handleViewOrderDetails}>
                        {Identify.__('View Order Details')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Thankyou;
