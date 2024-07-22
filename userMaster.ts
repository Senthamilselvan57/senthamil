import ip from "ip";
import os from "os";
const commonFunction = require("../../utils/commonFunction");

export interface UserDetails {
  USER_ID?: string;
  USER_NAME?: string;
  USER_EMAIL?: string;
  PRIM_MOBILE_NO?: string;
  SEX?: string;
  ENTRY_USER?: string;
  MODIFY_USER?: string;
  ENTRY_DATE?: Date;
  MODIFY_DATE?: Date;
  MARITAL_STATUS?: string;
  ADDRESS?: string;
  AADHAR_NO?: string;
  PRIM_ORGN_CODE?: string;
  PRIM_DEPT_CODE?: string;
  PRIM_DESG_CODE?: string;
  HOST_NAME?: string;
  IP_ADDRESS?: string;
  PRIM_USER_ID?: string;
  USER_TITLE?: string;
  USER_FROM_DATE?: Date;
  USER_TO_DATE?: Date;
  HOD_USER_ID?: string;
  HOD_TAG?: string;
}

// Function to select all records from IICSAAK_USER_MASTER
export async function selectAllUsers() {
  try {
    const result = await commonFunction.functionSelect(
      `SELECT 
        IICSAAK_USER_ID USER_ID,
        IICSAAK_USER_NAME USER_NAME,
        IICSAAK_USER_EMAIL USER_EMAIL,
        IICSAAK_PRIM_MOBILE_NO PRIM_MOBILE_NO,
        IICSAAK_SEX SEX,
        IICSAAK_ENTRY_USER ENTRY_USER,
        IICSAAK_MODIFY_USER MODIFY_USER,
        IICSAAK_ENTRY_DATE ENTRY_DATE,
        IICSAAK_MODIFY_DATE MODIFY_DATE,
        IICSAAK_MARITAL_STATUS MARITAL_STATUS,
        IICSAAK_ADDRESS ADDRESS,
        IICSAAK_AADHAR_NO AADHAR_NO,
        IICSAAK_PRIM_ORGN_CODE PRIM_ORGN_CODE,
        IICSAAK_PRIM_DEPT_CODE PRIM_DEPT_CODE,
        IICSAAK_PRIM_DESG_CODE PRIM_DESG_CODE
      FROM IICSAAK_USER_MASTER
      WHERE IICSAAK_USER_TO_DATE IS NULL`,
      []
    );
    console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
}

// Function to select a specific record by USER_ID from IICSAAK_USER_MASTER
export async function selectUserById(userId: string) {
  try {
    // Ensure userId is defined and valid
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Execute the SQL query
    const result = await commonFunction.functionSelect(
      `SELECT 
        IICSAAK_USER_ID USER_ID,
        IICSAAK_USER_NAME USER_NAME,
        IICSAAK_USER_EMAIL USER_EMAIL,
        IICSAAK_PRIM_MOBILE_NO PRIM_MOBILE_NO,
        IICSAAK_SEX SEX,
        IICSAAK_ENTRY_USER ENTRY_USER,
        IICSAAK_MODIFY_USER MODIFY_USER,
        IICSAAK_ENTRY_DATE ENTRY_DATE,
        IICSAAK_MODIFY_DATE MODIFY_DATE,
        IICSAAK_MARITAL_STATUS MARITAL_STATUS,
        IICSAAK_ADDRESS ADDRESS,
        IICSAAK_AADHAR_NO AADHAR_NO,
        IICSAAK_PRIM_ORGN_CODE PRIM_ORGN_CODE,
        IICSAAK_PRIM_DEPT_CODE PRIM_DEPT_CODE,
        IICSAAK_PRIM_DESG_CODE PRIM_DESG_CODE
      FROM IICSAAK_USER_MASTER
      WHERE IICSAAK_USER_ID = :id
        AND IICSAAK_USER_TO_DATE IS NULL`,
      { id: userId } // Using object syntax for binding
    );

    // Check if result is empty
    if (result.length === 0) {
      throw new Error("No data found");
    }

    return result;
  } catch (err) {
    // Log the error and throw it for higher-level handling
    console.error("Error in selectUserById:", err);
    throw err;
  }
}

export const checkMobileNumberExists = async (
  mobileNumber: string
): Promise<boolean> => {
  try {
    const sql = `SELECT COUNT(*) FROM IICSAAK_USER_MASTER WHERE IICSAAK_PRIM_MOBILE_NO = :mobileNumber`;
    const result = await commonFunction.functionSelect(sql, { mobileNumber });
    return result[0]["COUNT(*)"] > 0;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

export const insertUser = async (data: UserDetails) => {
  try {
    // List of mandatory fields
    const mandatoryFields: (keyof UserDetails)[] = [
      "USER_ID",
      "USER_NAME",
      "USER_EMAIL",
      "PRIM_MOBILE_NO",
      "SEX",
      "PRIM_USER_ID",
      "USER_TITLE",
      "MARITAL_STATUS",
      "ADDRESS",
      "AADHAR_NO",
      "PRIM_ORGN_CODE",
      "PRIM_DEPT_CODE",
      "PRIM_DESG_CODE",
    ];

    // Check if all mandatory fields are present in the data
    for (const field of mandatoryFields) {
      if (!data[field]) {
        throw new Error(`Missing mandatory field: ${field}`);
      }
    }

    // Check if mobile number already exists
    const mobileNumber = data.PRIM_MOBILE_NO;
    if (!mobileNumber) {
      throw new Error("Mobile number is required.");
    }

    const exists = await checkMobileNumberExists(mobileNumber);
    if (exists) {
      throw new Error("Mobile number already exists.");
    }

    // Get hostname and IP address
    const hostname = os.hostname();
    const ipAddress = ip.address();

    // Add hostname and IP address to the data
    data.HOST_NAME = hostname;
    data.IP_ADDRESS = ipAddress;
    data.ENTRY_USER = data.USER_ID; // Set ENTRY_USER to the user ID
    data.ENTRY_DATE = new Date(); // Use current date and time for ENTRY_DATE

    // Construct the column names with the IICSAAK_ prefix
    const columns = Object.keys(data)
      .map((key) => `IICSAAK_${key}`)
      .join(", ");

    // Construct the placeholders for bind parameters with the I prefix
    const values = Object.keys(data)
      .map((key) => `:I${key}`)
      .join(", ");

    // Construct the SQL INSERT statement
    const sql = `INSERT INTO IICSAAK_USER_MASTER (${columns}) VALUES (${values})`;

    // Prepare the binds object with the I prefix
    const binds = Object.keys(data).reduce((acc, key) => {
      acc[`I${key}`] = data[key as keyof UserDetails];
      return acc;
    }, {} as { [key: string]: any });

    // Execute the SQL statement with the prepared binds
    const result = await commonFunction.functionInsert(sql, binds);
    return result;
  } catch (error: any) {
    console.error("Error occurred during insertion:", error);
    throw new Error(`Error inserting data: ${error.message}`);
  }
};

export const updateUser = async (
  userId: string,
  updatedDetails: Partial<UserDetails>
) => {
  try {
    const updates: string[] = [];
    const binds: { [key: string]: any } = { IICSAAK_USER_ID: userId };

    // Add hostname and IP address to the updates if they are present
    const hostname = os.hostname();
    const ipAddress = ip.address();
    if (updatedDetails.HOST_NAME === undefined) {
      updatedDetails.HOST_NAME = hostname;
    }
    if (updatedDetails.IP_ADDRESS === undefined) {
      updatedDetails.IP_ADDRESS = ipAddress;
    }

    // Use userId as MODIFY_USER
    updatedDetails.MODIFY_USER = userId; // Set to the ID of the user performing the update
    updatedDetails.MODIFY_DATE = new Date(); // Set to current date/time

    // Construct the column update statements and bind parameters
    for (const key in updatedDetails) {
      if (updatedDetails[key as keyof UserDetails] !== undefined) {
        // Add column update statements and bind parameters with the I prefix
        updates.push(`IICSAAK_${key.toUpperCase()} = :I${key}`);
        binds[`I${key}`] = updatedDetails[key as keyof UserDetails];
      }
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Construct the SQL UPDATE statement
    const sql = `UPDATE IICSAAK_USER_MASTER SET ${updates.join(
      ", "
    )} WHERE IICSAAK_USER_ID = :IICSAAK_USER_ID`;

    // Execute the SQL statement with the prepared binds
    const result = await commonFunction.functionUpdate(sql, binds);
    return result;
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    throw new Error(`Error updating user: ${error.message}`);
  }
};
