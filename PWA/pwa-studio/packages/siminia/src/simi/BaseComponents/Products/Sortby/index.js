import React from 'react';
import Identify from 'src/simi/Helper/Identify';
import Check from 'src/simi/BaseComponents/Icon/TapitaIcons/SingleSelect';
import {configColor} from "src/simi/Config";
import Dropdownoption from 'src/simi/BaseComponents/Dropdownoption/'
import { withRouter } from 'react-router-dom';

import Icon from 'src/components/Icon';
import ChevronDownIcon from 'react-feather/dist/icons/chevron-down';

const arrow = <Icon src={ChevronDownIcon} size={18} />;

const Sortby = props => {
    const { history, location, sortByData, data } = props;
    const { search } = location;
    let dropdownItem = null
    const changedSortBy = (item) => {
        if (dropdownItem && item) {
            dropdownItem.handleToggle()
            const queryParams = new URLSearchParams(search);
            queryParams.set('product_list_order', item.key);
            queryParams.set('product_list_dir', item.direction);
            history.push({ search: queryParams.toString() });
        }
    }

    parent = props.parent
    let selections = []
    if (!data || !data.products || !data.products.sort_fields || !data.products.sort_fields.options) {
        return ''
    }
    const orders = []
    data.products.sort_fields.options.map(sort_field_opt => {
        orders.push( {"key":sort_field_opt.value, "value":sort_field_opt.label, "direction":"asc"} )
        orders.push( {"key":sort_field_opt.value, "value":sort_field_opt.label, "direction":"desc"} )
    })
    
    let sortByTitle = Identify.__('Sort by');

    selections = orders.map((item) => {
        let itemCheck = ''
        const itemTitle = `${item.value}`
        if (sortByData && sortByData.attribute === item.key && sortByData.direction === item.direction.toUpperCase()) {
            itemCheck = (
                <span className="is-selected">
                    <Check color={configColor.button_background} style={{width: 16, height: 16, marginRight: 4}}/>
                </span>
            )
            sortByTitle = itemTitle
        }
        return (
            <div 
                role="presentation"
                key={Identify.randomString(5)}
                className="dir-item"
                onClick={()=>changedSortBy(item)}
            >
                <div className="dir-title">
                    {item.direction === 'asc' ? '↑' : '↓'} {itemTitle}
                </div>
                <div className="dir-check">
                {itemCheck}
                </div>
            </div>
        );
    });

    return (
        <div className="top-sort-by">
            {
                selections.length === 0 ?
                <span></span> : 
                <div className="sort-by-select">
                    <Dropdownoption 
                        title={sortByTitle}
                        ref={(item)=> {dropdownItem = item}}
                    >
                        {selections}
                    </Dropdownoption>
                </div>
            }
        </div>
    )
}

export default (withRouter)(Sortby);