const commonFunction = require("../../utils/commonFunction");

export interface User {
  IICSAAK_USER_ID?: string;
  IICSAAK_USER_NAME?: string;
  IICSAAK_USER_EMAIL?: string;
  IICSAAK_PRIM_MOBILE_NO: string;
  IICSAAK_SEX: string;
  IICSAAK_ENTRY_USER?: string;
  IICSAAK_ENTRY_DATE?: Date;
  IICSAAK_MODIFY_USER?: string;
  IICSAAK_MODIFY_DATE?: Date;
  IICSAAK_MARITAL_STATUS?: string;
  IICSAAK_ADDRESS?: string;
  IICSAAK_AADHAR_NO?: string;
  IICSAAK_PRIM_ORGN_CODE?: string;
  IICSAAK_PRIM_DEPT_CODE?: string;
  IICSAAK_PRIM_DESG_CODE?: string;
  IICSAAK_HOST_NAME?: string;
  IICSAAK_IP_ADDRESS?: string;
}

  


  export const selectUser = async (userId: string) => {
    try {
      const sql = "SELECT * FROM IICSAAK_USER_MASTER WHERE IICSAAK_USER_ID = :userId";
      const binds = { userId };
  
      const result = await commonFunction.functionSelect(sql, binds);
      return result;
    } catch (error: any) {
      console.error("Error fetching user:", error.message);
      throw new Error(`Error fetching user: ${error.message}`);
    }
  };




  const checkMobileNumberUnique = async (mobileNumber: string) => {
    try {
      console.log(`Executing SQL: SELECT COUNT(*) AS count FROM IICSAAK_USER_MASTER WHERE IICSAAK_PRIM_MOBILE_NO = '${mobileNumber}'`);
      const sql = `SELECT COUNT(*) AS count FROM IICSAAK_USER_MASTER WHERE IICSAAK_PRIM_MOBILE_NO = :mobileNumber`;
      const result = await commonFunction.functionSelect(sql, [mobileNumber]);
      console.log(`SQL Execution Result:`, result);
  
      // Ensure result[0].COUNT (uppercase) is accessed correctly
      const count = result && result.length > 0 ? result[0].COUNT : 0;
  
      console.log(`Count:`, count);
  
      if (count === 0) {
        return true; // Mobile number is unique
      } else {
        return false; // Mobile number is already in use
      }
    } catch (error) {
      console.error("Error checking mobile number uniqueness:", error);
      throw new Error("Error checking mobile number uniqueness.");
    }
  };
  

  
  export async function insertData(data: User) {
    try {
      // Destructure required fields from data
      const { IICSAAK_USER_ID, IICSAAK_USER_NAME, IICSAAK_USER_EMAIL, IICSAAK_PRIM_MOBILE_NO, IICSAAK_SEX } = data;
  
      // Define required fields explicitly
      const requiredFields: (keyof User)[] = ['IICSAAK_USER_ID', 'IICSAAK_USER_NAME', 'IICSAAK_USER_EMAIL', 'IICSAAK_PRIM_MOBILE_NO', 'IICSAAK_SEX'];
  
      // Check if all required fields exist and are not empty
      const missingFields: string[] = [];
      for (const field of requiredFields) {
        if (!data[field]) {
          missingFields.push(field.split('_').pop()!); // Push the field name without 'IICSAAK_' prefix
        }
      }
  
      if (missingFields.length > 0) {
        throw new Error(`${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} missing`);
      }
  
      // Check for unique mobile number
      const isUniqueMobile = await checkMobileNumberUnique(IICSAAK_PRIM_MOBILE_NO);
      if (!isUniqueMobile) {
        throw new Error("The provided mobile number is already in use by another user.");
      }
  
      // Construct INSERT SQL statement
      const columns = Object.keys(data).join(", ");
      const values = Object.keys(data).map((key) => `:${key}`).join(", ");
      const sql = `INSERT INTO IICSAAK_USER_MASTER (${columns}) VALUES (${values})`;
  
      const result = await commonFunction.functionInsert(sql, data);
      return result;
    } catch (error: any) {
      if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === '23503') {
        let errorMessage = 'Foreign key constraint violation: ';
  
        // Extract the foreign key field from the error message
        const match = error.sqlMessage.match(/foreign key constraint fails \(`.*\.(.*)`\)/i);
        if (match && match.length > 1) {
          const foreignKeyField = match[1] as keyof User; // Assuming User interface has these fields
          errorMessage += `${foreignKeyField.split('_').pop()} '${data[foreignKeyField]}' does not exist.`;
        } else {
          errorMessage += 'One or more foreign key constraints violated.';
        }
  
        throw new Error(errorMessage);
      } else {
        console.error("Error occurred during insertion:", error);
        throw new Error(`Error inserting data: ${error.message}`);
      }
    }
  }


  export const updateUser = async (user: User) => {
  try {
    // Prepare updates and binds for SQL query
    const updates: string[] = [];
    const binds: { [key: string]: any } = {
      IICSAAK_USER_ID: user.IICSAAK_USER_ID,
    };

    for (const key in user) {
      if (key !== "IICSAAK_USER_ID" && user[key as keyof User] !== undefined) {
        updates.push(`${key} = :${key}`);
        binds[key] = user[key as keyof User];
      }
    }

    // Construct and execute the SQL update statement
    const sql = `UPDATE IICSAAK_USER_MASTER SET ${updates.join(", ")} WHERE IICSAAK_USER_ID = :IICSAAK_USER_ID`;
    const result = await commonFunction.functionUpdate(sql, binds);
    return result;
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    throw new Error(`Error updating user: ${error.message}`);
  }
};