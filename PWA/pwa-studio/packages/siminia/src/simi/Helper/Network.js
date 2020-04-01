import Identify from './Identify'
import * as Constants from 'src/simi/Config/Constants';

export const addRequestVars = (variables) => {
    variables = variables?variables:{}
    const appSettings = Identify.getAppSettings()
    if (appSettings) {
        if (appSettings.store_id)
            variables.simiStoreId = appSettings.store_id
        if (appSettings.currency)
            variables.simiCurrency = appSettings.currency
    }
    //no need to keep session while calling directly
    if (window.SMCONFIGS && window.SMCONFIGS.directly_request && window.SMCONFIGS.merchant_url)
        return variables
    const simiSessId = Identify.getDataFromStoreage(Identify.LOCAL_STOREAGE, Constants.SIMI_SESS_ID)
    if (simiSessId && !variables.hasOwnProperty(simiSessId))
        variables.simiSessId = simiSessId
    return variables
}

//use to modify resourceUrl in order to call directly to merchant magento site instead of using upward
export const addMerchantUrl = (resouceUrl) => {
    if (
        !resouceUrl.includes('http://') && !resouceUrl.includes('https://') &&
        window.SMCONFIGS && window.SMCONFIGS.directly_request && window.SMCONFIGS.merchant_url
    ) {
        return (window.SMCONFIGS.merchant_url + resouceUrl)
    }
    return resouceUrl
}