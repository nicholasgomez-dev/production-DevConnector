import React, { Fragment, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth'

const Login = ({ login, isAuthenticated }) => {
    const [formData, setFormData] = useState({  //hooks | learn about hooks and how they work | formData is the state: that is an object & setFormData is setting the state to the new values | useState is the default values
        email: '',
        password: ''
    });

    const  { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value }); //function that will run for every  change in the fields using the name of the value for each element, reassigning it to every value in the formData object

    const onSubmit = async e => {
        e.preventDefault();
        login(email, password);
    };

    if (isAuthenticated) {
        return <Redirect to='/dashboard' />
    }

    return (
        <Fragment>
            <h1 className="large text-primary">Sign In</h1>
            <p className="lead"><i className="fas fa-user"></i> Sign Into Your Account</p>
            <form className="form" onSubmit={e => onSubmit(e)}>
                
                <div className="form-group">
                    <input type="email" placeholder="Email Address" name="email" value={email} onChange={e => onChange(e)} required />
                </div>

                <div className="form-group">
                    <input type="password" placeholder="Password" name="password" value={password} onChange={e => onChange(e)} minLength="6"/>
                </div>

                <input type="submit" className="btn btn-primary" value="Login" />
            </form>

            <p className="my-1">Don't have an account? <Link to="/register">Sign Up</Link></p>
        </Fragment>
    )
}

Login.propTypes = {
    login: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool,
};

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { login })(Login);