const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');

    try {

        //Step 2: task 1
        const db = await connectToDatabase();

        //Step 2: task 2
        const collection = db.collection("secondChanceItems");

        //Step 3: task 3
        const secondChanceItems = await collection.find({}).toArray();

        //Step 4: task 4
        res.json(secondChanceItems);

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {

    try {

        // Task 1
        const db = await connectToDatabase();

        // Task 2
        const collection = db.collection("secondChanceItems");


        // Task 3
        let secondChanceItem = req.body;


        // Task 4
        const lastItemQuery = await collection
            .find()
            .sort({id: -1})
            .limit(1);


        await lastItemQuery.forEach(item => {

            secondChanceItem.id =
                (parseInt(item.id) + 1).toString();

        });


        // Task 5
        const date_added =
            Math.floor(new Date().getTime() / 1000);

        secondChanceItem.date_added = date_added;


        // Task 6
        secondChanceItem =
            await collection.insertOne(secondChanceItem);


        // Task 7
        if(req.file){
            secondChanceItem.image =
                "/images/" + req.file.filename;
        }


        res.status(201).json(secondChanceItem.ops[0]);


    } catch (e) {

        next(e);

    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {

    try {

        // Task 1
        const db = await connectToDatabase();


        // Task 2
        const collection = db.collection("secondChanceItems");


        // Task 3
        const id = req.params.id;

        const secondChanceItem =
            await collection.findOne({ id: id });


        // Task 4
        if (!secondChanceItem) {

            return res
                .status(404)
                .send("secondChanceItem not found");

        }


        res.json(secondChanceItem);


    } catch (e) {

        next(e);

    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {

    try {

        // Task 1
        const db = await connectToDatabase();


        // Task 2
        const collection = db.collection("secondChanceItems");


        const id = req.params.id;


        // Task 3
        const secondChanceItem =
            await collection.findOne({ id });


        if (!secondChanceItem) {

            logger.error('secondChanceItem not found');

            return res
                .status(404)
                .json({
                    error: "secondChanceItem not found"
                });

        }


        // Task 4
        secondChanceItem.category =
            req.body.category;

        secondChanceItem.condition =
            req.body.condition;

        secondChanceItem.age_days =
            req.body.age_days;

        secondChanceItem.description =
            req.body.description;


        secondChanceItem.age_years =
            Number(
                (secondChanceItem.age_days / 365)
                .toFixed(1)
            );


        secondChanceItem.updatedAt =
            new Date();



        const updatedItem =
            await collection.findOneAndUpdate(
                { id },
                {
                    $set: secondChanceItem
                },
                {
                    returnDocument: 'after'
                }
            );


        // Task 5
        if (updatedItem) {

            res.json({
                "uploaded": "success"
            });

        } else {

            res.json({
                "uploaded": "failed"
            });

        }


    } catch (e) {

        next(e);

    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {

    try {

        // Task 1
        const db = await connectToDatabase();


        // Task 2
        const collection =
            db.collection("secondChanceItems");


        const id = req.params.id;


        // Task 3
        const secondChanceItem =
            await collection.findOne({ id });


        if (!secondChanceItem) {

            logger.error('secondChanceItem not found');

            return res
                .status(404)
                .json({
                    error: "secondChanceItem not found"
                });

        }


        // Task 4
        await collection.deleteOne({ id });


        res.json({
            "deleted": "success"
        });


    } catch (e) {

        next(e);

    }
});

module.exports = router;
