import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import appointmentModel from "../models/appointmentModel.js";
import nodemailer from "nodemailer";
import reviewModel from "../models/reviewModel.js";

// api to register a user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validating all fields are provided
        if (!name || !email || !password) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // validating a email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email" });
        }

        // validating a strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // creating a user
        const userData = { name, email, password: hashedPassword }
        const newUser = new userModel(userData);

        // saving the user
        const user = await newUser.save();

        // generating a token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // sending email to the user
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "🎉 Welcome to Prescripto - Your Healthcare Companion!",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">Welcome to Prescripto! 🚀</h2>
                    <p>Dear ${name},</p>
                    <p>We’re thrilled to have you on board! 🎉 Your account has been successfully created, and you are now part of the Prescripto family.</p>
                    
                    <h3 style="color: #5f6FFF;">What’s Next?</h3>
                    <ul style="list-style-type: none; padding-left: 20px;">
                        <li>🔹 Explore our platform and discover seamless healthcare solutions.</li>
                        <li>🔹 Book appointments with your favorite doctors.</li>
                    </ul>
        
                    <p>Ready to get started? Click the button below to log in:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://prescripto-one-theta.vercel.app/login" style="background: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Log In Now</a>
                    </div>
        
                    <p>If you have any questions, feel free to reach out to our support team.</p>
        
                    <p>Wishing you a healthy journey ahead! 😊</p>
                    
                    <p>Best Regards,</p>
                     <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                    <p><strong>The Prescripto Team</strong></p>
                    <hr>
                    <p style="font-size: 12px; color: gray;">If you did not sign up for Prescripto, please ignore this email or contact our support.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        // sending the response
        res.json({ success: true, token });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to login a user
