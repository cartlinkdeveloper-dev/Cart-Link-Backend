const Product = require('../models/Product');

exports.getAllCategories = async (req, res) => {
    try {
        // Get distinct categories from products
        const categories = await Product.distinct('category');

        // Filter out null/undefined and convert to objects with name
        const categoryList = categories
            .filter(cat => cat && cat.trim().length > 0)
            .map(cat => ({
                name: cat,
                categoryName: cat
            }));

        return res.json({ success: true, data: categoryList });
    } catch (err) {
        console.error('getAllCategories error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchCategories = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Get distinct categories and filter by search query
        const allCategories = await Product.distinct('category');

        const filteredCategories = allCategories
            .filter(cat => cat && cat.trim().length > 0)
            .filter(cat => cat.toLowerCase().includes(q.toLowerCase()))
            .map(cat => ({
                name: cat,
                categoryName: cat
            }))
            .slice(0, 50);

        return res.json({ success: true, data: filteredCategories });
    } catch (err) {
        console.error('searchCategories error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCategoryProducts = async (req, res) => {
    try {
        const { category } = req.params;

        const products = await Product.find({ category: new RegExp(`^${category}$`, 'i') })
            .select('name description price mrp category images inStock')
            .limit(50)
            .lean();

        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('getCategoryProducts error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
