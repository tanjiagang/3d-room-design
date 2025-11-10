const router = require('express').Router();

router.get('/chinese', (req, res) => {
  res.send('Hello World!' + req.query.name);
});

module.exports = router;