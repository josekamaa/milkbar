// We need 'axios' to make API requests. Vercel will install it automatically.
const axios = require('axios');

// This is the main function Vercel will run
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // --- Step 1: Get M-Pesa Access Token ---
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    let accessToken;
    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        accessToken = response.data.access_token;
    } catch (err) {
        console.error("Token Error:", err.response ? err.response.data : err.message);
        return res.status(500).json({ message: "Failed to get access token." });
    }

    // --- Step 2: Initiate STK Push ---
    const { amount, phone } = req.body;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    // Format the phone number to 254...
    const formattedPhone = phone.startsWith('0') ? '254' + phone.substring(1) : phone;

    try {
        const stkResponse = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // or "CustomerBuyGoodsOnline" for Till
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: `https://milkbar-ten.vercel.app/api/callback`, // IMPORTANT - See note below
            AccountReference: "Gitwa Farm Milk",
            TransactionDesc: "Payment for milk products"
        }, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // Send a success response back to the website
        return res.status(200).json(stkResponse.data);

    } catch (err) {
        console.error("STK Push Error:", err.response ? err.response.data : err.message);
        return res.status(500).json({ message: "Failed to initiate STK Push.", error: err.response ? err.response.data : err.message });
    }
}


