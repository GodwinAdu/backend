import { Router } from "express";
import * as controller from '../controllers/appController.js';
import Auth, { localVariables } from '../middleware/auth.js'
const router = Router();





/** POST methods */
router.route('/register').post(controller.register)  //register user
router.route('/logout').post(controller.logout)  //register user
// router.route('/registerMail').post()  //send email
router.route('/authenticate').post((req,res) => res.end())  //authenticate user
router.route('/login').post(controller.verifyUser,controller.login)  //login user
router.route('/report').post(controller.createOrUpdateReport)  //creating or updating report
router.route('/momo').post(controller.verifyUser)  //login user
router.route('/sendAttendants').post(controller.sendAttendants)  //login user


/** GET methods */
router.route('/user/:email').get(controller.getUser)  //user with username
router.route('/getGroupUser').get(controller.getGroupUser)  //user with username
router.route('/server').get(controller.serverTime)  //get current time for users to login
router.route('/report').get(controller.getReport)  //get user report
router.route('/reportMonth').get(controller.getMonthReport)  //get user report
router.route('/reportMonthGroup').get(controller.getMonthGroupReport)  //get user report
router.route('/reportYear').get(controller.getYearlyReport)  //get user report
router.route('/userProfile/:userId').get(controller.getUserProfile)  //user with username
router.route('/generateOTP').get(controller.verifyUser,localVariables,controller.generateOTP)  //generate OTP
router.route('/VerifyOTP').get(controller.verifyOTP) //verify OTP 
// router.route('/createResetSession').get(controller.cre)  //reset all variables




/** PUT methods */
router.route('/updateuser').put(Auth,controller.updateUser)  // is use to update user profile
router.route('/updateAttendants').put(controller.updateAttendants)  // is use to update user profile
router.route('/resetPassword').put(controller.resetPassword)  //use to reset users password




export default router