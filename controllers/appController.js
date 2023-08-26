
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
import ENV from '../config.js'
import otpGenerator from 'otp-generator'
import { client } from "../model/client.js";
import { v4 as uuid4 } from 'uuid'
import { clearActiveSession, createActiveSession, getActiveSession } from '../middleware/auth.js';

/** middleware for verify user */

export async function verifyUser(req, res, next) {
  try {
    const { email } = req.method === "GET" ? req.query : req.body;

    // Check if user exists
    const userQuery = `*[_type == "user" && email == $email]`;
    const users = await client.fetch(userQuery, { email });

    if (!users || users.length === 0) {
      return res.status(404).send({ error: "Can't find user" });
    }

    next();
  } catch (error) {
    return res.status(500).send({ error: "Authentication Error" });
  }
}

// server time to verify login
export async function serverTime(req, res) {
  const serverTime = new Date().toJSON();
  res.json({ serverTime })
}
/**POST: http://localhost:4000/api/register 
 *@param: {
    "username":"example123",
    "password":"admin123",
    "email":"example@gmail.com",
    "firstName": "Godwin",
    "lastName":"Adu Jr",
    "phone":"0551556650",
    "address":"kumasi Suame",
    "profile":""
 }
*/
export async function register(req, res) {
  try {
    const { firstName,
      middleName,
      lastName,
      password,
      email,
      dateOfBirth,
      gender,
      address,
      addressOne,
      phone,
      phoneOne,
      group,
      congProfile,
      minProfile,
    } = req.body;

    // Check if user already exists
    const existEmailQuery = `*[_type == "user" && email == $email]`;

    const existingEmail = await client.fetch(existEmailQuery, { email });

    if (existingEmail.length > 0) {
      throw new Error("Please use a unique email");
    }

    if (password) {
      // Hash the password (You may use bcrypt if you want)
      // For simplicity, we'll just store the password in plaintext
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user data object
      const user = {
        _type: 'user',
        firstName,
        middleName: middleName || "",
        lastName,
        email,
        password: hashedPassword,
        dateOfBirth,
        sex: gender,
        address,
        addressOne,
        phone,
        emergencyContact: phoneOne,
        congregationGroup: group,
        congregationProfile: congProfile,
        ministryProfile: minProfile,
        groupOverseer: "none",
        attendant: "none",
        profile: "",
        role: "user",

      };

      // Save the user to Sanity
      client.create(user)
        .then(() => res.status(201).send({ success: true, message: "User registered successfully" }))
        .catch((error) => res.status(500).send({ success: false, message: "Failed to save user", error: error.message }));
    }
  } catch (error) {
    return res.status(500).send({ success: false, message: "An error occurred while processing your request", error: error.message });
  }
}
/**POST: http://localhost:4000/api/login 
 *  *@param: {
    "username":"example123",
    "password":"admin123"
 }
*/
export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const userQuery = `*[_type == "user" && email == $email]`;
    const users = await client.fetch(userQuery, { email });

    if (users.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send({ error: "Password does not match" });
    }
     // Check if user has an active session
     const activeSession = await getActiveSession(user._id);
     if (activeSession) {
       return res.status(403).send({ error: "User already logged in on another device" });
     }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user?._id,
        firstname: user?.firstName,
        middlename: user?.middleName,
        lastname: user?.lastName,
        email: user?.email,
        gender: user?.sex,
        group: user?.congregationGroup,
        minProfile: user?.ministryProfile,
        congProfile: user?.congregationProfile,
        duties: user?.congregationDuties,
        overseer: user?.groupOverseer,
        attendant: user?.attendant
      },
      ENV.JWT_SECRET,
      { expiresIn: "1hr" }
    );

    // Create a session record for the user
    await createActiveSession(user._id);

    return res.status(200).send({
      msg: "Login successfully",
      username: user.firstName,
      token,
    });
    
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
}


/**GET: http://localhost:4000/api/user/example123 */
export async function getUser(req, res) {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(500).send({ error: 'Invalid Email' });
    }

    const userQuery = `*[_type == "user" && email == $email]`;
    const user = await client.fetch(userQuery, { email });

    if (!user) {
      return res.status(404).send({ error: "Can't find user" });
    }

    // Since Sanity responses include the password field, we can remove it from the response
    const { password, ...rest } = user[0];

    return res.status(200).send(rest);
  } catch (error) {
    return res.status(500).send({ error: 'Error retrieving user data' });
  }
}

/**GET: http://localhost:4000/api/getGroupUser */
export async function getGroupUser(req, res) {

  try {
    const userQuery = `*[_type == "user"]`;
    const members = await client.fetch(userQuery);

    if (members) {
      res.status(200).send(members);
    } else {
      res.status(404).send({});
    }

  } catch (error) {
    return res.status(500).send({ error: 'Error retrieving user data' });
  }
}

/**GET: http://localhost:4000/api/user/example123 */
export async function getUserProfile(req, res) {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(500).send({ error: 'Invalid Email' });
    }

    const userQuery = `*[_type == "user" &&  _id == $userId]`;
    const user = await client.fetch(userQuery, { userId });

    if (!user) {
      return res.status(404).send({ error: "Can't find user" });
    }

    // Since Sanity responses include the password field, we can remove it from the response
    const { password, ...rest } = user[0];

    return res.status(200).send(rest);
  } catch (error) {
    return res.status(500).send({ error: 'Error retrieving user data' });
  }
}


