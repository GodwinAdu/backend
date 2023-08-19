import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit';
import router from './router/route.js'
import twilio  from 'twilio';


dotenv.config()
const {PORT} = process.env



const app = express()


// Increase the payload size limit for JSON requests
app.use(express.json({ limit: '20mb' })); // Adjust the limit as needed
app.use(cors());
app.disabled('x-powered-by');
app.use(morgan('tiny'));



app.use('/api', router)
app.get("/", (req,res)=> {
    res.status(200).json('Welcome to Suame Congregation Backend')
})


    // Your Twilio Account SID, Auth Token, and Twilio Phone Number
const accountSid = 'AC12fc6c5d24eeb659332af87f301cf139';
const authToken = '2abb9d06191cf05a3337ed170fd02218';
const twilioPhoneNumber = '+12517328996';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Function to send SMS
async function sendSMS(phoneNumber, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log('SMS Sent Successfully. SID:', result.sid);
    return result;
  } catch (error) {
    console.error('Error Sending SMS:', error.message);
    throw error;
  }
}

// Usage Example:
// Replace 'userPhoneNumber' with the user's phone number and 'Your message here' with the actual message.
// sendSMS('+233551556650', 'Our Boss Is Adu Junio7 ')
//   .then((result) => {
//     // Handle success if needed
//   })
//   .catch((error) => {
//     // Handle error if needed
//   });
 

app.listen(PORT, () => {
    console.log(`server is running on port http://localhost:${PORT}`);
});