const loginUser = async (req, res) => {
    try {
        // getting the email and password from the body
        const { email, password } = req.body;

        // finding the user
        const user = await userModel.findOne({ email });

        // checking if the user is found
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // checking if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // checking if the password is valid
        if (isPasswordValid) {

            // generating a token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

            // sending the response
            res.json({ success: true, token });
        } else {
            // sending the response
            res.json({ success: false, message: "Invalid credentials" });
        }

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to get the user details
const getProfile = async (req, res) => {
    try {
        // getting the user id from the body
        const { userId } = req.body;

        // finding the user
        const userData = await userModel.findById(userId).select("-password");

        // sending the response
        res.json({ success: true, userData });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to update the user details
const updateProfile = async (req, res) => {
    try {
        // getting the user id from the body
        const { userId, name, address, gender, dob, phone } = req.body;

        // getting the image file from the body
        const imageFile = req.file;

        // checking if there are any changes to update
        if (!name || !gender || !dob || !phone || !address) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // updating the user details
        await userModel.findByIdAndUpdate(userId, { name, address: JSON.parse(address), gender, dob, phone });

        // checking if the image file is provided
        if (imageFile) {
            // uploading image to cloudinary
            const image = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            // getting the image url
            const imageUrl = image.secure_url;
            // updating the user image
            await userModel.findByIdAndUpdate(userId, { image: imageUrl });
        }

        // sending the response
        res.json({ success: true, message: "Profile updated successfully" });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to book the appointments
const bookAppointment = async (req, res) => {
    try {
        // getting the user id from the body
        const { userId, docId, slotDate, slotTime } = req.body;

        // finding the doctor data
        const docData = await doctorModel.findById(docId).select("-password");

        // checking if the doctor is available
        if (!docData.available) {
            return res.json({ success: false, message: "Doctor is not available at this time" });
        }

        // getting the slots booked
        let slotsBooked = docData.slots_booked;

        // checking if the slot is available
        if (slotsBooked[slotDate]) {
            // checking if the slot is already booked
            if (slotsBooked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot is already booked" });
            } else {
                // adding the slot to the slots booked
                slotsBooked[slotDate].push(slotTime);
            }
        } else {
            // creating a new slot
            slotsBooked[slotDate] = [];
            slotsBooked[slotDate].push(slotTime);
        }

        // getting the user data
        const userData = await userModel.findById(userId).select("-password");
        // removing the slots booked from the doctor data
        delete docData.slots_booked;

        // creating the appointment data
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotDate,
            slotTime,
            date: Date.now(),
        }

        // creating the appointment
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // updating the slots booked
        await doctorModel.findByIdAndUpdate(docId, { slots_booked: slotsBooked });
        
        // Setting up the email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        // Mail options
        const mailOptions = {
            from: process.env.EMAIL,
            to: appointmentData.userData.email,
            subject: `🩺 Appointment Confirmed - ${appointmentData.docData.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">✅ Appointment Confirmed!</h2>
                    <p>Dear <strong>${appointmentData.userData.name}</strong>,</p>
                    <p>We are pleased to inform you that your appointment has been successfully confirmed. Below are your appointment details:</p>
        
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>📌 Appointment ID:</strong> ${appointmentData._id}</p>
                        <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${appointmentData.docData.name}</p>
                        <p><strong>📅 Date:</strong> ${appointmentData.slotDate}</p>
                        <p><strong>⏰ Time:</strong> ${appointmentData.slotTime}</p>
                    </div>
        
                    <p>Thank you for choosing our services. We look forward to assisting you.</p>
        
                    <p>Best Regards,</p>
                    <p><strong>The Prescripto Team</strong></p>
                    <hr>
                    <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                    <br>
                    <p style="font-size: 12px; color: gray;">If you did not make this appointment, please contact our support immediately.</p>
                </div>
            `,
        };

        // Sending email
        await transporter.sendMail(mailOptions);


        // sending the response
        res.json({ success: true, message: "Appointment booked successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to get the user appointments
const listAppointment = async (req, res) => {
    try {
        // getting the user id from the body
        const { userId } = req.body;

        // finding the user appointments
        const appointments = await appointmentModel.find({ userId });

        // sending the response
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to cancel the appointment
const cancelAppointment = async (req, res) => {
    try {
        // getting the appointment id from the body
        const { userId, appointmentId } = req.body;

        // finding the appointment data
        const appointmentData = await appointmentModel.findById(appointmentId);

        // checking if the user is the owner of the appointment
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        // deleting the appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // getting the doctor id and the slot date and time from the appointment data
        const { docId, slotDate, slotTime } = appointmentData;

        // getting the doctor data
        const doctorData = await doctorModel.findById(docId);

        // getting the slots booked
        let slotsBooked = doctorData.slots_booked;

        // removing the slot from the slots booked
        slotsBooked[slotDate] = slotsBooked[slotDate].filter(e => e !== slotTime);

        // updating the doctor data
        await doctorModel.findByIdAndUpdate(docId, { slots_booked: slotsBooked });

        // sending the response
        res.json({ success: true, message: "Appointment cancelled successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to make payment of an appointment using razorpay
const makePayment = async (req, res) => {
    try {
        // getting the appointment id from the body
        const { appointmentId } = req.body;

        // finding the appointment data
        const appointmentData = await appointmentModel.findById(appointmentId);

        // checking if the appointment is found and not cancelled
        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment not found or cancelled" });
        }

        // updating the payment status
        await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

        // Setting up the email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        // Mail options
        const mailOptions = {
            from: process.env.EMAIL,
            to: appointmentData.userData.email,
            subject: `🩺 Appointment Payment Confirmed - ${appointmentData.docData.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">✅ Payment Successful!</h2>
                    <p>Dear <strong>${appointmentData.userData.name}</strong>,</p>
                    <p>We are pleased to inform you that your appointment payment has been successfully processed. Below are your appointment details:</p>
        
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>📌 Appointment ID:</strong> ${appointmentData._id}</p>
                        <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${appointmentData.docData.name}</p>
                        <p><strong>📅 Date:</strong> ${appointmentData.slotDate}</p>
                        <p><strong>⏰ Time:</strong> ${appointmentData.slotTime}</p>
                        <p><strong>💳 Amount Paid:</strong> $${appointmentData.amount}</p>
                    </div>
        
                    <p>Thank you for choosing our services. We look forward to assisting you.</p>
        
                    <p>Best Regards,</p>
                    <p><strong>The Prescripto Team</strong></p>
                    <hr>
                    <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                    <br>
                    <p style="font-size: 12px; color: gray;">If you did not make this appointment, please contact our support immediately.</p>
                </div>
            `,
        };

        // Sending email
        await transporter.sendMail(mailOptions);

        // sending the response
        res.json({ success: true, message: "Payment successful" });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to contact us
const contactUs = async (req, res) => {
    try {
        // Extracting user details from the request body
        const { name, email, message } = req.body;

        // Check if all fields are provided
        if (!name || !email || !message) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // Check if EMAIL and PASSWORD are configured
        if (!process.env.EMAIL || !process.env.PASSWORD) {
            return res.json({ success: false, message: "Email configuration missing" });
        }

        // Setting up the email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        // Mail options
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.TOEMAIL,
            subject: `📩 New Inquiry from ${name} via Website`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">🌟 New Contact Form Submission</h2>
                    
                    <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                    
                    <p><strong>Message:</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p>${message}</p>
                    </div>
        
                    <p>📌 <strong>Respond as soon as possible to ensure great user engagement!</strong></p>
        
                    <hr>
                    <p style="font-size: 12px; color: gray;">This email was automatically generated from your website contact form.</p>
                </div>
            `,
        };


        // Sending email
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error.message);
        res.json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// api to add a review
const addReview = async (req, res) => {
    try {
        const { userId, doctorId, rating, comment, appointmentId } = req.body;

        // check if appointment is found and not cancelled
        const appointment = await appointmentModel.findOne({
            _id: appointmentId,
            userId: userId,
            isCompleted: true
        });

        if (!appointment || appointment.cancelled) {
            return res.json({ success: false, message: "Appointment not found or cancelled" });
        }

        // Check if all required fields are provided
        if (!userId || !doctorId || !rating || !comment || !appointmentId) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        const existingReview = await reviewModel.findOne({ appointment: appointmentId });
        if (existingReview) {
            return res.json({
                success: false,
                message: "Review already exists for this appointment"
            });
        }

        // Create new review
        const review = new reviewModel({
            user: userId,
            doctor: doctorId,
            appointment: appointmentId,
            rating,
            comment
        });

        // Save review
        await review.save();

        res.json({ success: true, message: "Review added successfully" });
    } catch (error) {
        console.error("Error adding review:", error.message);
        res.json({ success: false, message: "Failed to add review" });
    }
};

// api to get the reviewed appointments
const getReviewedAppointments = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find all reviews by this user
        const reviews = await reviewModel.find({ user: userId });

        // Extract appointment IDs from the reviews
        const reviewedAppointmentIds = reviews.map(review => review.appointment.toString());

        res.json({
            success: true,
            reviewedAppointmentIds
        });
    } catch (error) {
        console.error("Error fetching reviewed appointments:", error.message);
        res.json({ success: false, message: "Failed to fetch reviewed appointments" });
    }
};

// api to get all the reviews
const getAllReviews = async (req, res) => {
    try {
        const { doctorId } = req.query;

        // Create query object
        const query = {};
        if (doctorId) {
            query.doctor = doctorId;
        }

        // Fetch reviews with optional doctor filter
        const reviews = await reviewModel.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'name image')
            .populate('doctor', 'name speciality image');

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Error fetching reviews:", error.message);
        res.json({ success: false, message: "Failed to fetch reviews" });
    }
};

// api to send a reset password email
const sendResetPasswordEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // check if email is provided
        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // generate a 4 digit otp
        const otp = Math.floor(1000 + Math.random() * 9000);

        // sending the otp to the user's email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "🔐 OTP for Password Reset",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">🔑 Password Reset Request</h2>
                    
                    <p>Dear User,</p>
                    
                    <p>We received a request to reset your password. Use the OTP below to proceed. This OTP will expire in <strong>10 minutes</strong>.</p>
        
                    <div style="text-align: center; font-size: 20px; font-weight: bold; background: #f9f9f9; padding: 10px; border-radius: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
        
                    <p><strong>⚠️ Do not share this OTP with anyone for security reasons.</strong></p>
        
                    <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
        
                    <hr>
                    <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                </div>
            `,
        };


        await transporter.sendMail(mailOptions);

        // saving the otp to the user
        user.verifyOTP = otp;
        // setting the otp expiry to 10 minutes
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        // sending the response
        res.json({ success: true, message: "OTP sent to the email" });
    } catch (error) {
        console.error("Error sending reset password email:", error.message);
        res.json({ success: false, message: "Failed to send reset password email" });
    }
};

// api to verify the otp
const verifyOTP = async (req, res) => {
    try {
        const { otp, email } = req.body;

        // check if otp is provided
        if (!otp) {
            return res.json({ success: false, message: "OTP is required" });
        }

        // check if otp is correct
        const user = await userModel.findOne({ email: email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // check if otp is expired
        if (user.otpExpiry < Date.now()) {
            return res.json({ success: false, message: "OTP expired" });
        }

        // check if otp is correct
        if (user.verifyOTP != otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // sending the response

        // deleting the otp from the user
        user.verifyOTP = "";
        user.otpExpiry = null;
        await user.save();

        res.json({ success: true, message: "OTP verified successfully" });

    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.json({ success: false, message: "Failed to verify OTP" });
    }
}

// api to reset the password
const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check if email is provided
        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // check if user exists
        const user = await userModel.findOne({ email });

        // check if user exists
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // update the password
        user.password = hashedPassword;
        await user.save();

        // sending the response 
        res.json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error.message);
        res.json({ success: false, message: "Failed to reset password" });
    }
}

// api to change the password
const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        // check if current password is provided
        if (!currentPassword) {
            return res.json({ success: false, message: "Current password is required" });
        }

        // check if new password is provided
        if (!newPassword) {
            return res.json({ success: false, message: "New password is required" });
        }

        // check if user exists
        const user = await userModel.findById(userId);

        // check if user exists
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // check if current password is correct
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

        // check if current password is correct
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }

        // check if new password is the same as the current password
        if (newPassword === currentPassword) {
            return res.json({ success: false, message: "New password cannot be the same as the current password" });
        }

        // hashing the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // update the password
        user.password = hashedPassword;
        await user.save();

        // email the user
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "🔐 Your Password Has Been Changed",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">🔑 Password Change Confirmation</h2>
                    
                    <p>Dear ${user.name},</p>
                    
                    <p>We wanted to inform you that your password has been successfully changed.</p>
        
                    <p>If you did not request this change, please <strong>contact our support team immediately</strong> to secure your account.</p>
        
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://prescripto-one-theta.vercel.app/login" style="background: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Login to Your Account</a>
                    </div>
        
                    <p>For added security, we recommend updating your password regularly.</p>
        
                    <p>Best Regards,</p>
                    <p><strong>Your Support Team</strong></p>
        
                    <hr>
                    <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        // sending the response
        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error.message);
        res.json({ success: false, message: "Failed to change password" });
    }
}

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, makePayment, contactUs, addReview, getReviewedAppointments, getAllReviews, sendResetPasswordEmail, verifyOTP, resetPassword, changePassword };
