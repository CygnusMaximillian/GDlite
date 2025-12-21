const express = require('express');
const router = express.Router();
const {auth} = require('../middlewares/auth');

const {createDocument , getDocumentId} = require('../controllers/documentController');

router.post('/' ,auth,createDocument);
router.get('/:id' ,auth,getDocumentId);

module.exports = router;