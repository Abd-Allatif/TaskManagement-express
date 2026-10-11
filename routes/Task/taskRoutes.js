const router = require('express').Router();

router.get('/', (req, res) => {
    res.json('Welcome to the Task Managment API.');
});

// Placeholder for future task-related routes

module.exports = router;