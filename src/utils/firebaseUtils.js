const admin = require('firebase-admin');

/**
 * Send FCM push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendFCMNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) {
        console.log('No FCM tokens provided');
        return;
    }

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens: tokens.filter(token => token && token.trim() !== '')
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log('FCM notification sent successfully:', {
            successCount: response.successCount,
            failureCount: response.failureCount
        });

        // Log failures for debugging
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`FCM token ${idx} failed:`, resp.error);
                }
            });
        }

        return response;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        throw error;
    }
};

/**
 * Send notification to shop followers when a new product is added
 * @param {string} shopId - Shop ID
 * @param {string} productName - Product name
 * @param {string} shopName - Shop name
 */
const notifyFollowersOfNewProduct = async (shopId, productName, shopName) => {
    try {
        const Customer = require('../models/Customer');

        // Get all customers who follow this shop and have FCM tokens
        const followers = await Customer.find({
            followedShops: shopId,
            fcmToken: { $exists: true, $ne: null, $ne: '' }
        }).select('fcmToken');

        if (followers.length === 0) {
            console.log('No followers with FCM tokens found for shop:', shopId);
            return;
        }

        const tokens = followers.map(follower => follower.fcmToken);

        await sendFCMNotification(
            tokens,
            'New Product Added!',
            `${shopName} added a new product: ${productName}`,
            {
                type: 'new_product',
                shopId: shopId.toString(),
                shopName
            }
        );
    } catch (error) {
        console.error('Error notifying followers of new product:', error);
    }
};

/**
 * Send notification to shop followers when a new offer is created
 * @param {string} shopId - Shop ID
 * @param {string} offerTitle - Offer title
 * @param {string} shopName - Shop name
 */
const notifyFollowersOfNewOffer = async (shopId, offerTitle, shopName) => {
    try {
        const Customer = require('../models/Customer');

        // Get all customers who follow this shop and have FCM tokens
        const followers = await Customer.find({
            followedShops: shopId,
            fcmToken: { $exists: true, $ne: null, $ne: '' }
        }).select('fcmToken');

        if (followers.length === 0) {
            console.log('No followers with FCM tokens found for shop:', shopId);
            return;
        }

        const tokens = followers.map(follower => follower.fcmToken);

        await sendFCMNotification(
            tokens,
            'New Offer Available!',
            `${shopName} has a new offer: ${offerTitle}`,
            {
                type: 'new_offer',
                shopId: shopId.toString(),
                shopName
            }
        );
    } catch (error) {
        console.error('Error notifying followers of new offer:', error);
    }
};

module.exports = {
    sendFCMNotification,
    notifyFollowersOfNewProduct,
    notifyFollowersOfNewOffer
};