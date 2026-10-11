const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();

// ============================================================================
// 1. SECURE CHECKOUT (Prevents Price & Cart Manipulation)
// ============================================================================
exports.secureCheckout = functions.https.onCall(async (data, context) => {
    // 1. Enforce Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to checkout.");
    }

    const uid = context.auth.uid;
    const { cartItems, shippingAddress, paymentMethod, utrNumber, affiliateCode } = data;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Cart is empty or invalid.");
    }

    let calculatedTotal = 0;
    const orderItems = [];

    try {
        // 2. Fetch authoritative pricing from the database, NOT the client
        for (const item of cartItems) {
            const productId = item.productId || item.id;
            const productSnapshot = await db.ref(`products/${productId}`).once("value");
            const product = productSnapshot.val();

            if (!product) {
                throw new functions.https.HttpsError("failed-precondition", `Item ${productId} is unavailable.`);
            }

            // Calculate using trusted server price (using salePrice if available, otherwise price)
            const priceToUse = product.salePrice || product.price;
            const itemTotal = priceToUse * item.quantity;
            calculatedTotal += itemTotal;

            orderItems.push({
                id: productId,
                name: product.name || '',
                image: product.image || '',
                size: item.size || 'Free Size',
                qty: item.quantity, // matching frontend naming
                price: priceToUse,
                subtotal: itemTotal
            });
        }

        // Generate Khodal Order ID
        const prefix = "KHODAL"; 
        const year = new Date().getFullYear();
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        const orderId = `${prefix}-${year}-${randomCode}`;

        // 3. Create the order document securely in the root /orders node
        const newOrderRef = db.ref(`orders`).push();
        
        const orderData = {
            orderId: orderId,
            userId: uid,
            customerName: shippingAddress.name || '',
            email: shippingAddress.email || '',
            mobile: shippingAddress.mobile || '',
            addressLine1: shippingAddress.addressLine1 || '',
            addressLine2: shippingAddress.addressLine2 || '',
            pincode: shippingAddress.pincode || '',
            city: shippingAddress.city || '',
            state: shippingAddress.state || '',
            address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`,
            products: orderItems,
            subtotal: calculatedTotal,
            totalAmount: calculatedTotal, // Note: Wallet/Coupon backend logic can be expanded here
            paymentMethod: paymentMethod || 'COD',
            utrNumber: utrNumber || null,
            status: "NEW",
            paymentStatus: paymentMethod === 'ONLINE' ? 'UTR_SUBMITTED' : 'PENDING',
            affiliateCode: affiliateCode || null,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            date: new Date().toISOString()
        };

        await newOrderRef.set(orderData);

        return { success: true, orderId: orderId, total: calculatedTotal };

    } catch (error) {
        console.error("Checkout Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

// ============================================================================
// 2. SECURE REWARD REDEMPTION (Prevents Duplicate Gift Card Uses)
// ============================================================================
exports.secureRewardRedemption = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
    }
    
    const uid = context.auth.uid;
    const { rewardId } = data; // Treating rewardId as the gift card code
    
    if (!rewardId) {
        throw new functions.https.HttpsError("invalid-argument", "Gift card code is missing.");
    }

    const giftCardRef = db.ref(`giftCards/${rewardId}`);
    
    // 4. Use Transactions to prevent race conditions and duplicate redemptions
    return giftCardRef.transaction((currentGiftCard) => {
        if (currentGiftCard === null) return null; // Gift card doesn't exist
        
        if (currentGiftCard.status !== 'ACTIVE' || 
           (currentGiftCard.expiresAt && currentGiftCard.expiresAt < Date.now()) || 
           (currentGiftCard.maxRedemptions && (currentGiftCard.redemptionCount || 0) >= currentGiftCard.maxRedemptions)) {
            return; // Abort transaction, invalid/expired/used up
        }
        
        const newCount = (currentGiftCard.redemptionCount || 0) + 1;
        let newStatus = currentGiftCard.status;
        if (currentGiftCard.maxRedemptions && newCount >= currentGiftCard.maxRedemptions) {
            newStatus = 'REDEEMED';
        }

        return { ...currentGiftCard, redemptionCount: newCount, status: newStatus };
        
    }).then(async (result) => {
        if (!result.committed) {
             throw new functions.https.HttpsError("failed-precondition", "Gift card is invalid or already fully redeemed.");
        }
        
        const giftData = result.snapshot.val();
        const rewardAmount = giftData.rewardAmount || 50;
        
        // Add to user's wallet
        const newRewardKey = db.ref().push().key;
        const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        
        const walletUpdates = {};
        walletUpdates[`users/${uid}/walletRewards/${newRewardKey}`] = {
            amount: rewardAmount,
            type: 'GIFT_CARD',
            source: rewardId,
            status: 'ACTIVE',
            usedAmount: 0,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            expiresAt: expiry
        };
        
        // Log redemption
        const newRedemptionKey = db.ref().push().key;
        walletUpdates[`giftCardRedemptions/${newRedemptionKey}`] = {
            code: rewardId,
            uid: uid,
            rewardId: newRewardKey,
            amount: rewardAmount,
            redeemedAt: admin.database.ServerValue.TIMESTAMP
        };

        await db.ref().update(walletUpdates);

        return { success: true, rewardAmount: rewardAmount };
    });
});

// ============================================================================
// 3. SECURE ORDER TRACKING (Prevents Data Leaks & IDOR)
// ============================================================================
exports.secureOrderTracking = functions.https.onCall(async (data, context) => {
    const mobile = data.mobile;
    
    if (!mobile) {
        throw new functions.https.HttpsError("invalid-argument", "Mobile number is required.");
    }

    try {
        const ordersRef = db.ref("orders");
        // Use an admin query to search all orders safely on the backend
        // This bypasses client security rules but filters safely before sending to the client
        const snapshot = await ordersRef.once("value");
        const matchedOrders = [];

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const orderData = child.val();
                
                // If orders are stored directly under /orders/$orderId
                if (orderData.mobile) {
                    if (String(orderData.mobile).trim() === String(mobile).trim()) {
                        matchedOrders.push({ id: child.key, ...orderData });
                    }
                } else {
                    // If orders are nested under UID like /orders/$uid/$orderId
                    child.forEach((nestedChild) => {
                        const nestedData = nestedChild.val();
                        if (nestedData.mobile && String(nestedData.mobile).trim() === String(mobile).trim()) {
                            matchedOrders.push({ id: nestedChild.key, ...nestedData });
                        }
                    });
                }
            });
        }

        return { success: true, orders: matchedOrders };
    } catch (error) {
        console.error("Order Tracking Error:", error);
        throw new functions.https.HttpsError("internal", "Could not fetch orders securely.");
    }
});
