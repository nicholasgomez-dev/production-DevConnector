//Bringing in Express
//Assigning express.Router() to 'router' variable
//Bringing in express validation
//Bringing in Auth middleware
//Bringing in mongoose models
const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const { restart } = require('nodemon')
const auth = require('../../middleware/auth')

const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')


// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', [ auth, [check('text', 'Text is required').not().isEmpty()] ], 
async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password') //Finding a user model by the id that was given in the req.user.id and returning the user minus the password

        const newPost = new Post({ //Creating a new template of a post we're sending | gathers all assets it needs 
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        const post = await newPost.save()

        res.json(post)
    } catch(err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
    
})

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }) //Find all posts and return them with the most recent first | date: -1 bringing u the most recent first
        res.json(posts)
     } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id) //Find all posts and return them with the most recent first | date: -1 bringing u the most recent first
        
        if(!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }
        
        res.json(post)
     } catch (err) {
        console.error(err.message)

        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' })
        }

        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)//Find post by Id

        if(!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' })
        } 

        await post.remove()

        res.json({ msg: 'Post deleted' })
     } catch (err) {
        console.error(err.message)

        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' })
        }

        res.status(500).send('Server Error')
    }
})

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) { //filtering through likes array to see if the user's id is in the likes array for the post already | anything greater than 0 will not add another like
            return res.status(400).json({ msg: 'Post already liked' })
        }

        post.likes.unshift({ user: req.user.id })

        await post.save()

        res.json(post.likes)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) { //filtering through likes array to see if the user's id is in the likes array for the post already | anything greater than 0 will not add another like
            return res.status(400).json({ msg: 'Post has not yet been liked' })
        }
        
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)//Get remove index | map through likes array in post model that we got from db, 

        post.likes.splice(removeIndex, 1)

        await post.save()

        res.json(post.likes)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post('/comment/:id', [ auth, [check('text', 'Text is required').not().isEmpty()] ], 
async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password') //Finding a user model by the id that was given in the req.user.id and returning the user minus the password
        const post = await Post.findById(req.params.id)

        const newComment = { 
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }
        
        post.comments.unshift(newComment)

        await post.save()

        res.json(post)
    } catch(err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
    
})

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id) //Find post
        const comment = await post.comments.find(comment => comment.id === req.params.comment_id) //Get comment

        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' }) //Make sure comment exists
        }

        if (comment.user.toString() !== req.user.id) { //Check to see if this is the users comment
            return res.status(401).json({ msg: 'User not authorized' })
        }

        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id)

        post.comments.splice(removeIndex, 1)

        await post.save()

        res.json(post.comments)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

module.exports = router