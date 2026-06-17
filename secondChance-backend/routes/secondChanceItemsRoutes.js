const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

const directoryPath = 'public/images'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })


// Get all items
router.get('/', async (req, res, next) => {
  logger.info('/ called')

  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItems = await collection.find({}).toArray()

    res.json(secondChanceItems)
  } catch (e) {
    logger.error(e)
    next(e)
  }
})


// Add item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    let secondChanceItem = req.body

    const lastItemQuery = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)

    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id) + 1).toString()
    })

    secondChanceItem.date_added =
      Math.floor(new Date().getTime() / 1000)

    if (req.file) {
      secondChanceItem.image = '/images/' + req.file.filename
    }

    const result = await collection.insertOne(secondChanceItem)

    res.status(201).json(result.ops[0])
  } catch (e) {
    next(e)
  }
})


// Get item by id
router.get('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const id = req.params.id

    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})


// Update item
router.put('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const id = req.params.id

    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')

      return res.status(404).json({
        error: 'secondChanceItem not found'
      })
    }

    secondChanceItem.category = req.body.category
    secondChanceItem.condition = req.body.condition
    secondChanceItem.age_days = req.body.age_days
    secondChanceItem.description = req.body.description

    secondChanceItem.age_years =
      Number((secondChanceItem.age_days / 365).toFixed(1))

    secondChanceItem.updatedAt = new Date()

    const updatedItem = await collection.findOneAndUpdate(
      { id },
      {
        $set: secondChanceItem
      },
      {
        returnDocument: 'after'
      }
    )

    if (updatedItem) {
      res.json({
        uploaded: 'success'
      })
    } else {
      res.json({
        uploaded: 'failed'
      })
    }
  } catch (e) {
    next(e)
  }
})


// Delete item
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const id = req.params.id

    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).json({
        error: 'secondChanceItem not found'
      })
    }

    await collection.deleteOne({ id })

    res.json({
      deleted: 'success'
    })
  } catch (e) {
    next(e)
  }
})


module.exports = router
