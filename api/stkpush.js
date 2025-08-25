// api/stkpush.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, amount } = req.body;

  // --- START: DATA VALIDATION & FORMATTING ---

  // FIX 1: Format the phone number to 254...
  let formattedPhone = phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.slice(1);
  }
  
  if (!/^(254)\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({ error: "Invalid phone number format. Must be 254..." });
  }

  // FIX 2: Round the amount to the nearest whole number (integer)
  const roundedAmount = Math.round(amount);
  
  if (roundedAmount < 1) {
      return res.status(400).json({ error: "Amount must be at least 1 KSH." });
  }

  // --- END: DATA VALIDATION & FORMATTING ---


  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  try {
    // 1. Generate token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const accessToken = tokenResponse.data.access_token;

    // 2. Format timestamp + password
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    // 3. STK push request
    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: roundedAmount,         // Use the formatted amount
        PartyA: formattedPhone,        // Use the formatted phone number
        PartyB: shortcode,
        PhoneNumber: formattedPhone,   // Use the formatted phone number
        CallBackURL: callbackUrl,
        AccountReference: "Gitwa Farm Milk",
        TransactionDesc: "Milk Purchase",
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.status(200).json(stkResponse.data);

  } catch (error) {
    // FIX 3: Improved error feedback
    // Send the actual error message from Safaricom back to the frontend
    console.error("M-Pesa API Error:", error.response?.data || error.message);
    res.status(500).json({ 
        error: "Payment request failed", 
        details: error.response?.data || { message: error.message }
    });
  }
}
