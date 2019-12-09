const router = module.exports = require('express').Router();
const path = require('path');

router.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

router.use('/boats', require('./boats'));
router.use('/slips', require('./slips'));
router.use('/loads', require('./loads'));
router.use('/users', require('./users'));
router.use('/login', require('./login'));