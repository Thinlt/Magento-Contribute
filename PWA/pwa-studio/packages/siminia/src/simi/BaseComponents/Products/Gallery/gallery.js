import React, { Component } from 'react';
import { string, shape, array, number } from 'prop-types';

import GalleryItems, { emptyData } from './items';
import Loading from 'src/simi/BaseComponents/Loading'

class Gallery extends Component {
    static propTypes = {
        classes: shape({
            filters: string,
            items: string,
            pagination: string,
            root: string
        }),
        data: array,
        pageSize: number
    };

    static defaultProps = {
        data: emptyData
    };

    render() {
        const {  data, pageSize, history } = this.props;
        const hasData = Array.isArray(data) && data.length;
        const items = hasData ? data : emptyData;
        
        return (
            <div className="galery-root">
                {!hasData && <Loading />}
                <div className="galery-items">
                    <GalleryItems items={items} pageSize={pageSize} history={history}/>
                </div>
            </div>
        );
    }
}

export default Gallery
