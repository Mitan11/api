import express from "express";
import { doctorList, loginDoctor, appointmentsDoctor, appointmentCompleted, appointmentCancelled, doctorDashboard, doctorProfile, updateDoctorProfile, doctorReviews, deleteDoctorReview, changePassword } from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";
// doctor router
const doctorRouter = express.Router();

// doctor login route
doctorRouter.post("/login", loginDoctor);

// getting all doctors route
doctorRouter.get("/list", doctorList);

// getting the doctor appointment route
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);

// api to mark the appointment is completed
doctorRouter.post("/appointment-completed", authDoctor, appointmentCompleted);

// api to mark the appointment is cancelled
doctorRouter.post("/appointment-cancelled", authDoctor, appointmentCancelled);

// api to get the doctor dashboard data
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);

// api to get the doctor profile
doctorRouter.get("/profile", authDoctor, doctorProfile);

// api to update the doctor profile
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

// api to get the doctor reviews
doctorRouter.get("/reviews", authDoctor, doctorReviews);

// api to delete the doctor review
doctorRouter.post("/delete-review", authDoctor, deleteDoctorReview);

// api to change the password
doctorRouter.post("/change-password", authDoctor, changePassword);

export default doctorRouter;