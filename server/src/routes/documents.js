const express = require('express');
const router = express.Router();
const {auth} = require('../middlewares/auth');

const {createDocument , getDocumentId , updateDocument} = require('../controllers/documentController');

router.post('/' ,auth ,createDocument);
router.post('/:id' ,auth ,getDocumentId);
router.put('/:id',auth , updateDocument);

module.exports = router;