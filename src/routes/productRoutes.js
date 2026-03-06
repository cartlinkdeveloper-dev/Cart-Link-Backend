const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/', productController.createProduct);
router.get('/search', productController.searchProducts);
router.get('/', productController.getAllProducts);
router.get('/with-images', productController.getAllProductsWithImages);
router.get('/followed', productController.getFollowedShopsProducts);

router.get('/:id', productController.getProductById);
router.get('/:id/images', productController.getProductImages);
router.delete('/:id', productController.deleteProduct);
router.put('/:id', productController.updateProduct);

module.exports = router;

