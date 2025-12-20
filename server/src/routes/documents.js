const express = require('express');
const router = express.Router();

const {createDocument , getDocumentId} = require('../controllers/documentController');

router.post('/' , createDocument);
router.get('/:id' , getDocumentId);

module.exports = router;