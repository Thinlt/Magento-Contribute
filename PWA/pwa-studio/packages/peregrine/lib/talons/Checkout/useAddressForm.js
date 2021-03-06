import { useCallback, useMemo } from 'react';
import { useCheckoutContext } from '@magento/peregrine/lib/context/checkout';
import { useMutation } from '@apollo/react-hooks';
import { useUserContext } from '@magento/peregrine/lib/context/user';

/**
 * Returns values used to render an AddressForm component.
 *
 * @param {Object} props
 * @param {Object[]} props.fields an array of fields to reduce over for initial values
 * @param {function} props.onCancel cancel callback
 * @param {function} props.onSubmit submit callback
 * @returns {{
 *   handleCancel: function,
 *   handleSubmit: function,
 *   initialValues: object
 * }}
 */
export const useAddressForm = props => {
    const {
        countries,
        fields,
        onCancel,
        onSubmit,
        setGuestEmailMutation,
        setShippingAddressOnCartMutation
    } = props;

    const [
        { shippingAddress, shippingAddressError },
        { submitShippingAddress }
    ] = useCheckoutContext();

    const [{ isSignedIn }] = useUserContext();

    const [setGuestEmail] = useMutation(setGuestEmailMutation, {
        fetchPolicy: 'no-cache'
    });
    const [setShippingAddressOnCart] = useMutation(
        setShippingAddressOnCartMutation,
        { fetchPolicy: 'no-cache' }
    );
    const values = useMemo(
        () =>
            fields.reduce((acc, key) => {
                acc[key] = shippingAddress[key];
                return acc;
            }, {}),
        [fields, shippingAddress]
    );

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const handleSubmit = useCallback(
        async addressFormValues => {
            await submitShippingAddress({
                formValues: addressFormValues,
                countries,
                setGuestEmail,
                setShippingAddressOnCart
            });
            onSubmit();
        },
        [
            countries,
            onSubmit,
            setGuestEmail,
            setShippingAddressOnCart,
            submitShippingAddress
        ]
    );

    return {
        error: shippingAddressError,
        handleCancel,
        handleSubmit,
        isSignedIn,
        initialValues: values
    };
};
