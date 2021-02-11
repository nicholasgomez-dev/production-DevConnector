import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import { setAlert } from './alert'
import { REGISTER_SUCCESS, REGISTER_FAIL, USER_LOADED, AUTH_ERROR, LOGIN_FAIL, LOGIN_SUCCESS, LOGOUT, CLEAR_PROFILE } from './types'

// Load User
export const loadUser = () => async dispatch => {
    if(localStorage.token) {
        setAuthToken(localStorage.token);
    }

    try {
        const res = await axios.get('/api/auth');

        dispatch({
            type: USER_LOADED,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: AUTH_ERROR
        })
    }
}


//REGISTER USER
export const register = ({ name, email, password }) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const body = JSON.stringify({ name, email, password });

    try {
        const res = await axios.post('/api/users', body, config);

        dispatch({ //dispatch this to the store then -> reducer to make changes to the store based on our type of dispatch
            type: REGISTER_SUCCESS,
            payload: res.data
        });

        dispatch(loadUser());
    } catch (err) {
        const errors = err.response.data.errors //getting errors if any

        if(errors) {
            errors.forEach(error => dispatch(setAlert(error.msg, 'danger'))) //if any errors exist then for each error in the errors array we want to dispatch setAlert to the reducer to give us a pop up alert on the Front End
        }

        dispatch({
            type: REGISTER_FAIL
        });
    }
};

//Login USER
export const login = (email, password) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const body = JSON.stringify({ email, password });

    try {
        const res = await axios.post('/api/auth', body, config);

        dispatch({ //dispatch this to the store then -> reducer to make changes to the store based on our type of dispatch
            type: LOGIN_SUCCESS,
            payload: res.data
        });

        dispatch(loadUser());
    } catch (err) {
        const errors = err.response.data.errors //getting errors if any

        if(errors) {
            errors.forEach(error => dispatch(setAlert(error.msg, 'danger'))) //if any errors exist then for each error in the errors array we want to dispatch setAlert to the reducer to give us a pop up alert on the Front End
        }

        dispatch({
            type: LOGIN_FAIL
        });
    }
};

//Logout / Clear Profile
export const logout = () => dispatch => {
    dispatch({ type: CLEAR_PROFILE });
    dispatch({ type: LOGOUT });
}