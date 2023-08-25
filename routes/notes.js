const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const fetchUser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");


//ROUTE1: Fetching all notes using GET "api/notes/fetchallnotes"
router.get("/fetchallnotes", fetchUser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {

        console.log(error)
        res.status(500).send("Some internal error occured.")

    }

});


//ROUTE2: Add a new note using POST "api/notes/addnote"
router.post("/addnote", fetchUser, [
    body("title", "Enter a valid title.").isLength({ min: 3 }),
    body("description", "Description must be at least five characters long.").isLength({ min: 5 })
], async (req, res) => {

    try {
        const { title, description, tag } = req.body;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const note = new Note({
            title, description, tag, user: req.user.id
        })

        const savedNote = await note.save()

        res.json(savedNote)
    } catch (error) {

        console.log(error)
        res.status(500).send("Some internal error occured.")

    }

});

//ROUTE3: Updating an existing note using PUT "api/notes/updatenote"    Login Required
router.put("/updatenote/:id", fetchUser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;

        //Creating a new note object
        const newNote = {}

        if (title) { newNote.title = title }
        if (description) { newNote.description = description }
        if (tag) { newNote.tag = tag }

        //Find the note to be updated and update it
        let note = await Note.findById(req.params.id)
        if (!note) { return res.status(404).send("Not Found") }

        if (note.user.toString() !== req.user.id) {   //means user is trying to access someone else's notes
            return res.status(401).send("Not Allowed")
        }


        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
        res.json({ note })


    } catch (error) {
        console.log(error)
        res.status(500).send("Some internal error occured.")
    }
})


//ROUTE4: Deleting an existing note using DELETE "api/notes/deletenote"    Login Required
router.delete("/deletenote/:id", fetchUser, async (req, res) => {
    try {

        //Find the note
        let note = await Note.findById(req.params.id)
        if (!note) { return res.status(404).send("Not Found") }

        //Allow deletion only if user own this note
        if (note.user.toString() !== req.user.id) {   //means user is trying to access someone else's notes
            return res.status(401).send("Not Allowed")
        }


        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "Success": "Note has been succesfully deleted." })


    } catch (error) {
        console.log(error)
        res.status(500).send("Some internal error occured.")
    }

})
module.exports = router