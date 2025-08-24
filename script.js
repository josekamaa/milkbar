document.addEventListener('DOMContentLoaded', () => {
    const yourBusinessWhatsAppNumber = "254711391662"; // Your business number

    const quantityInputs = document.querySelectorAll('.quantity-input');
    const totalPriceElement = document.getElementById('total-price');
    const payButton = document.getElementById('pay-button');
    const whatsappButton = document.getElementById('whatsapp-button');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');

    const calculateTotal = () => {
        let total = 0;
        quantityInputs.forEach(input => {
            const productItem = input.closest('.product-item');
            const price = parseFloat(productItem.dataset.price);
            const quantity = parseInt(input.value);
            total += price * quantity;
        });
        totalPriceElement.textContent = total;
    };

    quantityInputs.forEach(input => input.addEventListener('input', calculateTotal));

    // --- NEW PAYMENT LOGIC ---
    payButton.addEventListener('click', async () => {
        const total = parseInt(totalPriceElement.textContent, 10);
        const phone = customerPhoneInput.value;
        const name = customerNameInput.value;

        if (total < 1) {
            alert("Please select a quantity to order.");
            return;
        }
        if (!name || !phone.match(/^0[71]\d{8}$/)) { // Basic validation for Kenyan numbers
            alert("Please enter your name and a valid M-Pesa phone number (e.g., 0712345678).");
            return;
        }

        // Show loading state
        payButton.disabled = true;
        payButton.textContent = "Sending Request...";

        try {
            // Call our secure serverless function
            const response = await fetch('/api/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, phone: phone }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Success! A payment prompt has been sent to your phone. Please enter your PIN to complete the payment.");
                payButton.textContent = "Payment Prompt Sent";
                whatsappButton.disabled = false; // Enable the WhatsApp button
            } else {
                throw new Error(data.message || "An unknown error occurred.");
            }
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
            payButton.disabled = false;
            payButton.textContent = "1. Pay with M-Pesa";
        }
    });

    whatsappButton.addEventListener('click', () => {
        // This WhatsApp logic remains the same as before
        const customerName = customerNameInput.value;
        const customerPhone = customerPhoneInput.value;
        const total = totalPriceElement.textContent;

        let orderDetails = `*New Order from Gitwa Farm Milk Point* 🐮\n\n*Customer Name:* ${customerName}\n*Customer Phone:* ${customerPhone}\n\n*Items Ordered:*\n`;

        quantityInputs.forEach(input => {
            const quantity = parseInt(input.value);
            if (quantity > 0) {
                const productItem = input.closest('.product-item');
                const productName = productItem.dataset.name;
                orderDetails += `- ${productName}: *${quantity}*\n`;
            }
        });

        orderDetails += `\n*Total Amount:* KSh ${total}\n\nThis order should be confirmed upon M-Pesa payment receipt.`;

        const encodedMessage = encodeURIComponent(orderDetails);
        const whatsappUrl = `https://wa.me/${yourBusinessWhatsAppNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    });

    calculateTotal();
});
