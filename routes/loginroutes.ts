import { Router } from 'express';
import { handleLogin ,verifyOTP,checkUserStatus } from '../controller/loginController';

const router = Router();

// Route for user login
router.post('/login', handleLogin, );



// // Route for protected endpoints (token authentication)
// router.post('/protected', tokenAuthentication);



// Route for verifying OTP
router.post('/users/:id/otp/verify', verifyOTP);

// Route for Check OTP status for a user
router.get('/users/:id/otp', checkUserStatus);


export default router;
