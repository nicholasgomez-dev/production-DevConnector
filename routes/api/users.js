//Bringing in Express
//Bringing in express router function for creating routes
//Assigning express.Router() to 'router' variable
//Bringing in Express Validator to validate data sent from user
//Bringing in mongoose User model
//Brining in Gravatar package
//Brining in bcrypt
//Bringing in jsonwebtoken
//Brining in config to access jwt secret
const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const User = require('../../models/User')
const gravatar =  require('gravatar')
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')
const config = require('config')


// @route   POST api/users
// @desc    Register user
// @access  Public
// @Note    The second arugment is middlewear called express-validator to validate data coming from request. Inside the bracket set is our check function to validate each field of data
// @Note    Rules for validating (ex: isEmail, isEmpty, or isLength) can be found in the docs
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],  async (req, res) => {
        const errors = validationResult(req) //Assigning validationResults object to errors variable. (validationResults extracts validation errors from request)
        
        if (!errors.isEmpty()) { //If errors object isnt empty
            return res.status(400).json({ errors: errors.array() }) //Return a status of 400 (bad request) & a json object called 'errors' that takes the array (using array method: array()) of errors from the 'errors' variable
        }

        // @Objective: REGISTER USER    
        const { name, email, password } = req.body // Extracting specific data from request body

        try {
            let user = await User.findOne({ email: email }) // See if user exists: If user exists send back an error
            
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }]}) //if you are ending the execution then add return
            }

            const avatar = gravatar.url(email, { // Get users gravatar
                s: '200',
                r: 'pg',
                d: 'mm'
            })

            user = new User({
                name,
                email,
                avatar,
                password
            })

            const salt = await bcrypt.genSalt(10) //dont know what a salt is (i think its a config for bcrypt)

            user.password = await bcrypt.hash(password, salt) // Encrypt password

            await user.save() // saves user

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

module.exports = router