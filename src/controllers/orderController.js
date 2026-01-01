const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Create a new order from cart items (one customer, one shop)
exports.createOrder = async (req, res) => {
    try {
        const { customerId, shopId, products, deliveryAddress, deliveryLat, deliveryLng } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required',
            });
        }

        if (!shopId) {
            return res.status(400).json({
                success: false,
                message: 'Shop ID is required',
            });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one product is required',
            });
        }

        // Validate products and calculate total
        let totalAmount = 0;
        const processedProducts = [];

        for (const product of products) {
            if (!product.productId || !product.quantity || !product.price) {
                return res.status(400).json({
                    success: false,
                    message: 'Each product must have productId, quantity, and price',
                });
            }

            const lineTotal = product.price * product.quantity;
            totalAmount += lineTotal;

            processedProducts.push({
                productId: product.productId,
                quantity: product.quantity,
                price: product.price,
                mrp: product.mrp || product.price,
            });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create the order
        const newOrder = new Order({
            customerId,
            shopId,
            products: processedProducts,
            totalAmount,
            orderStatus: 'pending',
            deliveryOtp: otp,
            deliveryAddress: deliveryAddress || '',
            deliveryLocation: {
                lat: typeof deliveryLat === 'number' ? deliveryLat : (deliveryLat ? Number(deliveryLat) : undefined),
                lng: typeof deliveryLng === 'number' ? deliveryLng : (deliveryLng ? Number(deliveryLng) : undefined),
            },
        });

        const savedOrder = await newOrder.save();

        // Delete cart items for this customer and shop
        await Cart.deleteMany({ customerId, shopId });

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: savedOrder,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating order',
        });
    }
};

// Get orders by customer ID
exports.getByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        const orders = await Order.find({ customerId })
            .populate('customerId', 'customerName name email mobile phone')
            .populate('shopId', 'shopName name contact phone mobile')
            .populate('products.productId', 'name price mrp')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching orders',
        });
    }
};

// Get orders by shop ID
exports.getByShop = async (req, res) => {
    try {
        const { shopId } = req.params;

        const orders = await Order.find({ shopId })
            .populate('customerId', 'customerName name email mobile phone')
            .populate('shopId', 'shopName name contact phone mobile')
            .populate('products.productId', 'name price mrp')
            .populate('cancelledProducts.productId', 'name price mrp')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching orders',
        });
    }
};

// Get order by ID
exports.getById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('customerId', 'customerName name email mobile phone')
            .populate('shopId', 'shopName name contact phone mobile')
            .populate('products.productId', 'name price mrp')
            .populate('cancelledProducts.productId', 'name price mrp');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching order',
        });
    }
};

// Update order status
exports.updateStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus, updatedAt: Date.now() },
            { new: true },
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order status updated',
            data: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating order status',
        });
    }
};

// Verify OTP and update order status to delivered
exports.verifyOtpAndDeliver = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required',
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        // Verify OTP
        if (order.deliveryOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        // Update order status to delivered
        order.orderStatus = 'delivered';
        order.updatedAt = Date.now();
        const updatedOrder = await order.save();

        return res.status(200).json({
            success: true,
            message: 'Order marked as delivered',
            data: updatedOrder,
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error verifying OTP',
        });
    }
};

