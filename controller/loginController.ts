import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import dotenv from "dotenv";
import ip from "ip";
dotenv.config();
import os from "os";
const commonFunction = require("../../../utils/commonFunction");
import { checkUserExists, getUserIdOrMobile } from "./userValidationController";
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to create refresh token
const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

//@desc    Check the status of a user based on their OTP and refresh token
//@route   GET  /api/v1/users/:id/otp
//@access  Private

export const checkUserStatus = async (req: Request, res: Response) => {
  try {
    const { id: userId, mobile } = req.params;
    const identifier = userId || mobile;

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "User ID or Mobile Number is required" });
    }

    console.log(`Checking user status for identifier: ${identifier}`);

    // Check if the user exists
    let userExists: boolean;
    try {
      userExists = await checkUserExists(identifier);
      if (!userExists) {
        throw { statusCode: 404, message: "User not found" };
      }
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: "false",
        otpStatus: "INVALID USER ID OR MOBILE NUMBER",
        message: error.message || "Error checking user existence",
      });
    }

    // Fetch user details (user ID and mobile number)
    let fetchedUserId: string | null = null;
    let mobileNumber: string | null = null;
    try {
      const userDetails = await getUserIdOrMobile(identifier);
      if (!userDetails) {
        throw { statusCode: 404, message: "User details not found" };
      }
      fetchedUserId = userDetails.userId;
      mobileNumber = userDetails.mobileNumber;
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: "false",
        otpStatus: "INVALID USER ID OR MOBILE NUMBER",
        message: error.message || "Error fetching user details",
      });
    }

    if (!fetchedUserId) {
      return res.status(404).json({
        status: "false",
        otpStatus: "INVALID USER ID OR MOBILE NUMBER",
        message: "User not found",
      });
    }

    // Check OTP status
    const statusCheckSql = `
      SELECT IICSAAW_STATUS, IICSAAW_TOKEN_EXPIRY_DATE
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const statusCheckBind = { userId: fetchedUserId };
    const statusCheckResult = await commonFunction.functionSelect(
      statusCheckSql,
      statusCheckBind
    );

    if (!statusCheckResult || statusCheckResult.length === 0) {
      // No OTP data found, send new OTP
      try {
        await sendNewOtp(fetchedUserId, mobileNumber, req);
        return res.status(200).json({
          status: "false",
          otpStatus: "NO DATA FOUND",
          message:
            "No OTP data found. A new OTP has been sent. Please verify your OTP.",
        });
      } catch (error: any) {
        return res.status(error.statusCode || 500).json({
          status: "false",
          otpStatus: "ERROR SENDING NEW OTP",
          message: error.message || "Error sending new OTP",
        });
      }
    }

    const otpDetails = statusCheckResult[0];
    const now = new Date();
    const expiryDate = new Date(otpDetails.IICSAAW_TOKEN_EXPIRY_DATE);

    if (now > expiryDate) {
      // OTP expired, send new OTP
      try {
        await sendNewOtp(fetchedUserId, mobileNumber, req);
        return res.status(401).json({
          status: "false",
          otpStatus: "EXPIRED OTP",
          message:
            "OTP has expired. A new OTP has been sent. Please verify your OTP.",
        });
      } catch (error: any) {
        return res.status(error.statusCode || 500).json({
          status: "false",
          otpStatus: "ERROR SENDING NEW OTP",
          message: error.message || "Error sending new OTP",
        });
      }
    }

    if (otpDetails.IICSAAW_STATUS === "N") {
      // OTP is pending verification
      return res.status(202).json({
        status: "true",
        otpStatus: "PENDING",
        message: "OTP already sent and pending verification",
      });
    }

    // OTP is verified
    return res.status(200).json({
      status: "true",
      otpStatus: "VERIFIED",
      message: "User has a valid OTP",
    });
  } catch (error: any) {
    console.error("Error checking user status:", error);
    return res.status(500).json({
      status: "false",
      message: "Error checking user status",
      errorMessage: error.message,
    });
  }
};

// Helper function to send a new OTP
const sendNewOtp = async (
  userId: string,
  mobileNumber: string | null,
  req: Request
) => {
  try {
    if (!mobileNumber) {
      throw {
        statusCode: 400,
        message: "Mobile number not found for the provided identifier",
      };
    }

    const otp = generateOtp();
    const refreshToken = createRefreshToken(userId);

    // Set token expiry to one month from now
    const tokenExpiry = new Date();
    tokenExpiry.setMonth(tokenExpiry.getMonth() + 1);

    const hostname = os.hostname();
    let ipAddress = ip.address();

    // Check if the user exists in IICSAAW_USER_OTP_DETAILS
    const checkUserSql = `
      SELECT COUNT(*) AS userCount
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const checkUserBind = { userId };
    const checkUserResult = await commonFunction.functionSelect(
      checkUserSql,
      checkUserBind
    );

    if (
      checkUserResult &&
      checkUserResult.length > 0 &&
      checkUserResult[0].USERCOUNT > 0
    ) {
      // User exists, update the OTP details
      const updateOtpSql = `
        UPDATE IICSAAW_USER_OTP_DETAILS
        SET IICSAAW_USER_OTP = :otp,
            IICSAAW_REFRESH_TOKEN = :refreshToken,
            IICSAAW_TOKEN_EXPIRY_DATE = :tokenExpiry,
            IICSAAW_STATUS = 'N',
            IICSAAW_HOST_NAME = :hostname,
            IICSAAW_IP_ADDRESS = :ipAddress
        WHERE IICSAAW_USER_ID = :userId
      `;
      const updateOtpBind = {
        userId,
        otp,
        refreshToken,
        tokenExpiry,
        hostname,
        ipAddress,
      };
      await commonFunction.functionInsert(updateOtpSql, updateOtpBind);
    } else {
      // User does not exist, insert a new record
      const insertOtpSql = `
        INSERT INTO IICSAAW_USER_OTP_DETAILS (IICSAAW_USER_ID, IICSAAW_USER_OTP, IICSAAW_REFRESH_TOKEN, IICSAAW_TOKEN_EXPIRY_DATE, IICSAAW_STATUS, IICSAAW_HOST_NAME, IICSAAW_IP_ADDRESS)
        VALUES (:userId, :otp, :refreshToken, :tokenExpiry, 'N', :hostname, :ipAddress)
      `;
      const insertOtpBind = {
        userId,
        otp,
        refreshToken,
        tokenExpiry,
        hostname,
        ipAddress,
      };
      await commonFunction.functionInsert(insertOtpSql, insertOtpBind);
    }

    const smsUrl = `http://cloudsms.inwayhosting.com/ApiSmsHttp?UserId=sms@psgimsr.ac.in&pwd=Psg@123&Message=Your+One+Time+Password+for+PSG+Hospitals+is+${otp}.+Do+not+share+OTP+with+anyone.&Contacts=${mobileNumber}&SenderId=PSGAPP&ServiceName=SMSTRANS&MessageType=1`;

    await axios.get(smsUrl);
    console.log(`New OTP sent: ${otp}, URL: ${smsUrl}`);
  } catch (error: any) {
    console.error("Error sending new OTP:", error);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error sending new OTP",
    };
  }
};

