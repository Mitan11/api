import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import appointmentModel from "../models/appointmentModel.js";
import reviewModel from "../models/reviewModel.js";
import nodemailer from "nodemailer";

// api to change the availability of a doctor
const changeAvailability = async (req, res) => {
    try {
        // getting the doctor id
        const { docId } = req.body;

        // finding the doctor
        const docData = await doctorModel.findById(docId);

        // updating the availability
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });

        res.json({
            success: true,
            message: "Availability changed successfully"
        })

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

// api to get all doctors
const doctorList = async (req, res) => {
    try {
        // getting all doctors
        const doctors = await doctorModel.find({}).select(["-password", "-email"]);
        res.json({
            success: true,
            doctors
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

// api for doctor login
const loginDoctor = async (req, res) => {
    try {
        // getting the email and password from the request body
        const { email, password } = req.body;

        // finding the doctor
        const doctor = await doctorModel.findOne({ email });

        // checking if the doctor exists
        if (!doctor) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        // checking if the password is correct
        const isMatch = await bcrypt.compare(password, doctor.password);

        // if the password is correct
        if (isMatch) {
            // generating the token for the doctor
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
            // sending the response
            res.json({ success: true, message: "Logged in successfully", token })
        } else {
            // if the password is incorrect
            return res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to get the doctor appointment for each doctor
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body

        // getting the appointments
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to mark the appointment is completed
const appointmentCompleted = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        // finding the appointment
        const appointmentData = await appointmentModel.findById(appointmentId)

        // checking if the appointment is completed
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: "Appointment completed successfully" })
        } else {
            return res.json({ success: false, message: "marking appointment as completed failed" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to mark the appointment is cancelled
const appointmentCancelled = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        // finding the appointment
        const appointmentData = await appointmentModel.findById(appointmentId)

        // checking if the appointment is completed
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: "Appointment cancelled successfully" })
        } else {
            return res.json({ success: false, message: "marking appointment as cancelled failed" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to get dashboard data
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body

        // getting the appointments
        const appointments = await appointmentModel.find({ docId })

        // getting the rating
        const doctorData = await doctorModel.findById(docId).select("averageRating ratingCount")

        // calculating the earnings
        let earnings = 0
        appointments.map(item => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        // calculating the total patients
        let patients = []
        appointments.map(item => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        // calculating the rating
        const totalRating = doctorData.averageRating * doctorData.ratingCount

        const dashData = {
            earnings,
            patients: patients.length,
            appointments: appointments.length,
            latestAppointments: appointments.reverse().slice(0, 5),
            rating: totalRating / doctorData.ratingCount
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to get the doctor profile
const doctorProfile = async (req, res) => {
    try {
        // getting the doctor id
        const { docId } = req.body

        // getting the doctor profile
        const profileData = await doctorModel.findById(docId).select("-password")

        res.json({ success: true, profileData })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//  api to update the doctor profile
const updateDoctorProfile = async (req, res) => {
    try {
        // getting the doctor id
        const { docId, fees, address, available } = req.body
        console.log(docId, fees, address, available);
        // updating the doctor profile
        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: "Profile updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to get the doctor reviews
const doctorReviews = async (req, res) => {
    try {
        const { docId } = req.body

        // getting the reviews
        const reviews = await reviewModel.find({ doctor: docId }).populate("user").populate("doctor")

        // sending the response
        res.json({ success: true, reviews })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to delete the doctor review
const deleteDoctorReview = async (req, res) => {
    try {
        const { reviewId } = req.body

        // deleting the review
        await reviewModel.findByIdAndDelete(reviewId)

        res.json({ success: true, message: "Review deleted successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// api to change the password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const docId = req.body.docId; // Get docId from the body

        // check if current password is provided
        if (!currentPassword) {
            return res.json({ success: false, message: "Current password is required" });
        }

        // check if new password is provided
        if (!newPassword) {
            return res.json({ success: false, message: "New password is required" });
        }

        // check if user exists
        const doctor = await doctorModel.findById(docId);

        // check if user exists
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // check if current password is correct
        const isPasswordCorrect = await bcrypt.compare(currentPassword, doctor.password);

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
        doctor.password = hashedPassword;
        await doctor.save();

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
            to: doctor.email,
            subject: "🔐 Your Password Has Been Changed",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #5f6FFF; text-align: center;">🔑 Password Change Confirmation</h2>
                    
                    <p>Dear ${doctor.name},</p>
                    
                    <p>We wanted to inform you that your password has been successfully changed.</p>
        
                    <p>If you did not request this change, please <strong>contact our support team immediately</strong> to secure your account.</p>
        
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://prescripto-612s.vercel.app/" style="background: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Login to Your Account</a>
                    </div>
        
                    <p>For added security, we recommend updating your password regularly and enabling two-factor authentication if available.</p>
        
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

export { changeAvailability, doctorList, loginDoctor, appointmentsDoctor, appointmentCompleted, appointmentCancelled, doctorDashboard, doctorProfile, updateDoctorProfile, doctorReviews, deleteDoctorReview, changePassword };