// Cancel product from order by quantity
exports.cancelProduct = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { productId, quantityToCancel, customerId } = req.body;

        // Validate inputs
        if (!productId || !quantityToCancel || quantityToCancel <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and valid quantity to cancel are required',
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Find the product in the order
        const productIndex = order.products.findIndex(
            p => p.productId.toString() === productId,
        );

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in this order',
            });
        }

        const currentQuantity = order.products[productIndex].quantity;

        // Validate cancellation quantity
        if (quantityToCancel > currentQuantity) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel ${quantityToCancel} items. Only ${currentQuantity} available in order`,
            });
        }

        // Store product info for history
        const cancelledProduct = {
            productId: order.products[productIndex].productId,
            productName: order.products[productIndex].productName || 'Product',
            quantity: quantityToCancel,
            price: order.products[productIndex].price,
            cancelledAt: new Date(),
            customerId,
        };

        // Remove or update product quantity
        if (quantityToCancel === currentQuantity) {
            // Remove product entirely if all quantity is cancelled
            order.products.splice(productIndex, 1);
        } else {
            // Reduce quantity
            order.products[productIndex].quantity -= quantityToCancel;
        }

        // Initialize cancelledProducts array if it doesn't exist
        if (!order.cancelledProducts) {
            order.cancelledProducts = [];
        }

        // Add to cancellation history
        order.cancelledProducts.push(cancelledProduct);

        // Recalculate total amount
        let newTotal = 0;
        order.products.forEach(p => {
            newTotal += (p.price * p.quantity);
        });
        order.totalAmount = newTotal;

        // Update timestamp
        order.updatedAt = new Date();

        // Save the updated order
        const updatedOrder = await order.save();

        // Populate before sending response
        await updatedOrder.populate('customerId', 'customerName name email mobile phone');
        await updatedOrder.populate('shopId', 'shopName name contact phone mobile');
        await updatedOrder.populate('products.productId', 'name price mrp');
        await updatedOrder.populate('cancelledProducts.productId', 'name price mrp');

        return res.status(200).json({
            success: true,
            message: `Successfully cancelled ${quantityToCancel} item${quantityToCancel > 1 ? 's' : ''} from order`,
            data: updatedOrder,
        });

    } catch (error) {
        console.error('Error cancelling product:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error cancelling product',
        });
    }
};

// Undo cancelled product quantity (restore)
exports.undoCancelProduct = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cancelledRecordId, productId, quantityToRestore, customerId } = req.body;

        if (!productId && !cancelledRecordId) {
            return res.status(400).json({ success: false, message: 'productId or cancelledRecordId is required' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.cancelledProducts || order.cancelledProducts.length === 0) {
            return res.status(400).json({ success: false, message: 'No cancelled products to restore' });
        }

        // Find cancelled record by id or by productId (prefer id)
        let cancelledIndex = -1;
        if (cancelledRecordId) {
            cancelledIndex = order.cancelledProducts.findIndex(c => c._id && c._id.toString() === cancelledRecordId.toString());
        }
        if (cancelledIndex === -1 && productId) {
            // find the most recent cancelled entry for this product
            for (let i = order.cancelledProducts.length - 1; i >= 0; i--) {
                const c = order.cancelledProducts[i];
                const pId = c.productId ? c.productId.toString() : (c.productId || '');
                if (pId === productId) { cancelledIndex = i; break; }
            }
        }

        if (cancelledIndex === -1) {
            return res.status(404).json({ success: false, message: 'Cancelled record not found' });
        }

        const cancelledRecord = order.cancelledProducts[cancelledIndex];
        const restoreQty = (quantityToRestore && quantityToRestore > 0) ? quantityToRestore : (cancelledRecord.quantity || 0);
        if (!restoreQty || restoreQty <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid restore quantity' });
        }

        // Restore into order.products
        const prodIndex = order.products.findIndex(p => p.productId && p.productId.toString() === (cancelledRecord.productId ? cancelledRecord.productId.toString() : productId));
        if (prodIndex === -1) {
            // Add product back
            order.products.push({
                productId: cancelledRecord.productId || productId,
                productName: cancelledRecord.productName || '',
                quantity: restoreQty,
                price: cancelledRecord.price || 0,
                mrp: cancelledRecord.mrp || cancelledRecord.price || 0,
            });
        } else {
            order.products[prodIndex].quantity = (order.products[prodIndex].quantity || 0) + restoreQty;
        }

        // Decrease or remove cancelled record
        if (restoreQty >= (cancelledRecord.quantity || 0)) {
            // remove record
            order.cancelledProducts.splice(cancelledIndex, 1);
        } else {
            order.cancelledProducts[cancelledIndex].quantity = (cancelledRecord.quantity || 0) - restoreQty;
        }

        // Recalculate total amount
        let newTotal = 0;
        order.products.forEach(p => { newTotal += (p.price * p.quantity); });
        order.totalAmount = newTotal;

        order.updatedAt = new Date();

        const updatedOrder = await order.save();

        await updatedOrder.populate('customerId', 'customerName name email mobile phone');
        await updatedOrder.populate('shopId', 'shopName name contact phone mobile');
        await updatedOrder.populate('products.productId', 'name price mrp');
        await updatedOrder.populate('cancelledProducts.productId', 'name price mrp');

        return res.status(200).json({ success: true, message: 'Cancelled product restored', data: updatedOrder });

    } catch (error) {
        console.error('Error undoing cancelled product:', error);
        return res.status(500).json({ success: false, message: error.message || 'Error undoing cancelled product' });
    }
};
