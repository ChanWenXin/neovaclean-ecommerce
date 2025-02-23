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
            pass: "xxnzysmtobeawlmq", // Your Gmail App Password //fuzxciiiwplbhevc neovaclean havvgocajaksqqlx test 
        },
    });
}

// Webhook Route: Handles successful Stripe payment events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {

    console.log("🔔 Webhook Received! Raw body:", req.body.toString());

    const sig = req.headers["stripe-signature"];
    let event;

    try {// Pass raw body (Buffer) instead of JSON object
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("🔔 Webhook Event Received:", event.type);  // ✅ Add this debug line

    } catch (err) {
        console.error("⚠️ Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("🛒 Checkout Session Data:", session);

        const email = session.customer_email || session.customer_details?.email;  // ✅ FIX: Fetch email from `customer_email` OR `customer_details.email`

        console.log("📧 Sending confirmation email to:", email);

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
            let info = await transporter.sendMail(mailOptions);
            console.log("✅ Email sent successfully:", info.response);
        } catch (error) {
            console.error("❌ Error sending email:", error);
        }
        
    }

    res.json({ received: true });
});


/*async function testEmail() {
    const transporter = createTransporter();
    const testMailOptions = {
        from: "neovaclean@gmail.com",
        to: "wenxin32@hotmail.com",
        subject: "Test Email from Webhook",
        text: "This is a test email from your Stripe webhook.",
    };

    try {
        let info = await transporter.sendMail(testMailOptions);
        console.log("✅ Test Email sent:", info.response);
    } catch (error) {
        console.error("❌ Test Email failed:", error);
    }
}

testEmail();
*/

// Payment Route: Creates Stripe checkout session
router.post("/create-checkout-session", async (req, res) => {
    console.log("🔥 Debugging Stripe Request:", req.body); // Debugging log

    const { email, products } = req.body;

    if (!email || !products || products.length === 0) {
        return res.status(400).json({ error: "Invalid request. Email or products missing." });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: email,
            line_items: products.map(product => ({
                price_data: {
                    currency: "sgd",
                    product_data: { name: product.name },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: product.quantity,
            })),
            mode: "payment",
            success_url: "http://172.188.206.40/success",
            cancel_url: "http://172.188.206.40/cancel",
        });

        console.log("✅ Stripe Checkout Session Created:", session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Stripe Checkout Error:", error);
        res.status(500).json({ error: "Payment failed." });
    }
});


export default router;
