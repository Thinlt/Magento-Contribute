import React from 'react';
import Identify from 'src/simi/Helper/Identify'
import Dropdownplus from 'src/simi/BaseComponents/Dropdownplus'
import { withRouter } from 'react-router-dom';
import RangeSlider from './RangeSlider';
import memoize from 'memoize-one';
import {Whitebtn} from 'src/simi/BaseComponents/Button'

require('./filter.scss')
const $ = window.$

const dropDownPlusClasses = {
    'dropdownplus': 'dropdownplus',
    'dropdownplus-title': 'dropdownplus-title',
    'dropdownplus-inner': 'dropdownplus-inner'
}

class Filter extends React.Component {
    constructor(props) {
        super(props);
        const isPhone = window.innerWidth < 1024 ;
        const {filterData} = this.props
        this.state = {isPhone}
        this.filtersToApply = filterData?filterData:{}
        this.rowFilterAttributes = []
    }

    setIsPhone(){
        const obj = this;
        $(window).resize(function () {
            const width = window.innerWidth;
            const isPhone = width < 1024;
            if(obj.state.isPhone !== isPhone){
                obj.setState({isPhone})
            }
        })
    }

    componentDidMount(){
        this.setIsPhone();
    }
    
    renderFilterItems() {
        const {props} = this
        const {filterData} = props

        this.rowFilterAttributes = []
        if(props.maxPrice && props.minPrice) {
            this.rowFilterAttributes.push(
                <Dropdownplus 
                    classes={dropDownPlusClasses}
                    key={Identify.randomString(5)}
                    title={Identify.__('Price')}
                    expanded={this.filtersToApply['price']?true:false}
                >
                    <div 
                        id={`filter-option-items-price`} 
                        className="filter-option-items">
                        {this.renderRangePrices(filterData)}
                    </div>
                </Dropdownplus>
            )
        }
        
        if (props.data)
            this.items = props.data;
        if (this.items && this.items.length !== 0) {
            this.items.map((item, index) => {
                const filterOptions = this.renderFilterItemsOptions(item)
                if (filterOptions.length > 0) {
                    if(item.request_var === 'price') return null
                    this.rowFilterAttributes.push(
                        <Dropdownplus 
                            classes={dropDownPlusClasses}
                            key={index}
                            title={Identify.__(item.name)}
                            expanded={this.filtersToApply[item.request_var]?true:false}
                        >
                            <div 
                                id={`filter-option-items-${item.request_var}`} 
                                className="filter-option-items">
                                {filterOptions}
                            </div>
                        </Dropdownplus>
                    )
                }
                return null
            }, this);
        }
        return (
            <div>{this.rowFilterAttributes}</div>
        );
    }

    renderFilterItemsOptions = memoize(item =>
    {
        const {filtersToApply} = this
        let options= [];
        if(item){
            if(item.filter_items !== null){
                options = item.filter_items.map(function (optionItem) {
                    const name = <span className="filter-item-text">
                        {$("<div/>").html(Identify.__(optionItem.label)).text()}
                        {optionItem.items_count && <span className="filter-item-count">({optionItem.items_count})</span>}
                        </span>;
                    return (
                        <div 
                            role='presentation'
                            className="filter-item"
                            key={item.request_var + '_' + optionItem.value_string}
                            >
                            <input
                                type="checkbox"
                                defaultChecked={filtersToApply[item.request_var] &&
                                    filtersToApply[item.request_var].includes(optionItem.value_string)}
                                onChange={()=>{
                                    this.clickedFilter(item.request_var, optionItem.value_string);
                                }}
                            ></input>
                            <span className="filter-item-text">{name}</span>
                        </div>
                    );
                }, this, item);
            }
        }
        return options
    })

    renderRangePrices = memoize(filterData => {
        const { location, maxPrice, minPrice } = this.props
        const from = minPrice;
        const to = maxPrice
        let left = minPrice
        let right = maxPrice
        if(filterData && filterData['price'] && typeof filterData['price'] === 'string') {
            const activeRange = filterData['price'].split('-')
            left = activeRange[0];
            right = activeRange[1];
        }

        return <RangeSlider priceFrom={Number(from)} priceTo={Number(to)} 
                    clickedFilter={this.clickedFilter.bind(this)} leftPrice={Number(left)} rightPrice={Number(right)}
                    location={location} filterData={filterData} />
    })
    
    renderClearButton() {
        return this.props.filterData
        ? (<div className="clear-filter">
                <div 
                    role="presentation"
                    onClick={() => this.clearFilter()}
                    className="action-clear">{Identify.__('Clear all')}</div>
            </div>
        ) : <div className="clear-filter"></div>
    }

    clearFilter() {
        const {history, location} = this.props
        const { search } = location;
        const queryParams = new URLSearchParams(search);
        queryParams.delete('filter');
        history.push({ search: queryParams.toString() });
    }

    deleteFilter(attribute) {
        const {history, location, filterData} = this.props
        const { search } = location;
        const filterParams = filterData?filterData:{}
        delete filterParams[attribute]
        const queryParams = new URLSearchParams(search);
        queryParams.set('filter', JSON.stringify(filterParams));
        history.push({ search: queryParams.toString() });
    }
    
    clickedFilter(attribute, value) {
        const newFiltersToApply = this.filtersToApply
        if (attribute === 'price')
            newFiltersToApply[attribute] = value
        else {
            const existedValue = newFiltersToApply[attribute]
            if (!existedValue)
                newFiltersToApply[attribute] = [value]
            else {
                const index = existedValue.indexOf(value)
                if (index > -1) {
                    if (existedValue.length > 1)
                        newFiltersToApply[attribute].splice(index, 1);
                    else
                        delete newFiltersToApply[attribute]
                } else
                    newFiltersToApply[attribute].push(value)
            }
        }
        this.filtersToApply = newFiltersToApply
    }
    
    applyFilter() {
        console.log(this);
        const {history, location} = this.props
        const { search } = location;
        const queryParams = new URLSearchParams(search);
        queryParams.set('page', 1);
        queryParams.set('filter', JSON.stringify(this.filtersToApply));
        history.push({ search: queryParams.toString() });
    }

    render() {
        const {props, state} = this
        console.log(state)
        const {isPhone} = state
        this.items = props.data?this.props.data:null;

        const filterProducts = 
                <div className='filter-products'>
                    {this.renderClearButton()}
                    {this.renderFilterItems()}
                    <Whitebtn className='apply-filter' onClick={() => this.applyFilter()} text={Identify.__('Apply')}/>
                </div>

        return isPhone? <Dropdownplus
            classes={dropDownPlusClasses}
            className="siminia-phone-filter"
            title={Identify.__('Filter')}
        >
            {filterProducts}
        </Dropdownplus> : filterProducts
    }
}

export default (withRouter)(Filter);