//@desc     Verify the user based upon the OTP
//@route    POST  /api/v1/users/:id/otp/verify
//@access   Private
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { id: identifier } = req.params; // Using identifier to allow userId or mobile
    const { otp, newPassword } = req.body;

    // Check if identifier and otp are provided
    if (!identifier || !otp) {
      return res
        .status(400)
        .json({ error: "User ID or Mobile number and OTP are required" });
    }

    // Fetch userId and mobile number
    const { userId, mobileNumber } = await getUserIdOrMobile(identifier);

    if (!userId || !mobileNumber) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch OTP details from the database
    const fetchOtpSql = `
      SELECT IICSAAW_USER_OTP, IICSAAW_REFRESH_TOKEN, IICSAAW_TOKEN_EXPIRY_DATE, IICSAAW_STATUS
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const fetchOtpBind = { userId };
    const result = await commonFunction.functionSelect(
      fetchOtpSql,
      fetchOtpBind
    );

    // Check if OTP details are found
    if (!result || result.length === 0 || !result[0].IICSAAW_USER_OTP) {
      return res.status(404).json({
        status: "false",
        otpStatus: "NODATAFOUND",
        message: "OTP not found or expired",
      });
    }

    const otpDetails = result[0];
    const fetchedOTP = otpDetails.IICSAAW_USER_OTP.toString().trim();
    const expiryDate = new Date(otpDetails.IICSAAW_TOKEN_EXPIRY_DATE);

    // Check if OTP is expired
    if (new Date() > expiryDate) {
      return res.status(401).json({
        status: "false",
        otpStatus: "EXPIREDOTP",
        message: "OTP expired. Please request a new OTP to verify again.",
      });
    }

    // Check if the provided OTP matches the fetched OTP
    if (fetchedOTP !== otp.trim()) {
      return res.status(400).json({
        status: "false",
        message: "Invalid OTP",
      });
    }

    // Update the OTP status to 'Y' (verified)
    const updateOtpStatusSql = `
      UPDATE IICSAAW_USER_OTP_DETAILS
      SET IICSAAW_STATUS = 'Y'
      WHERE IICSAAW_USER_ID = :userId AND IICSAAW_STATUS = 'N'
    `;
    const updateOtpStatusBind = { userId };
    await commonFunction.functionUpdate(
      updateOtpStatusSql,
      updateOtpStatusBind
    );

    // If newPassword is provided, update the password history
    if (newPassword) {
      const hostname = os.hostname();
      const ipAddress = ip.address();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Check if a password history entry already exists for the user
      const fetchPasswordHistorySql = `
        SELECT COUNT(*) as count
        FROM IICSAAU_PASSWORD_HISTORY
        WHERE IICSAAU_USER_ID = :userId
      `;
      const fetchPasswordHistoryBind = { userId };
      const passwordHistoryResult = await commonFunction.functionSelect(
        fetchPasswordHistorySql,
        fetchPasswordHistoryBind
      );

      const passwordHistoryCount = passwordHistoryResult[0].COUNT;

      if (passwordHistoryCount > 0) {
        // Update existing password entry
        const updatePasswordHistorySql = `
          UPDATE IICSAAU_PASSWORD_HISTORY
          SET IICSAAU_PASSWORD = :hashedPassword, IICSAAU_PWD_LASTUPDATE = SYSDATE, IICSAAU_HOST_NAME = :hostname, IICSAAU_IP_ADDRESS = :ipAddress
          WHERE IICSAAU_USER_ID = :userId
        `;
        const updatePasswordHistoryBind = {
          userId,
          hashedPassword,
          hostname,
          ipAddress,
        };
        await commonFunction.functionUpdate(
          updatePasswordHistorySql,
          updatePasswordHistoryBind
        );

        return res.status(200).json({
          status: "true",
          otpStatus: "VERIFIED",
          message: "OTP verified successfully. Password has been updated.",
        });
      } else {
        // Insert new password history entry if none exists
        const insertPasswordHistorySql = `
          INSERT INTO IICSAAU_PASSWORD_HISTORY (IICSAAU_USER_ID, IICSAAU_PASSWORD, IICSAAU_PWD_LASTUPDATE, IICSAAU_HOST_NAME, IICSAAU_IP_ADDRESS)
          VALUES (:userId, :hashedPassword, SYSDATE, :hostname, :ipAddress)
        `;
        const insertPasswordHistoryBind = {
          userId,
          hashedPassword,
          hostname,
          ipAddress,
        };
        await commonFunction.functionInsert(
          insertPasswordHistorySql,
          insertPasswordHistoryBind
        );

        return res.status(200).json({
          status: "true",
          otpStatus: "VERIFIED",
          message: "OTP verified successfully. New password has been updated.",
        });
      }
    }

    return res.status(200).json({
      status: "true",
      otpStatus: "VERIFIED",
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ error: "Error verifying OTP", errorMessage: error.message });
  }
};

//@desc     Handle user login by verifying credentials and issuing a token
//@route    POST /api/v1/login
//@access   Private
export const handleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { USER_ID, PASSWORD } = req.body;

  try {
    if (!USER_ID || !PASSWORD) {
      res.status(400).json({ message: "User ID and Password are required" });
      return;
    }

    console.log(`Received login request with USER_ID: ${USER_ID}`);

    const userData = await getUserIdOrMobile(USER_ID);

    if (!userData.userId) {
      res.status(404).json({
        status: "false",
        message: "User not found or no password found for the provided user ID",
      });
      return;
    }

    const userId = userData.userId;

    // Check OTP status
    const otpStatusSql = `
      SELECT IICSAAW_STATUS
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const otpStatusBind = { userId };

    console.log("Executing SQL to check OTP status:");
    console.log(otpStatusSql);
    console.log("With binds:");
    console.log(otpStatusBind);

    const otpStatusResult = await commonFunction.functionSelect(
      otpStatusSql,
      otpStatusBind
    );

    console.log("OTP status query result:");
    console.log(otpStatusResult);

    if (
      !otpStatusResult ||
      otpStatusResult.length === 0 ||
      otpStatusResult[0].IICSAAW_STATUS !== "Y"
    ) {
      res.status(400).json({
        status: "false",
        message: "OTP not verified or invalid",
      });
      return;
    }

    // Fetch hashed password from password history table
    const fetchPasswordSql = `
      SELECT IICSAAU_PASSWORD
      FROM IICSAAU_PASSWORD_HISTORY
      WHERE IICSAAU_USER_ID = :userId
      ORDER BY IICSAAU_ENTRY_DATE DESC
      FETCH FIRST 1 ROWS ONLY
    `;
    const fetchPasswordBind = { userId };

    console.log("Executing SQL to fetch password:");
    console.log(fetchPasswordSql);
    console.log("With binds:");
    console.log(fetchPasswordBind);

    const passwordResult = await commonFunction.functionSelect(
      fetchPasswordSql,
      fetchPasswordBind
    );

    console.log("Password query result:");
    console.log(passwordResult);

    if (!passwordResult || passwordResult.length === 0) {
      res
        .status(404)
        .json({ status: "false", message: "Password not found for the user" });
      return;
    }

    const hashedPasswordFromDB = passwordResult[0].IICSAAU_PASSWORD;

    // Compare hashed passwords
    const isPasswordMatch = await bcrypt.compare(
      PASSWORD,
      hashedPasswordFromDB
    );

    if (!isPasswordMatch) {
      res.status(401).json({ status: "false", message: "Invalid password" });
      return;
    }

    // Generate new tokens if no existing tokens are found
    const accessToken = jwt.sign(
      { userId: USER_ID },
      process.env.JWT_SECRET as string,
      { expiresIn: "1m" }
    );
    const refreshToken = jwt.sign(
      { userId: USER_ID },
      process.env.JWT_SECRET as string,
      { expiresIn: "3m" }
    );

    // Check if there is an existing refresh token in cookies
    const existingRefreshToken = req.cookies.refreshToken;

    if (existingRefreshToken) {
      try {
        // Verify the existing refresh token
        jwt.verify(existingRefreshToken, process.env.JWT_SECRET as string);
      } catch (error) {
        // Refresh token expired, generate new refresh and access tokens
        await updateLoginDetails(userId, refreshToken, req);
      }
    } else {
      await updateLoginDetails(userId, refreshToken, req);
    }

    // Set tokens in response cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60000,
    }); // 1 minute
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 180000,
    }); // 3 minutes

    // Set tokens in response headers (optional)
    res.setHeader("accessToken", accessToken);
    res.setHeader("refreshToken", refreshToken);

    // Send a success response
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    res.status(200).json({
      status: "true",
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update login details in the database
const updateLoginDetails = async (
  userId: string,
  refreshToken: string,
  req: Request
) => {
  // Extract IICSAAV_HOST_NAME and IICSAAV_IP_ADDRESS from the request

  const hostname = os.hostname();
  let ipAddress = ip.address();

  const fetchLoginDetailsSql = `
    SELECT IICSAAV_USER_ID
    FROM IICSAAV_LOGIN_DETAILS
    WHERE IICSAAV_USER_ID = :userId
  `;
  const fetchLoginDetailsBind = { userId };

  const loginDetailsResult = await commonFunction.functionSelect(
    fetchLoginDetailsSql,
    fetchLoginDetailsBind
  );

  if (loginDetailsResult.length > 0) {
    // Update existing login details
    const updateLoginSql = `
      UPDATE IICSAAV_LOGIN_DETAILS
      SET IICSAAV_REFRESH_TOKEN = :refreshToken,
          IICSAAV_TOKEN_EXPIRY_DATE = CURRENT_TIMESTAMP + INTERVAL '1' DAY,
          IICSAAV_HOST_NAME = :hostName,
          IICSAAV_IP_ADDRESS = :ipAddress
      WHERE IICSAAV_USER_ID = :userId
    `;
    const updateLoginBind = { userId, refreshToken, hostname, ipAddress };

    await commonFunction.functionUpdate(updateLoginSql, updateLoginBind);
  } else {
    // Insert new login details
    const insertLoginSql = `
      INSERT INTO IICSAAV_LOGIN_DETAILS (IICSAAV_USER_ID, IICSAAV_LOGIN_TIME, IICSAAV_REFRESH_TOKEN, IICSAAV_TOKEN_EXPIRY_DATE, IICSAAV_HOST_NAME, IICSAAV_IP_ADDRESS)
      VALUES (:userId, CURRENT_TIMESTAMP, :refreshToken, CURRENT_TIMESTAMP + INTERVAL '1' DAY, :hostName, :ipAddress)
    `;
    const insertLoginBind = { userId, refreshToken, hostname, ipAddress };

    await commonFunction.functionInsert(insertLoginSql, insertLoginBind);
  }
};

module.exports = { handleLogin, checkUserStatus, verifyOTP };
