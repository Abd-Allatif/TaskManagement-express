const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../services/emailService");

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          message: "Please Provide all Required Fields (Name, Email, Password)",
        });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User Email Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const verfificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 15 Minutes from now

    await prisma.verificationCode.create({
      data: {
        token: verfificationCode,
        expiresAt,
        userId: newUser.id,
      },
    });

    await sendVerificationEmail(email, verfificationCode);

    return res
      .status(201)
      .json({
        message:
          "Registration Successfull Please Check You Email for Verification Code",
        userId: newUser.id,
      });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and Verification Code are Required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { verificationCode: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({
          message: "User Not Found Please Check Your Email, or Register First",
        });
    }

    if (user.emailVerifiedAt) {
      return res.status(400).json({ message: "Email Already Verified" });
    }

    const isValidToken = user.verificationCode.find(
      (t) => t.token === code && t.expiresAt > new Date(),
    );

    if (!isValidToken) {
      return res
        .status(400)
        .json({ message: "Invalid or Expired Verification Code" });
    }

    // Update user's verification timestamp and drop/delete the token safely via transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { id: isValidToken.id },
      }),
    ]);

    return res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email Verification Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 3. LOGIN (With Verification Gating & JWT Issuance)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Block login if email is not verified
    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        error: "Email not verified.",
        message: "Please verify your email address before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // CREATE AND ASSIGN JWT TOKEN HERE
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token, // Return token to client so they can use it with your verifyToken middleware
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
};

// 4. LOGOUT
const logout = async (req, res) => {
  try {
    // Since JWTs are stateless on the server, client-side removal handles log out.
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error during logout." });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
};