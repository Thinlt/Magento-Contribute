import Identify from './Identify'

var loadedCountries = []
export const getAllowedCountries = () => {
    const storeConfig = Identify.getStoreConfig();
    if (!loadedCountries.length && storeConfig && storeConfig.simiStoreConfig && storeConfig.simiStoreConfig.config && storeConfig.simiStoreConfig.config.allowed_countries) {    
        const countries = []
        storeConfig.simiStoreConfig.config.allowed_countries.map((country) => {
            if (country.states && country.states.length)
                country.states = country.states.map(state => {
                    return {id: state.state_id, code: state.state_code, name: state.state_name}
                })
            else
                country.states = []
            countries.push({
                full_name_english: country.country_name,
                full_name_locale: country.country_name,
                id: country.country_code,
                available_regions: country.states
            })
        })
        loadedCountries = countries
    }
    return loadedCountries
}