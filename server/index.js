const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const qr = require("qr-image");
const cors = require("cors");

//new addition
//end new addition
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const twilio = require("twilio");

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// User Schema
const medicalQRSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  bloodType: { type: String },
  medicalConditions: { type: String },
  medications: { type: String },
  allergies: { type: String },
  createdAt: { type: Date, default: Date.now },
  UID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  QRID: { type: String, required: true }, // Store QR code as base64 string
});

const User = mongoose.model("UserQR", userSchema);
const MedicalQR = mongoose.model("MedicalQR", medicalQRSchema);

// Get user data with privacy protection
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Mask sensitive information
    const maskedData = {
      name: user.name,
      // phone: user.phone.slice(-2).padStart(user.phone.length, "*"),
      phone:
        user.phone.slice(0, 5) +
        "*".repeat(user.phone.length - 7) +
        user.phone.slice(-2),
      city: user.city,
      // emergencyContact: user.emergencyContact,
      emergencyContact: user.emergencyContact.slice(0, 5) + 
                   "*".repeat(user.emergencyContact.length - 7) + 
                   user.emergencyContact.slice(-2),
      bloodType: user.bloodType,
      medicalConditions: user.medicalConditions,
      medications: user.medications,
      allergies: user.allergies,
    };

    res.json(maskedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// new addition start
// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    }
  );
};

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get user's QR codes (protected route)
app.get("/api/my-qrcodes", authenticateToken, async (req, res) => {
  try {
    const qrCodes = await MedicalQR.find({ UID: req.user.userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      qrCodes,
      count: qrCodes.length,
    });
  } catch (error) {
    console.error("Get QR codes error:", error);
    res.status(500).json({ error: "Failed to fetch QR codes" });
  }
});

// Update QR generation to associate with user
// Update the QR generation endpoint to use qr-image
app.post("/api/generate", authenticateToken, async (req, res) => {
  try {
    const userData = req.body;
    const userId = req.user.userId;

    // Check if vehicle number already exists for this user
    const existingQR = await MedicalQR.findOne({
      vehicleNumber: userData.vehicleNumber,
    });

    if (existingQR) {
      return res.status(400).json({
        error: "Vehicle already has QR code assigned",
      });
    }

    // Generate QR code using qr-image (sync method)
    const qrCode = qr.imageSync(
      JSON.stringify({
        id: userId,
        vehicleNumber: userData.vehicleNumber,
        type: "medical-emergency",
      }),
      { type: "png" }
    );

    // Convert to base64 for response
    const qrCodeBase64 = qrCode.toString("base64");
    const qrDataURL = `data:image/png;base64,${qrCodeBase64}`;

    // Save QR code to database
    const medicalQR = new MedicalQR({
      UID: userId,
      ...userData,
      QRID: qrDataURL, // Store the data URL for easy frontend usage
    });

    await medicalQR.save();

    res.json({
      success: true,
      qrCode: qrDataURL, // Send data URL for direct image display
      qrCodeBase64: qrCodeBase64, // Send raw base64 if needed
      qrId: medicalQR._id,
      vehicleNumber: userData.vehicleNumber,
      message: "QR code generated successfully",
      consoleLog: "QR code generated and saved",
      downloadUrl: qrDataURL, // For download functionality
    });
  } catch (error) {
    console.error("QR Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate QR code",
      details: error.message,
    });
  }
});

