import React from 'react'
import Product from 'src/simi/App/core/RootComponents/Product'
import Category from 'src/simi/App/core/RootComponents/Category'
import CMS from 'src/simi/App/core/RootComponents/CMS'
import Simicms from 'src/simi/App/core/Simicms'
import Loading from 'src/simi/BaseComponents/Loading'
import Identify from 'src/simi/Helper/Identify'
import { getDataFromUrl } from 'src/simi/Helper/Url';
import ResolveUrlResult from './ResolveUrlResult'

var parseFromDoc = true
const TYPE_PRODUCT = 'PRODUCT'
const TYPE_CATEGORY = 'CATEGORY'
const TYPE_CMS_PAGE = 'CMS_PAGE'

const NoMatch = props => {
    const {location} = props
    const renderByTypeAndId = (type, id, preloadedData = null) => {
        if (type === TYPE_PRODUCT)
            return <Product {...props} preloadedData={preloadedData}/>
        else if (type === TYPE_CATEGORY)
            return <Category {...props} id={parseInt(id, 10)}/>
        else if (type === TYPE_CMS_PAGE)
            return <CMS {...props} id={parseInt(id, 10)}/>
    }

    if (
        parseFromDoc &&
        document.body.getAttribute('data-model-type') &&
        document.body.getAttribute('data-model-id')
    ) {
        parseFromDoc = false
        const type = document.body.getAttribute('data-model-type')
        const id = document.body.getAttribute('data-model-id')
        const result = renderByTypeAndId(type, id)
        if (result)
            return result
    } else if (location && location.pathname) {
        parseFromDoc = false
        const pathname = location.pathname

        //load from dict
        const dataFromDict = getDataFromUrl(pathname)
        if (dataFromDict && dataFromDict.id) {
            let type = TYPE_CATEGORY
            const id = dataFromDict.id
            if (dataFromDict.sku)  {
                type = TYPE_PRODUCT
            }
            const result = renderByTypeAndId(type, id, dataFromDict)
            if (result)
                return result
        }
        //check if simicms
        const simiStoreConfig = Identify.getStoreConfig();
        if (simiStoreConfig && simiStoreConfig.simiStoreConfig &&
            simiStoreConfig.simiStoreConfig.config &&
            simiStoreConfig.simiStoreConfig.config.cms &&
            simiStoreConfig.simiStoreConfig.config.cms.cmspages &&
            simiStoreConfig.simiStoreConfig.config.cms.cmspages.length
            ) {
                let simiCms = null
                simiStoreConfig.simiStoreConfig.config.cms.cmspages.forEach(simicmspage => {
                    if (
                        simicmspage.cms_content && simicmspage.cms_url &&
                        (simicmspage.cms_url === pathname) || (`/${simicmspage.cms_url}` === pathname)
                        )
                        simiCms = simicmspage
                });
                if (simiCms)
                    return <Simicms csmItem={simiCms} />
        }

        //get type from server
        return <ResolveUrlResult pathname={pathname} renderByTypeAndId={renderByTypeAndId}/>
    }

    parseFromDoc = false
    return (
        <Loading />
    )
}
export default NoMatch