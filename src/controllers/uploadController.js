const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.body.image) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        const result = await cloudinary.uploader.upload(req.body.image, {
            folder: 'cart_link/products',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
        });

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ success: false, message: 'No public_id provided' });
        }

        await cloudinary.uploader.destroy(public_id);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
