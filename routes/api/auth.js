//Bringing in Express
//Bringing in express router function for creating routes
//Assigning express.Router() to 'router' variable
//Brining in auth middleware we created
//Brining in mongoose user model
//Bringing in Config
//Bringing in express validator
//Bringing in JWT
//Brining in bcrypt
const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const config = require('config')
const { check, validationResult } = require('express-validator')
const jwt =  require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// @route   GET api/auth
// @desc    Getting user from DB: making a call to db so we use async await
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password') //Have to bring in mongoose user model to make a call to DB: find by id assigned by middleware to req.user. .select('-password) makes sure the password is not returned when getting user from db
        res.json(user) //Sends user that came from DB: should be everything besides password
    } catch(err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   POST api/auth
// @desc    Authenticate user & get token: login
// @access  Public
// @Note    The second arugment is middlewear called express-validator to validate data coming from request. Inside the bracket set is our check function to validate each field of data
// @Note    Rules for validating (ex: isEmail, isEmpty, or isLength) can be found in the docs
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
    ],  async (req, res) => {
        const errors = validationResult(req) //Assigning validationResults object to errors variable. (validationResults extracts validation errors from request)
        
        if (!errors.isEmpty()) { //If errors object isnt empty
            return res.status(400).json({ errors: errors.array() }) //Return a status of 400 (bad request) & a json object called 'errors' that takes the array (using array method: array()) of errors from the 'errors' variable
        }

        // @Objective: REGISTER USER    
        const { email, password } = req.body // Extracting specific data from request body

        try {
            let user = await User.findOne({ email: email }) // See if user exists: If user exists send back an error
            
            if (!user) {
                return res
                       .status(400)
                       .json({ errors: [{ msg: 'Invalid Credentials' }]}) //if you are ending the execution then add return
            }

            const isMatch = await bcrypt.compare(password, user.password)//Will compare plain text password to an encrypted password from user that was returned from DB call

            if(!isMatch) {//If password is not a match send error message
                return res
                       .status(400)
                       .json({ errors: [{ msg: 'Invalid Credentials' }]})
            }

            const payload = { //Main message for jsonwebtoken
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload,   //Signing jsonwebtoken: i believe these are the settings to generate the webtoken
                config.get('jwtSecret'), //the secret code used to encrypt it
                { expiresIn: 360000 }, //when token expires in seconds: very long for now until deployed
                (err, token) => {   //we'll either get a error or a token
                    if(err) throw err //if error then throw it
                    res.json({ token }) //if no error then return token
                }
            )

        } catch(err) {
            console.log(err.message)
            res.status(500).send('Server error')
        }
    }
)
//Default user credentials
//email:nick@gmail.com
//password:balls12

module.exports = router