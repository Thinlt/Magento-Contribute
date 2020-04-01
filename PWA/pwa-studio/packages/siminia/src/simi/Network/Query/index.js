import {addRequestVars} from 'src/simi/Helper/Network'
import { useQuery, useMutation } from '@apollo/react-hooks';

export const Simiquery = props => {
    const {query} = props
    const modProps = {}
    const variables = props.variables?props.variables:{}
    modProps.variables = addRequestVars(variables)
    modProps.fetchPolicy = props.fetchPolicy?props.fetchPolicy:'cache-first'
    const {data, loading, error} = useQuery(query, modProps)
    return props.children({ loading, error, data })
}

export const SimiMutation = props => {
    const {mutation, children} = props
    const [functionToCall, { data, error }] = useMutation(mutation);

    const modedFunctionToCall = options => {
        let modOptions = {}
        const variables = (options && options.variables) ? options.variables : {}
        modOptions.variables = addRequestVars(variables)
        modOptions = {...modOptions, ...options}
        functionToCall(modOptions)
    }
    return children(modedFunctionToCall, {data, error})
}

export var simiUseQuery = (query, options) => {
    let modOptions = {}
    const variables = (options && options.variables) ? options.variables : {}
    modOptions.variables = addRequestVars(variables)
    modOptions = {...modOptions, ...options}
    return useQuery(query, modOptions)
}