import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import reviewModel from '../models/reviewModel.js'
import nodemailer from 'nodemailer'

// api for adding doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file
        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }
        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        // hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        // creating a doctor
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
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
            to: email,
            subject: `🎉 Welcome Aboard, Dr. ${name}! Your Account is Ready`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">👨‍⚕️ Welcome to Our Platform, Dr. ${name}!</h2>
                    
                    <p>Dear Dr. ${name},</p>
        
                    <p>Your account has been successfully created. You can now access your dashboard and start managing appointments and patient records.</p>
        
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>📧 Email:</strong> ${email}</p>
                        <p><strong>🔑 Temporary Password:</strong>${password} <em>(For security reasons, please reset your password after login)</em></p>
                    </div>
        
                    <p>🔹 Click the button below to log in to your account:</p>
        
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://prescripto-612s.vercel.app/" style="background: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Login to Your Account</a>
                    </div>
        
                    <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        
                    <p>Welcome aboard, and thank you for being a part of our team!</p>
        
                    <p>Best Regards,</p>
                    <p><strong>The Healthcare Team</strong></p>
                    <hr>
                    <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply directly to this email.</p>
                </div>
            `,
        };

        // Sending email
        await transporter.sendMail(mailOptions);


        // saving the doctor
        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: "Doctor Added" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin dashboard
const allDoctors = async (req, res) => {
    try {
        // getting all doctors
        const doctors = await doctorModel.find({}).select("-password")
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        // checking if the email and password are correct
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            // generating a token
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to get all appointments for admin dashboard
const appointmentAdmin = async (req, res) => {
    try {
        // getting all appointments
        const appointments = await appointmentModel.find({});

        // sending the response
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to cancel appointment
const AppointmentCancel = async (req, res) => {
    try {
        // getting the appointment id from the body
        const { appointmentId } = req.body;

        // finding the appointment data
        const appointmentData = await appointmentModel.findById(appointmentId);

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

// api to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        // getting all doctors
        const doctors = await doctorModel.find({});

        // getting all users
        const users = await userModel.find({});

        // getting all appointments
        const appointments = await appointmentModel.find({});

        // creating the dashboard data
        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            users: users.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        // sending the response
        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to remove a doctor
const removeDoctor = async (req, res) => {
    try {
        // getting the doctor id from the body
        const { docId } = req.body;

        // deleting the doctor
        await doctorModel.findByIdAndDelete(docId);
        await appointmentModel.deleteMany({ docId: docId });
        await reviewModel.deleteMany({ doctor: docId });

        // sending the response
        res.json({ success: true, message: "Doctor removed successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


export { addDoctor, loginAdmin, allDoctors, appointmentAdmin, AppointmentCancel, adminDashboard, removeDoctor }