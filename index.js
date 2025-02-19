import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from 'url';
import stripeRouter from "./stripe.js";  // Import the stripe route
import session from "express-session"; // Implement Sessions to Remember Logged-in Users

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL database connection setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "authentication", // Change this if your DB name is different
  password: "WJ0029PHnTB#", // Replace with your actual password
  port: 5432,
});
db.connect();

// Middleware to handle form data and static files

// Stripe Webhook
app.use("/api/payment/webhook", express.raw({ type: "application/json" })); // Webhook requires raw payload

// Apply JSON and form data middleware
app.use(express.json());  // Apply JSON middleware for other routes
app.use(bodyParser.urlencoded({ extended: true })); // For form data (like login, register)

// Middleware for serving static files (CSS, images, front-end JS)
app.use(express.static(path.join(__dirname, 'public'))); // For CSS, images

app.use(express.static(__dirname)); // Serve everything else in the root directory

// Debugging Middleware (log incoming Stripe requests)
app.use("/api/payment", (req, res, next) => {
  console.log("🔥 Debugging Stripe Request:", req.body);
  next();
});

// Session Middleware
app.use(session({
  secret: 'strongPassword',  // Change this to a strong, random string
  resave: false,
  saveUninitialized: true, // Saves new sessions even if not modified.
  cookie: { secure: false } // Change to true if using HTTPS
}));


// Use Stripe Payment Route
app.use("/api/payment", stripeRouter);  // Payment API will be accessible here


// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// GET home page
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

// Products Page
app.get("/product", (req, res) => {
  res.render("product", { user: req.session.user || null });
});

// click_into_item1 
app.get("/click_into_chicken", (req, res) => {
  res.render("click_into_chicken", { user: req.session.user || null });
});

// click_into_item2 
app.get("/click_into_item2", (req, res) => {
  res.render("click_into_item2", { user: req.session.user || null });
});

// click_into_item3 
app.get("/click_into_item3", (req, res) => {
  res.render("click_into_item3", { user: req.session.user || null });
});

// click_into_item4 
app.get("/click_into_item4", (req, res) => {
  res.render("click_into_item4", { user: req.session.user || null });
});

// click_into_item5 
app.get("/click_into_item5", (req, res) => {
  res.render("click_into_item5", { user: req.session.user || null });
});

// click_into_item6
app.get("/click_into_item6", (req, res) => {
  res.render("click_into_item6", { user: req.session.user || null });
});



// logout route (after signing in)
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Logout error:", err);
      }
      res.redirect("/");
  });
});

// Render the login page
app.get("/login", (req, res) => {
  res.render("login", { 
    user: req.session.user || null, 
    successLoginMessage: null, 
    errorLoginMessage: null 
  });
});

// Render the register page
app.get("/register", (req, res) => {
  res.render("register", { 
    user: req.session.user || null, 
    successMessage: null, 
    errorMessage: null 
  });
});


// GET success page
app.get("/success", (req, res) => {
  res.render("success", { user: req.session.user || null });
});

// Handle checkout cancellation
app.get("/cancel", (req, res) => {
  res.render("cart", { user: req.session.user || null }); // Redirects user back to the cart page
});

  
  // Cart Page
  app.get("/cart", (req, res) => {
    res.render("cart", { user: req.session.user || null });
  });

  // Checkout Page
  app.get("/checkout", (req, res) => {
    res.render("checkout", { user: req.session.user || null });
  });

// Handle user registration
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT email FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
        // if email does not exist in db, insert both email and password into db
      await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, password]);
      res.render("register", { successMessage: "You have successfully signed up an account!", errorMessage: null });
    } else {
      res.render("register", { successMessage: null, errorMessage: "Email already exists! Please try again." });
    }
  } catch (err) {
    console.error("Error during registration:", err);
    res.render("register", { successMessage: null, errorMessage: "An error occurred. Please try again later." });
  }
});

// Handle POST request to /login route
app.post("/login", async (req, res) => {
    // Extracting the email and password from the submitted form (req.body)
  const email = req.body.username;
  const password = req.body.password;

  try {
    // Query the database to check if the provided email exists
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    // If no user with the provided email exists
    if (result.rows.length === 0) {
      // If no user with the email is found
      res.render("login", { successLoginMessage: null, errorLoginMessage: "Email is not registered! Please sign up first." });
    } else {
    // If the email exists, retrieve the user data
      const user = result.rows[0];
      // Check if the provided password matches the stored password
      if (user.password === password) {
        // Store user in session after successful login
        req.session.user = {
          id: user.id,
          email: user.email
        };

         // Redirect to home or dashboard
         res.redirect("/");
      } else {
        // If passwords don't match, render the login page with an error message
        res.render("login", { successLoginMessage: null, errorLoginMessage: "Password is incorrect! Please try again." });
      }
    }
  } catch (err) {
    // Catch any unexpected errors during the database query
    console.error("Error during login:", err);
    res.render("login", { successLoginMessage: null, errorLoginMessage: "An error occurred. Please try again later." });
  }

  // Handle checkout form submission
app.post("/api/payment/create-checkout-session", async (req, res) => {
  try {
      const { amount, email } = req.body; // Get the amount and email from the request

      if (!amount || !email) {
          return res.status(400).json({ error: "Amount and email are required." });
      }

      console.log("Processing payment for:", { amount, email });

      // Initialize Stripe (ensure you have `stripe` installed via npm)
      const stripe = require("stripe")("sk_test_YourSecretKey"); // Replace with your actual Stripe Secret Key

      // Create a Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: email,
          line_items: [
              {
                  price_data: {
                      currency: "usd",
                      product_data: { name: "NeovaClean Order" },
                      unit_amount: amount * 100, // Convert dollars to cents
                  },
                  quantity: 1,
              }
          ],
          mode: "payment",
          success_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cart"
      });

      console.log("✅ Stripe Checkout Session Created:", session.id);

      res.json({ id: session.id });
  } catch (err) {
      console.error("Stripe Checkout Error:", err);
      res.status(500).json({ error: "Failed to create Stripe checkout session." });
  }
});


});





// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
