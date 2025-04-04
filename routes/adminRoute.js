import express from "express";
import { addDoctor, allDoctors, appointmentAdmin, loginAdmin, AppointmentCancel, adminDashboard, removeDoctor } from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

// admin router
const adminRouter = express.Router();

// adding a doctor with image upload route
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)

// login admin route
adminRouter.post('/login', loginAdmin)

// getting all doctors
adminRouter.post('/all-doctors', authAdmin, allDoctors)

// changing the availability of a doctor
adminRouter.post('/change-availability', authAdmin, changeAvailability)

// getting all appointments for admin dashboard
adminRouter.get('/all-appointments', authAdmin, appointmentAdmin)

// cancelling an appointment
adminRouter.post('/cancel-appointment', authAdmin, AppointmentCancel)

// getting dashboard data
adminRouter.get('/dashboard', authAdmin, adminDashboard)

// remove doctor 
adminRouter.post('/remove-doctor', authAdmin, removeDoctor)

export default adminRouter;