import express from "express";
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, makePayment, contactUs, addReview, getReviewedAppointments, getAllReviews, sendResetPasswordEmail, verifyOTP, resetPassword, changePassword } from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

// user router
const userRouter = express.Router();

// registering a user route
userRouter.post("/register", registerUser);

// login a user route
userRouter.post("/login", loginUser);

// get user profile route
userRouter.get("/getProfile", authUser, getProfile);

// update user profile route
userRouter.post("/updateProfile", upload.single("image"), authUser, updateProfile);

// book an appointment route
userRouter.post("/bookAppointment", authUser, bookAppointment);

// get user appointments route
userRouter.get("/appointments", authUser, listAppointment);

// cancel an appointment route
userRouter.post("/cancelAppointment", authUser, cancelAppointment);

// make payment route
userRouter.post("/makePayment", authUser, makePayment);

// contact us route
userRouter.post("/contactUs", contactUs);

// add review route
userRouter.post("/addReview", authUser, addReview);

// get reviewed appointments route
userRouter.get("/reviewedAppointments", authUser, getReviewedAppointments);

// get all reviews for testimonials
userRouter.get("/reviews", getAllReviews);

// send reset password email route
userRouter.post("/sendResetPasswordEmail", sendResetPasswordEmail);

// verify OTP route
userRouter.post("/verifyOTP", verifyOTP);

// reset password route
userRouter.post("/resetPassword", resetPassword);

// change password route
userRouter.post("/changePassword", authUser, changePassword);

export default userRouter;
