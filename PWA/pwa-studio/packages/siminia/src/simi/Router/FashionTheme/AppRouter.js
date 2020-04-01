import React from 'react'
import Abstract from '../Base'
import router from "./RouterConfig";
import { Switch, Route } from 'react-router-dom';
class AppRouter extends Abstract{

    renderLayout = ()=>{
        return(
            this.renderRoute(router)
        )
    }

    render(){
        return super.render()
    }

    renderRoute =(router = null)=>{
        if(!router) return <div></div>
        return (
            <Switch>
                <Route exact {...router.home}/>
                <Route exact {...router.search_page}/>
                <Route exact {...router.cart}/>
                <Route exact {...router.product_detail}/>
                <Route exact {...router.checkout}/>
                <Route exact {...router.ppExpress}/>
                <Route exact {...router.thankyou}/>
                <Route exact {...router.account}/>
                <Route exact {...router.address_book}/>
                <Route exact {...router.oder_history}/>
                <Route exact {...router.order_history_detail}/>
                <Route exact {...router.newsletter}/>
                <Route exact {...router.profile}/>
                <Route exact {...router.wishlist}/>
                <Route exact {...router.login}/>
                <Route exact {...router.logout}/>
                <Route exact {...router.contact}/>
                <Route {...router.noMatch}/>
            </Switch>
        )
    }
}
export default AppRouter;