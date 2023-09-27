const express = require("express")
const router = express.Router();
const controllers = require('../controllers/controllers')

// Define a sample route
router.get('/',controllers.hello);
router.post('/nylas/generate-auth-url',express.json(),controllers.generateAuthURL);
router.post('/nylas/exchange-mailbox-token',express.json(),controllers.getTokenFromCode)

module.exports = router;