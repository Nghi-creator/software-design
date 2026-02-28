import express from 'express';
import * as productModel from '../models/product.model.js';
import * as reviewModel from '../models/review.model.js';
import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import { uploadMiddleware } from '../middlewares/upload.mdw.js';
import { SellerProductService } from '../services/sellerProduct.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const stats = await SellerProductService.getSellerStats(sellerId);
    res.render('vwSeller/dashboard', { stats });
});

// All Products - View only
router.get('/products', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const products = await productModel.findAllProductsBySellerId(sellerId);
    res.render('vwSeller/all-products', { products });
});

// Active Products - CRUD
router.get('/products/active', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const products = await productModel.findActiveProductsBySellerId(sellerId);
    res.render('vwSeller/active', { products });
});

// Pending Products - Waiting for payment
router.get('/products/pending', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const [products, stats] = await Promise.all([
        productModel.findPendingProductsBySellerId(sellerId),
        productModel.getPendingProductsStats(sellerId)
    ]);

    // Lấy message từ query param
    let success_message = '';
    if (req.query.message === 'cancelled') {
        success_message = 'Auction cancelled successfully!';
    }

    res.render('vwSeller/pending', { products, stats, success_message });
});

// Sold Products - Paid successfully
router.get('/products/sold', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const [products, stats] = await Promise.all([
        productModel.findSoldProductsBySellerId(sellerId),
        productModel.getSoldProductsStats(sellerId)
    ]);

    // Fetch review info for each product
    const productsWithReview = await Promise.all(products.map(async (product) => {
        const review = await reviewModel.getProductReview(sellerId, product.highest_bidder_id, product.id);

        // Only show review if rating is not 0 (actual rating, not skip)
        const hasActualReview = review && review.rating !== 0;

        return {
            ...product,
            hasReview: hasActualReview,
            reviewRating: hasActualReview ? (review.rating === 1 ? 'positive' : 'negative') : null,
            reviewComment: hasActualReview ? review.comment : ''
        };
    }));

    res.render('vwSeller/sold-products', { products: productsWithReview, stats });
});

// Expired Products - No bidder or cancelled
router.get('/products/expired', async function (req, res) {
    const sellerId = req.session.authUser.id;
    const products = await productModel.findExpiredProductsBySellerId(sellerId);

    // Add review info for cancelled products with bidders
    for (let product of products) {
        if (product.status === 'Cancelled' && product.highest_bidder_id) {
            const review = await reviewModel.getProductReview(sellerId, product.highest_bidder_id, product.id);
            // Only show review if rating is not 0 (actual rating, not skip)
            const hasActualReview = review && review.rating !== 0;

            product.hasReview = hasActualReview;
            if (hasActualReview) {
                product.reviewRating = review.rating === 1 ? 'positive' : 'negative';
                product.reviewComment = review.comment;
            }
        }
    }

    res.render('vwSeller/expired', { products });
});

router.get('/products/add', async function (req, res) {
    const success_message = req.session.success_message;
    delete req.session.success_message; // Xóa message sau khi hiển thị
    res.render('vwSeller/add', { success_message });
});

router.post('/products/add', async function (req, res) {
    try {
        const sellerId = req.session.authUser.id;
        await SellerProductService.createProductFromRequest(req.body, sellerId);

        req.session.success_message = 'Product added successfully!';
        res.redirect('/seller/products/add');
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).send('Failed to add product');
    }
});

router.post('/products/upload-thumbnail', uploadMiddleware.single('thumbnail'), async function (req, res) {
    res.json({
        success: true,
        file: req.file
    });
});

router.post('/products/upload-subimages', uploadMiddleware.array('images', 10), async function (req, res) {
    res.json({
        success: true,
        files: req.files
    });
});

// Cancel Product
router.post('/products/:id/cancel', async function (req, res) {
    try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { reason, highest_bidder_id } = req.body;

        await SellerProductService.cancelAuction(productId, sellerId, reason, highest_bidder_id);

        res.json({ success: true, message: 'Auction cancelled successfully' });
    } catch (error) {
        console.error('Cancel product error:', error);

        if (error.message === 'Product not found') {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Rate Bidder
router.post('/products/:id/rate', async function (req, res) {
    try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { rating, comment, highest_bidder_id } = req.body;

        if (!highest_bidder_id) {
            return res.status(400).json({ success: false, message: 'No bidder to rate' });
        }

        await SellerProductService.rateBidder(productId, sellerId, rating, comment, highest_bidder_id);

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Rate bidder error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Bidder Rating
router.put('/products/:id/rate', async function (req, res) {
    try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { rating, comment, highest_bidder_id } = req.body;

        if (!highest_bidder_id) {
            return res.status(400).json({ success: false, message: 'No bidder to rate' });
        }

        await SellerProductService.updateBidderRating(productId, sellerId, rating, comment, highest_bidder_id);

        res.json({ success: true, message: 'Rating updated successfully' });
    } catch (error) {
        console.error('Update rating error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Append Description to Product
router.post('/products/:id/append-description', async function (req, res) {
    try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { description } = req.body;

        if (!description || description.trim() === '') {
            return res.status(400).json({ success: false, message: 'Description is required' });
        }

        const product = await productModel.findByProductId2(productId, null);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await SellerProductService.appendDescription(productId, sellerId, description);
        res.json({ success: true, message: 'Description appended successfully' });
    } catch (error) {
        console.error('Append description error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Description Updates for a Product
router.get('/products/:id/description-updates', async function (req, res) {
    try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;

        // Verify that the product belongs to the seller
        const product = await productModel.findByProductId2(productId, null);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Get all description updates for this product
        const updates = await productDescUpdateModel.findByProductId(productId);

        res.json({ success: true, updates });
    } catch (error) {
        console.error('Get description updates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update a Description Update
router.put('/products/description-updates/:updateId', async function (req, res) {
    try {
        const updateId = req.params.updateId;
        const sellerId = req.session.authUser.id;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        // Get the update to verify ownership
        const update = await productDescUpdateModel.findById(updateId);
        if (!update) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        // Verify that the product belongs to the seller
        const product = await productModel.findByProductId2(update.product_id, null);
        if (!product || product.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Update the content
        await productDescUpdateModel.updateContent(updateId, content.trim());

        res.json({ success: true, message: 'Update saved successfully' });
    } catch (error) {
        console.error('Update description error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete a Description Update
router.delete('/products/description-updates/:updateId', async function (req, res) {
    try {
        const updateId = req.params.updateId;
        const sellerId = req.session.authUser.id;

        // Get the update to verify ownership
        const update = await productDescUpdateModel.findById(updateId);
        if (!update) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        // Verify that the product belongs to the seller
        const product = await productModel.findByProductId2(update.product_id, null);
        if (!product || product.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Delete the update
        await productDescUpdateModel.deleteUpdate(updateId);

        res.json({ success: true, message: 'Update deleted successfully' });
    } catch (error) {
        console.error('Delete description error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;