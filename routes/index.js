const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.render('indexSister');
});

router.get('/pesan', async (req, res) => {
  res.render('pesanSister');
});

router.get('/pesanan', async (req, res) => {
  res.render('pesanan');
});

module.exports = router;
