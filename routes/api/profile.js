//Bringing in Express
//Bringing in express router function for creating routes
//Assigning express.Router() to 'router' variable
//Bringing in express validator
//Brining in request node package
const express = require('express')
const router = express.Router()
const auth =  require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const Post = require('../../models/Post')
const { check, validationResult } = require('express-validator')
const request = require('request')
const config = require('config')
const { response } = require('express')


// @route   GET api/profile/me
// @desc    Return my profile based on user id inside token
// @access  Private
router.get('/me', auth, async (req, res) => { //adding auth middleware to make secure route && adding async since we're hitting the db
    try {//try catch to catch any internal errors
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']) //profile is assigned to whatver comes back from DB hit, we also add in name and avatar from the user model that is found

        if(!profile) {
            res.status(400).json({ msg: 'There is no profile for this user' })
            return
        }

        res.json(profile)

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private
router.post('/',
    [auth, [ check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty() ]], //Muliple middlewares need to be nested in an array | Check to see if status is filled out on when user is requesting to create or update a user profile | rule saying 'make sure this value is not empty' | Same thing for skills
    async (req, res) => {
        const errors = validationResult(req) //Checking that request is filled out | sanitizing inputs of the request before sending
        if(!errors.isEmpty()) { //if errors is not empty
            return res.status(400).json({ errors: errors.array() }) //Sending back the errors that came back in the validationResults that are assigned to 'errors'
        }

        const { //Extracing all fields from the request and assiging them to their own field name variable
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body

        // Build profile object
        const profileFields = {} //Initializes object
        profileFields.user = req.user.id //Assigning user field in the profile with request user id which was set by the token when token was created
        if(company) profileFields.company = company //if the company variable exists then it was extracted from the request body and can be accessed and assigned to company filed in the profile... etc
        if(website) profileFields.website = website
        if(location) profileFields.location = location
        if(bio) profileFields.bio = bio
        if(status) profileFields.status = status
        if(githubusername) profileFields.githubusername = githubusername
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim())
        }

        //Build social object
        profileFields.social = {}
        if(youtube) profileFields.social.youtube = youtube
        if(facebook) profileFields.social.facebook = facebook
        if(twitter) profileFields.social.twitter = twitter
        if(instagram) profileFields.social.instagram = instagram
        if(linkedin) profileFields.social.linkedin = linkedin

        //Once profile is built

        try { //looking for profile to update
            let profile = await Profile.findOne({ user: req.user.id }) //assigning profile variable to what returns from search for a Profile model in the DB | finding one Profile model that has a user field 
            
            if(profile) { //if a profile was found then we will update it
                profile = await Profile.findOneAndUpdate( //Mongooose method findOneAndUpdate()
                    { user: req.user.id }, //find it by Profile model that has a user field that matches our request body.id
                    { $set: profileFields }, //creates profile.profilefields
                    { new:true } //is a new object?
                )

                return res.json(profile)
            }

            //If no profile is found then we'll create one
            profile = new Profile(profileFields)

            await profile.save()
            res.json(profile)

        } catch(err) {
            console.error(err.message)
            res.status(500).send('Server Error')
        }
})


// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']) //Finding only the Profile models in DB, addon from the User model: name & avatar
        res.json(profiles)
    } catch(err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {                                                               //:user_id is a known placeholder for object ids: 'user' is the object and '_id' is the value: comes from request body
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']) //finding one Profile model that has the user field that matches the user_id from the url | not sure how the user id ends up in the URL without setting it up: i believe this will be setup in express? it needs to be setup somewhere
        
        if(!profile) return res.status(400).json({ msg: 'Profile not found' })
        
        res.json(profile)
    } catch(err) {
        console.error(err.message)
        if(err.kind == 'ObjectId') {
            res.status(400).json({ msg: 'Profile not found' })
        }
        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile
// @desc    Delete profile, user, & posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove user posts
        await Post.deleteMany({ user: req.user.id })
        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id }) //we only need a variable for when we're getitng something from the DB so we can store it in | since we're deleting we can just tell the DB what to do and it wont give us anything back
        //Remove user
        await User.findOneAndRemove({ _id: req.user.id })
        
        res.json({ msg: 'User deleted' })
    } catch(err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', 
    [auth, //Auth for user, and validation for input coming from form on frontend
        [check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()]
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { //extracing field values from the req.body that is coming from the form
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })

            profile.experience.unshift(newExp) //unshift is the same as push but it adds the most recent to the begining instead of the end | most recent are first

            await profile.save()

            res.json(profile)
        } catch(err) {
            console.error(err.message)
            res.status(500).send('Server Error')
        }
})


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }) //Get profile
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)//This goes through the experience object and finds each expierence blocks ID and finally it matches it to the exp_id from the url. Thus assigning it to removeIndex //map through experience | for each item return the item id (experiences) | match it to params placeholder of exp_id

        profile.experience.splice(removeIndex, 1) //from profile -> expirence take out the one thing in the removeIndex | index is the position in the array or object starting from 0

        await profile.save()
        res.json(profile)

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', 
    [auth, //Auth for user, and validation for input coming from form on frontend
        [check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()]
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { //extracing field values from the req.body that is coming from the form
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })

            profile.education.unshift(newEdu) //unshift is the same as push but it adds the most recent to the begining instead of the end | most recent are first

            await profile.save()

            res.json(profile)
        } catch(err) {
            console.error(err.message)
            res.status(500).send('Server Error')
        }
})


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }) //Get profile
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)//This goes through the experience object and finds each expierence blocks ID and finally it matches it to the exp_id from the url. Thus assigning it to removeIndex //map through experience | for each item return the item id (experiences) | match it to params placeholder of exp_id

        profile.education.splice(removeIndex, 1) //from profile -> expirence take out the one thing in the removeIndex | index is the position in the array or object starting from 0

        await profile.save()
        res.json(profile)

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   GET api/profile/github/:username
// @desc    GET user repos from github | using request because mongoose is for mongoDB only therefore we need to do longer form of requests | request package makes requests simpler
// @access  Public
router.get('/github/:username', (req, res) => {
    try{
        const options = { //gets plugged into request
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`, //to get repos from users github
            method: 'GET',
            headers: { 'user-agent': 'node.js' } //inserted to fix bug
        }

        request(options, (error, response, body) => { //request package request
            if(error) console.error(error) //catch errors

            if(response.statusCode !== 200) { //if a status code is thrown that isnt a success
                return res.status(404).json({ msg: 'No Github profile found' })
            }

            res.json(JSON.parse(body)) //return request body
        })

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


module.exports = router