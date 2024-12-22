const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Nodemailer Transporter setup
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chammaroussama@gmail.com',
    pass: 'wqazfhopyjomovii' // Replace with your actual Gmail password or an app password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password, role, avatar } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).send({ success: false, message: 'Name, email, and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: 'Account already exists with this email.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hash,
      role: role || 'user', // Default to 'user' if no role is provided
      avatar
    });

    // Save the new user
    await newUser.save();

    // Send verification email
    const mailOptions = {
      from: '"Verify your email" <chammaroussama@gmail.com>',
      to: newUser.email,
      subject: 'Verify Your Email',
      html: `<h2>Hello ${newUser.name},</h2>
             <p>Thank you for registering on our website!</p>
             <p>Please verify your email by clicking the link below:</p>
             <a href="http://${req.headers.host}/api/users/status/edit?email=${newUser.email}">Click here to verify your email</a>`
    };

    // Send email and handle errors
    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent');
    } catch (emailError) {
      console.log('Error sending email:', emailError);
      return res.status(500).send({ success: false, message: 'Error sending verification email.' });
    }

    return res.status(201).send({ success: true, message: 'Account created successfully. Please check your email to verify.' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Email verification endpoint
router.get('/status/edit', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send({ success: false, message: 'Email is required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Activate the user
    user.isActive = true;
    await user.save();

    return res.status(200).send({ success: true, message: 'Account activated successfully.' });

  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});

// Admin toggle user activation
router.put('/status/edit', async (req, res) => {
  const { idUser } = req.body;

  if (!idUser) {
    return res.status(400).send({ success: false, message: 'User ID is required.' });
  }

  try {
    const user = await User.findById(idUser).select('+isActive');
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Toggle the activation status
    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).send({ success: true, user });

  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});
// Generate token
const generateToken = (user) => {
    return jwt.sign({ user }, process.env.TOKEN, { expiresIn: '60s' });
    };
    // Login
    router.post('/login', async (req, res) => {
    try {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(404).send({ success: false, message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(404).send({ success: false, message: "Account doesn't exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Please verify your credentials' });
        }
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        res.status(200).json({
        success: true,
        token,
        refreshToken,
        user,
        isActive: user.isActive
        });
        } catch (error) {
        res.status(404).json({ message: error.message });
        }
        });
        // Refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ user }, process.env.REFRESH_TOKEN, { expiresIn: '1y' });
    };
    router.post('/refreshToken', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
    return res.status(404).json({ success: false, message: 'Token Not Found' });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
    if (err) {
    return res.status(406).json({ success: false, message: 'Unauthorized Access' });
    }
    const token = generateToken(user);
const newRefreshToken = generateRefreshToken(user);
res.status(200).json({
token,
refreshToken: newRefreshToken
});
});
});

// List all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password
    return res.status(200).json(users);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