/**PUT: http://localhost:4000/api/user/example123
 * @param:{
 * "id":<userid>
 * }
 * body:{
 * firstName:"",
 * address:"",
 * profile:""
 * }
*/
export async function updateUser(req, res) {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).send({ error: "Invalid ID" });
    }

    const {
      address,
      addressOne,
      congregationDuties,
      congregationGroup,
      congregationProfile,
      dateOfBirth,
      email,
      emergencyContact,
      firstName,
      lastName,
      middleName,
      ministryProfile,
      phone,
      profile,
      role,
      sex,
    } = req.body;

    // Assuming that the user's data in Sanity has a document ID that matches the userId
    const userDocumentId = userId;
    const userUpdateQuery = `*[_type == "user" && _id == $userDocumentId][0]`;
    const user = await client.fetch(userUpdateQuery, { userDocumentId });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    // Merge the existing user data with the updated fields
    const updatedUser = {
      ...user,
      address,
      addressOne,
      congregationDuties,
      congregationGroup,
      congregationProfile,
      dateOfBirth,
      email,
      emergencyContact,
      firstName,
      lastName,
      middleName,
      ministryProfile,
      phone,
      profile,
      role,
      sex,
    };
    // Update the user in Sanity
    await client.createOrReplace(updatedUser);

    return res.status(200).send({ msg: "User record updated successfully" });
  } catch (error) {
    return res.status(500).send({ error: "Error updating user record" });
  }
}

/** GET: http://localhost:400/api/generateOTP*/
export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
  res.status(201).send({ code: req.app.locals.OTP })
}


/** GET: http://localhost:400/api/verifyOTP*/
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null;
    req.app.locals.resetSession = true;
    return res.status(201).send({ msg: "Verify Successfully ..." })
  }
  return res.status(400).send({ error: "Invalid OTP ..." })
}

/** GET: http://localhost:400/api/resetPassword*/
export async function resetPassword(req, res) {
  res.status(201).json('resetPassword route')
}

/** GET: http://localhost:400/api/report*/
export async function getReport(req, res) {
  // Endpoint to fetch a report by date and userId
  const { date, userId } = req.query;

  try {
    // Fetch data from Sanity using GROQ query
    const query = `*[_type == 'report' && date == $date && userId == $userId]`;
    const params = { date, userId };
    const report = await client.fetch(query, params);

    if (report) {
      res.status(200).send(report);
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
}
/** GET: http://localhost:400/api/reportMonth*/
export async function getMonthGroupReport(req, res) {
  // Endpoint to fetch reports for a specific month and userId
  const { year, month } = req.query;

  try {
    // Fetch data from Sanity using GROQ query
    const query = `*[_type == 'report']`;

    const reports = await client.fetch(query);

    // Filter reports that belong to the specified year and month
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month) - 1; // Months are zero-indexed
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate.getFullYear() === targetYear && reportDate.getMonth() === targetMonth;
    });

    if (filteredReports) {
      res.status(200).send(filteredReports);
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
}
/** GET: http://localhost:400/api/reportMonth*/
export async function getMonthReport(req, res) {
  // Endpoint to fetch reports for a specific month and userId
  const { year, month, userId } = req.query;

  try {
    // Fetch data from Sanity using GROQ query
    const query = `*[_type == 'report' && userId == $userId]`;
    const params = { userId };
    const reports = await client.fetch(query, params);

    // Filter reports that belong to the specified year and month
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month) - 1; // Months are zero-indexed
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate.getFullYear() === targetYear && reportDate.getMonth() === targetMonth;
    });

    if (filteredReports) {
      res.status(200).send(filteredReports);
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
}
/** GET: http://localhost:400/api/reportyear*/
export async function getYearlyReport(req, res) {
  const { year, userId } = req.query;

  try {
    // Fetch data from Sanity using GROQ query
    const query = `*[_type == 'report' && userId == $userId]`;
    const params = { userId };
    const reports = await client.fetch(query, params);

    // Filter reports that belong to the specified year
    const targetYear = parseInt(year);
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate.getFullYear() === targetYear;
    });

    if (filteredReports) {
      res.status(200).send(filteredReports);
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
}



/** POST: http://localhost:400/api/report*/
export async function sendAttendants(req, res) {
  const {
    postedBy,
    userId,
    attendants,
    date,
  } = req.body;
  try {

    // Create a new record
    const createResult = await client
      .create({
        _id: uuid4(),
        _type: 'record',
        postedBy,
        attendants,
        userId,
        date
       
      })

    res.status(201).send({ message: 'Record created successfully', data: createResult });

  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
export async function updateAttendants(req, res) {
  const {recordId} = req.body;

  try {

    const recordDocumentId = recordId;
    const recordUpdateQuery = `*[_type == "record" && _id == $recordDocumentId][0]`;
    const existingRecord = await client.fetch(recordUpdateQuery, { recordDocumentId });

    if (!existingRecord) {
      return res.status(404).send({ error: "record not found" });
    }
    
    const updateRecord = {
      ...existingRecord,
      attendants,
      date,
    }

    await client.createOrReplace(updateAttendants)

    res.status(201).send({ message: 'Record created successfully', data: createResult });

  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
export async function createOrUpdateReport(req, res) {
  const {
    postedBy,
    userId,
    time,
    magazine,
    brochure,
    book,
    tracts,
    video,
    returnVisit,
    study,
    comment,
    date
  } = req.body;
  try {

    // Create a new report
    const createResult = await client
      .create({
        _id: uuid4(),
        _type: 'report',
        postedBy,
        userId,
        hour: time,
        magazine,
        brochure,
        book,
        tracts,
        videoShowing: video,
        returnVisit,
        bibleStudy: study,
        comment,
        date
      })

    res.status(201).send({ message: 'Report created successfully', data: createResult });

  } catch (error) {
    console.error('Error creating/updating report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


export async function logout(req,res){
  const userId = req.body.userId; // or decode it from the token if you send the token.
  
  try {
    await clearActiveSession(userId);
    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
}
