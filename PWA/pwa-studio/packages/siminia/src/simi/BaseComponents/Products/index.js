import React from 'react';
import Gallery from './Gallery';
import Identify from 'src/simi/Helper/Identify'
import Sortby from './Sortby'
import Filter from './Filter'
import Pagination from 'src/simi/BaseComponents/Pagination'
import Loading from 'src/simi/BaseComponents/Loading';

require('./products.scss')

class Products extends React.Component {

    renderFilter() {
        const {props} = this
        const { data, filterData } = props;
        if (
            data 
            && data.products 
            && data.products.filters) 
        {
            const maxPrice = data.products.maxPrice || null
            const minPrice = data.products.minPrice || null
            return (
                <div>
                    <Filter 
                        data={data.products.filters} 
                        filterData={filterData} 
                        maxPrice={maxPrice} 
                        minPrice={minPrice}    
                    />
                </div>
            );
        }
    }

    renderLeftNavigation = () => {
        const shopby = [];
        const filter = this.renderFilter();
        if (filter) {
            shopby.push(
                <div 
                    key="siminia-left-navigation-filter" 
                    className="left-navigation" >
                    {filter}
                </div>
            );
        }
        return shopby;
    }

    renderItem = ()=>{
        const {pagination} = this
        const {history, location, currentPage, pageSize} = this.props
        if (
            pagination && 
            pagination.state && 
            pagination.state.limit && 
            pagination.state.currentPage &&
            (pagination.state.limit!==pageSize||
            pagination.state.currentPage!==currentPage)) {
                const { search } = location;
                const queryParams = new URLSearchParams(search);
                queryParams.set('product_list_limit', pagination.state.limit);
                queryParams.set('page', pagination.state.currentPage);
                history.push({ search: queryParams.toString() });
        }
    };

    renderList = () => {
        const {props} = this
        const { data, pageSize, history, location, sortByData, currentPage, filterData } = props;
        const items = data ? data.products.items : null;
        if (!data)
            return <Loading />
            
        return (
            <React.Fragment>
                <Sortby
                    parent={this}
                    data={data}
                    sortByData={sortByData}
                    />
                <section className="gallery">
                    {
                        (!data.products || !data.products.total_count) ?
                            <div className='no-product'>{Identify.__('No product found')}</div> : 
                            <Gallery data={items} pageSize={pageSize} history={history} location={location} />
                    }
                </section>
                <div className='product-grid-pagination' style={{marginBottom: 20}}>
                    <Pagination 
                        renderItem={this.renderItem.bind(this)}
                        itemCount={data.products.total_count}
                        limit={pageSize}
                        currentPage={currentPage}
                        itemsPerPageOptions={[12, 24, 36, 48, 60]}
                        showInfoItem={false}
                        ref={(page) => {this.pagination = page}}/>
                </div>
            </React.Fragment>
        )
    }

    render() {
        const {props} = this
        const { data, title } = props;
        let itemCount = ''
        if(data && data.products && data.products.total_count){
            const text = data.products.total_count > 1 ? Identify.__('%t items') : Identify.__('%t item');
            itemCount = <div className="items-count">
                    {text
                        .replace('%t', data.products.total_count)}
                </div>;
        }
                
        return (
            <article className='products-root'>
                <h1 className="title">
                    <div className="categoryTitle">{title}</div>
                </h1>
                {itemCount}
                <div className="product-list-container-siminia">
                    {this.renderLeftNavigation()}
                    <div style={{display: 'inline-block', width: '100%'}}>
                        {this.renderList()}
                    </div>
                </div>
            </article>
        );
    }
};


export default Products;

