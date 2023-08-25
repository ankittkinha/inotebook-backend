const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const fetchUser = require("../middleware/fetchUser")

const JWT_SECRET = "ank579t@$2ki&";

//ROUTE1: Create a user using POST "/api/auth/createuser". No login required
router.post("/createuser", [
    body("name", "Enter a valid name.").isLength({ min: 3 }),
    body("email", "Enter a valid email.").isEmail(),
    body("password", "Password must be at least five characters long.").isLength({ min: 5 })
], async (req, res) => {

    //if there are errors, return bad request and errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        //chech whther user with same email already exits
        let user = await User.findOne({ email: req.body.email })

        if (user) {
            return res.status(400).json({ error: "This email already exists." })
        }

        const salt = await bcrypt.genSalt(10)
        const secPass = await bcrypt.hash(req.body.password, salt)


        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass
        })

        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET)

        // .then(user => res.json(user))
        // .catch(err => {console.log(err)
        // res.json({error: "Please enter a unique email", message: err.message})})

        res.json({ authToken })

    } catch (error) {

        console.log(error)
        res.status(500).send("Some internal error occured.")

    }
})



//ROUTE2: Authenticate a user using POST "/api/auth/login". Login Required
router.post("/login", [
    body("email", "Enter a valid email.").isEmail(),
    body("password", "Password cannot be blank.").exists()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email: email })
        if (!user) {
            return res.status(400).json({ error: "Incorrect credentials. Please try again." })
        }

        const passwordCompare = await bcrypt.compare(password, user.password)

        if (!passwordCompare) {
            return res.status(400).json({ error: "Incorrect credentials. Please try again." })
        }

        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET)

        res.json({ authToken })

    } catch (error) {
        console.log(error)
        res.status(500).send("Some internal error occured.")
    }
})


//ROUTE3: Get logged in user details using POST "/api/auth/getuser". No login required
router.post("/getuser", fetchUser, async (req, res) => {
try {
    let userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)
} catch (error) {
    console.log(error)
    res.status(500).send("Some internal error occured.")
}
})

module.exports = router;