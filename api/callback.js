export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const callbackData = req.body;
    console.log("M-Pesa Callback Data:", JSON.stringify(callbackData, null, 2));

    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const resultDesc = callbackData.Body.stkCallback.ResultDesc;

    if (resultCode === 0) {
      const items = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
      const amount = items.find(i => i.Name === "Amount")?.Value;
      const phone = items.find(i => i.Name === "PhoneNumber")?.Value;

      console.log("✅ Payment Success:", { receipt, amount, phone });
      // TODO: Save into database (orders/payments)
    } else {
      console.log("❌ Payment Failed:", resultDesc);
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback received successfully",
    });
  } catch (error) {
    console.error("Callback Error:", error);
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: "Callback handling failed",
    });
  }
}
