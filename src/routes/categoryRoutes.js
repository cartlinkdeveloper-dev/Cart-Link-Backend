const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories);
router.get('/search', categoryController.searchCategories);
router.get('/:category/products', categoryController.getCategoryProducts);

module.exports = router;
