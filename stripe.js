// stripe.js for stripe payment
import express from 'express';
import Stripe from 'stripe';
// Send email confirmation
import nodemailer from 'nodemailer';

const router = express.Router();
const stripe = new Stripe('sk_test_51QrafBE30HnQRthtroVRfxc22ks0WFWs7W4oUpvcSkt5AgzFZodLs29mDLAXnefxzFOf1Vj44Zfqy3CYWGaaGfqB00LBo1iold');  // Replace this with your actual secret key from the Stripe dashboard

const endpointSecret = "whsec_67f66c26a46c2ca3565ca97cdd83377fa139c233701af3b022357f1d4219879f"; // Replace with your actual webhook secret

// Function to create transporter for sending emails
function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "neovaclean@gmail.com", // Your Gmail address
            pass: "havvgocajaksqqlx", // Your Gmail App Password //fuzxciiiwplbhevc neovaclean
        },
    });
}

// Webhook Route: Handles successful Stripe payment events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {// Pass raw body (Buffer) instead of JSON object
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("⚠️ Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const email = session.customer_email;  // ✅ Use customer_email from session

        if (!email) {
            console.error("❌ No customer email found. Skipping email notification.");
            return res.status(400).send("No email found in payment details.");
        }

        // Create email transporter
        const transporter = createTransporter();

        // Email content
        const mailOptions = {
            from: "neovaclean@gmail.com",
            to: email,
            subject: "Payment Confirmation - NeovaClean",
            text: `Thank you for your purchase! Your order of SGD ${(session.amount_total / 100).toFixed(2)} was successful.\nOrder ID: ${session.id}`,
        };

        // Send email
        try {
            await transporter.sendMail(mailOptions);
            console.log("✅ Email sent to:", email);
        } catch (error) {
            console.error("❌ Error sending email:", error);
        }
    }

    res.json({ received: true });
});


// Payment Route: Creates Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
    let { amount, email } = req.body;

    console.log("🔍 Debug: Received amount in backend:", amount);

    amount = Math.round(Number(amount) * 100);  // Convert to cents

    if (isNaN(amount) || amount <= 0) {
        console.error("❌ Error: Invalid amount received:", amount);
        return res.status(400).json({ error: "Invalid amount" });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],  // ✅ Only allow card payments
            line_items: [{
                price_data: {
                    currency: 'sgd',
                    product_data: { name: 'Furbabies Purchase' },
                    unit_amount: amount, 
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
            customer_email: email,
        });

        console.log("✅ Checkout Session Created:", session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Stripe Checkout Error:", error);
        res.status(500).send('Payment failed.');
    }
});


export default router;