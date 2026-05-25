const express = require('express');
const router = express.Router();
const {auth} = require('../middlewares/auth');

const {createDocument , getDocumentId , updateDocument, shareDocument, getSharedDocuments} = require('../controllers/documentController');

router.post('/' ,auth ,createDocument);
router.post('/share', auth, shareDocument);
router.get('/shared/me', auth, getSharedDocuments);
router.get('/:id' ,auth ,getDocumentId);
router.put('/:id',auth , updateDocument);

module.exports = router;