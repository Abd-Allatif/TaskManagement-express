const bycrypt = require('bycrypt');
const prisma = require('../prismaClient');
const {sendVerificationEmail} = require('../utils/emailService');

// Register
const register = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({message: "Please Provide all Required Fields (Name, Email, Password)"});
        }

        const existingUser = await prisma.user.findUnique({where : {email}});

        if(existingUser){
            return res.status(400).json({message: "User Email Already Exists"});
        }

        const hashedPassword = await bycrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {name, email, password: hashedPassword}
        });

        const verfificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 15 Minutes from now

        await prisma.verificationCode.create(
            {
                data: {
                    token: verfificationCode,
                    expiresAt,
                    userId: newUser.id,
                }
            }
        );

        await sendVerificationEmail(email, verfificationCode);

        return res.status(201).json({message: "Registration Successfull Please Check You Email for Verification Code", userId: newUser.id});

    }catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

// Verify Email