// Update the existing QR code retrieval endpoint
app.get("/api/existing-qr/:userId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate QR code with existing user data using qr-image
    const qrCode = qr.imageSync(
      JSON.stringify({
        id: user._id.toString(),
        vehicleNumber: user.vehicleNumber,
        type: "medical-emergency",
      }),
      { type: "png" }
    );

    const qrCodeBase64 = qrCode.toString("base64");
    const qrDataURL = `data:image/png;base64,${qrCodeBase64}`;

    res.json({
      success: true,
      qrCode: qrDataURL,
      user: {
        id: user._id,
        name: user.name,
        vehicleNumber: user.vehicleNumber,
      },
      message: "Existing QR code retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the vehicle check endpoint to also return QR code if exists
app.get("/api/check-vehicle/:vehicleNumber", async (req, res) => {
  try {
    const user = await MedicalQR.findOne({
      vehicleNumber: req.params.vehicleNumber,
    });

    if (user) {
      // Generate QR code for existing user
      const qrCode = qr.imageSync(
        JSON.stringify({
          id: user._id.toString(),
          vehicleNumber: user.vehicleNumber,
          type: "medical-emergency",
        }),
        { type: "png" }
      );

      const qrCodeBase64 = qrCode.toString("base64");
      const qrDataURL = `data:image/png;base64,${qrCodeBase64}`;

      res.json({
        exists: true,
        user: {
          id: user._id,
          name: user.name,
          vehicleNumber: user.vehicleNumber,
        },
        qrCode: qrDataURL, // Include QR code in response
        message: "Vehicle number already registered",
      });
    } else {
      res.json({
        exists: false,
        message: "Vehicle number available",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//new addition end

// Search user by vehicle number
app.get("/api/vehicle/:vehicleNumber", async (req, res) => {
  try {
    const user = await MedicalQR.findOne({
      vehicleNumber: req.params.vehicleNumber,
    });
    if (!user) return res.status(404).json({ error: "Vehicle not found" });

    const maskedData = {
      name: user.name,
      phone:
        user.phone.slice(0, 5) +
        "*".repeat(user.phone.length - 7) +
        user.phone.slice(-2),
      city: user.city,
      vehicleNumber: user.vehicleNumber, // Include vehicle number in response
      emergencyContact:
        user.emergencyContact.slice(0, 5) +
        "*".repeat(user.emergencyContact.length - 7) +
        user.emergencyContact.slice(-2),
      bloodType: user.bloodType || "Not specified",
      medicalConditions: user.medicalConditions || "None reported",
      medications: user.medications || "None reported",
      allergies: user.allergies || "None reported",
    };

    res.json(maskedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete QR code
app.delete("/api/qrcode/:id", authenticateToken, async (req, res) => {
  try {
    const qrCode = await MedicalQR.findOne({
      _id: req.params.id,
    });

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    await MedicalQR.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "QR code deleted successfully",
    });
  } catch (error) {
    console.error("Delete QR error:", error);
    res.status(500).json({ error: "Failed to delete QR code" });
  }
});

// Emergency message endpoint
app.post(
  "/api/emergency-message/:vehicleNumber",
  authenticateToken,
  async (req, res) => {
    try {
      console.log(
        "Initiating emergency message for vehicle:",
        req.params.vehicleNumber
      );

      // Get scanner user details (from auth token)
      const scannerUser = await User.findById(req.user.userId);
      if (!scannerUser) {
        return res.status(404).json({
          success: false,
          error: "Scanner user not found",
        });
      }

      // Find the vehicle data
      const medicalQR = await MedicalQR.findOne({
        vehicleNumber: req.params.vehicleNumber,
      });

      console.log("Medical QRRrr data found:", medicalQR);
      if (!medicalQR) {
        return res.status(404).json({
          success: false,
          error: "Vehicle not found",
        });
      }

      // Validate emergency contact number
      if (!medicalQR.emergencyContact) {
        return res.status(400).json({
          success: false,
          error: "Emergency contact number not available",
        });
      }

      // Clean the phone number
      const toNumber = medicalQR.emergencyContact.replace(/\D/g, "");

      // Add country code if missing (adjust for your country)
      const formattedNumber = toNumber.startsWith("+")
        ? toNumber
        : `+91${toNumber}`;

      console.log("Sending emergency message to:", formattedNumber);

      // Create emergency message
      const emergencyMessage = `EMERGENCY: ${medicalQR.name} needs help. Scanner: ${scannerUser.name} (${scannerUser.phone}). Vehicle: ${medicalQR.vehicleNumber}.`;

      // Send SMS using Twilio
      const message = await twilioClient.messages.create({
        body: emergencyMessage,
        to: formattedNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log("Emergency message sent:", message.sid);

      // Log the emergency message for records
      console.log("Emergency Message Log:", {
        timestamp: new Date().toISOString(),
        vehicleNumber: medicalQR.vehicleNumber,
        patientName: medicalQR.name,
        emergencyContact: formattedNumber,
        scannerName: scannerUser.name,
        scannerPhone: scannerUser.phone,
        messageSid: message.sid,
        status: message.status,
      });

      res.json({
        success: true,
        message: "Emergency message sent successfully",
        messageSid: message.sid,
        status: message.status,
        sentTo: "Emergency contact", // Don't reveal actual number
        scannerInfo: {
          name: scannerUser.name,
          phone: scannerUser.phone,
        },
      });
    } catch (error) {
      console.error("Emergency message error:", error);

      // Specific error handling
      if (error.code === 21211) {
        return res.status(400).json({
          success: false,
          error: "Invalid emergency contact number format",
        });
      } else if (error.code === 21608) {
        return res.status(400).json({
          success: false,
          error: "Trial account - number not verified in Twilio",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to send emergency message",
        details: error.message,
      });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
