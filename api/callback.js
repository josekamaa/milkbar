// api/callback.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body; // should already be JSON
    console.log("✅ M-Pesa Callback:", body);

    // TODO: You could save this to a DB later (for now just log)
    
    res.status(200).json({ message: "Callback received successfully" });
  } catch (err) {
    console.error("❌ Error handling callback:", err);
    res.status(500).json({ error: "Server error" });
  }
}
