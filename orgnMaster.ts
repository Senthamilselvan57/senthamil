import { format } from "date-fns";
const commonFunction = require("../../utils/commonFunction");
import * as os from "os";
import * as ip from "ip";

export interface Organization {
  ORGN_CODE?: string;
  INST_CODE?: string;
  ORGN_NAME?: string;
  ORGN_SNAME?: string;
  ORGN_DESCRIPTION?: string;
  ORGN_TYPE_CODE?: string;
  GROUP_CODE?: string;
  SUB_GROUP_CODE?: string;
  LOGO_CODE?: string;
  ORGN_PROFILE?: string;
  ORGN_ADDRESS?: string;
  ORGN_PAN?: string;
  ORGN_TAN?: string;
  ORGN_GST?: string;
  ORGN_MOBILE?: string;
  ORGN_EMAIL?: string;
  ORGN_GST_EMAIL?: string;
  ORGN_GST_NAME?: string;
  ORGN_LICENSE_NUMBER?: string;
  ORGN_LICENSE_DATE?: Date;
  ORGN_ORDER?: number;
  FROM_DATE?: Date;
  TO_DATE?: Date;
  ENTRY_USER?: string;
  MODIFY_USER?: string;
  ENTRY_DATE?: Date;
  MODIFY_DATE?: Date;
  HOST_NAME?: string;
  IP_ADDRESS?: string;
}

export async function selectAllOrganizations(): Promise<Organization[]> {
  try {
    const result = await commonFunction.functionSelect(
      `SELECT 
        IICSAAB_ORGN_CODE AS ORGN_CODE,
        IICSAAB_INST_CODE AS INST_CODE,
        IICSAAB_ORGN_NAME AS ORGN_NAME,
        IICSAAB_ORGN_SNAME AS ORGN_SNAME,
        IICSAAB_ORGN_DESCRIPTION AS ORGN_DESCRIPTION,
        IICSAAB_ORGN_TYPE_CODE AS ORGN_TYPE_CODE,
        IICSAAB_GROUP_CODE AS GROUP_CODE,
        IICSAAB_SUB_GROUP_CODE AS SUB_GROUP_CODE,
        IICSAAB_LOGO_CODE AS LOGO_CODE,
        IICSAAB_ORGN_PROFILE AS ORGN_PROFILE,
        IICSAAB_ORGN_ADDRESS AS ORGN_ADDRESS,
        IICSAAB_ORGN_PAN AS ORGN_PAN,
        IICSAAB_ORGN_TAN AS ORGN_TAN,
        IICSAAB_ORGN_GST AS ORGN_GST,
        IICSAAB_ORGN_MOBILE AS ORGN_MOBILE,
        IICSAAB_ORGN_EMAIL AS ORGN_EMAIL,
        IICSAAB_ORGN_GST_EMAIL AS ORGN_GST_EMAIL,
        IICSAAB_ORGN_GST_NAME AS ORGN_GST_NAME,
        IICSAAB_ORGN_LICENSE_NUMBER AS ORGN_LICENSE_NUMBER,
        IICSAAB_ORGN_LICENSE_DATE AS ORGN_LICENSE_DATE,
        IICSAAB_ORGN_ORDER AS ORGN_ORDER,
        IICSAAB_FROM_DATE AS FROM_DATE,
        IICSAAB_TO_DATE AS TO_DATE,
        IICSAAB_ENTRY_USER AS ENTRY_USER,
        IICSAAB_MODIFY_USER AS MODIFY_USER,
        IICSAAB_ENTRY_DATE AS ENTRY_DATE,
        IICSAAB_MODIFY_DATE AS MODIFY_DATE
      FROM IICSAAB_ORGN_MASTER
      WHERE IICSAAB_TO_DATE IS NULL`
    );
    return result;
  } catch (err) {
    throw err;
  }
}

export async function selectOrganizationByCode(
  orgCode: string
): Promise<Organization[]> {
  try {
    if (!orgCode) {
      throw new Error("Organization code is required.");
    }

    // Updated SQL query to filter out rows where TO_DATE is not NULL
    const sql = `
      SELECT 
        IICSAAB_ORGN_CODE AS ORGN_CODE,
        IICSAAB_INST_CODE AS INST_CODE,
        IICSAAB_ORGN_NAME AS ORGN_NAME,
        IICSAAB_ORGN_SNAME AS ORGN_SNAME,
        IICSAAB_ORGN_DESCRIPTION AS ORGN_DESCRIPTION,
        IICSAAB_ORGN_TYPE_CODE AS ORGN_TYPE_CODE,
        IICSAAB_GROUP_CODE AS GROUP_CODE,
        IICSAAB_SUB_GROUP_CODE AS SUB_GROUP_CODE,
        IICSAAB_LOGO_CODE AS LOGO_CODE,
        IICSAAB_ORGN_PROFILE AS ORGN_PROFILE,
        IICSAAB_ORGN_ADDRESS AS ORGN_ADDRESS,
        IICSAAB_ORGN_PAN AS ORGN_PAN,
        IICSAAB_ORGN_TAN AS ORGN_TAN,
        IICSAAB_ORGN_GST AS ORGN_GST,
        IICSAAB_ORGN_MOBILE AS ORGN_MOBILE,
        IICSAAB_ORGN_EMAIL AS ORGN_EMAIL,
        IICSAAB_ORGN_GST_EMAIL AS ORGN_GST_EMAIL,
        IICSAAB_ORGN_GST_NAME AS ORGN_GST_NAME,
        IICSAAB_ORGN_LICENSE_NUMBER AS ORGN_LICENSE_NUMBER,
        IICSAAB_ORGN_LICENSE_DATE AS ORGN_LICENSE_DATE,
        IICSAAB_ORGN_ORDER AS ORGN_ORDER,
        IICSAAB_FROM_DATE AS FROM_DATE,
        IICSAAB_TO_DATE AS TO_DATE,
        IICSAAB_ENTRY_USER AS ENTRY_USER,
        IICSAAB_MODIFY_USER AS MODIFY_USER,
        IICSAAB_ENTRY_DATE AS ENTRY_DATE,
        IICSAAB_MODIFY_DATE AS MODIFY_DATE
      FROM IICSAAB_ORGN_MASTER
      WHERE IICSAAB_ORGN_CODE = :orgCode
        AND IICSAAB_TO_DATE IS NULL
    `;

    const binds = { orgCode };

    const result = await commonFunction.functionSelect(sql, binds);
    return result;
  } catch (error: any) {
    console.error("Error selecting organization:", error.message);
    throw new Error(`Error selecting organization: ${error.message}`);
  }
}

const generateOrgnCode = async (): Promise<string> => {
  try {
    console.log("Generating organization code...");
    const sql = "SELECT IICSAAA_AUTOGEN.IICSAAB_ORGN_CODE FROM DUAL";
    console.log("Executing SQL:", sql);
    const result = await commonFunction.functionSelect(sql, []);
    console.log("SQL result:", result);

    if (result && result.length > 0 && result[0].IICSAAB_ORGN_CODE) {
      let nextVal = result[0].IICSAAB_ORGN_CODE;
      let orgnCode: string;

      if (nextVal.startsWith("PS")) {
        orgnCode = nextVal;
      } else {
        orgnCode = `PS${String(nextVal).padStart(4, "0")}`;
      }

      console.log("Generated organization code:", orgnCode);

      if (orgnCode.length !== 6) {
        throw new Error(
          `Generated organization code '${orgnCode}' does not meet the length requirement of 6 characters`
        );
      }

      return orgnCode;
    } else {
      throw new Error(
        "Failed to generate organization code: No valid result returned from database"
      );
    }
  } catch (error) {
    console.error("Error generating organization code:", error);
    throw error;
  }
};

const formatDateForOracle = (date: Date): string => {
  return format(date, "dd-MM-yy"); // Ensure this matches the Oracle expected format
};

// Validate if a date string is valid
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const insertOrganization = async (data: Organization) => {
  try {
    // List of mandatory fields
    const mandatoryFields: (keyof Organization)[] = [
      "INST_CODE",
      "ORGN_NAME",
      "ORGN_TYPE_CODE",
      "LOGO_CODE",
      "ORGN_PROFILE",
      "ORGN_ADDRESS",
      "ORGN_TAN",
      "ORGN_GST",
      "ORGN_MOBILE",
      "ORGN_EMAIL",
      "ORGN_GST_EMAIL",
      "ORGN_GST_NAME",
      "ORGN_LICENSE_NUMBER",
    ];

    // List of date fields
    const dateFields: (keyof Organization)[] = [
      "ENTRY_DATE",
      "ORGN_LICENSE_DATE",
      // Add other date fields here if needed
    ];

    // Check if all mandatory fields are present in the data
    for (const field of mandatoryFields) {
      if (!data[field]) {
        throw new Error(`Missing mandatory field: ${field}`);
      }
    }

    // Generate ORGN_CODE if not provided
    if (!data.ORGN_CODE) {
      data.ORGN_CODE = await generateOrgnCode();
    }

    // Convert date fields to strings if they are Date objects
    const formattedData: Record<string, any> = Object.keys(data).reduce(
      (acc, key) => {
        if (dateFields.includes(key as keyof Organization)) {
          const value = data[key as keyof Organization];
          acc[key] = value instanceof Date ? formatDateForOracle(value) : value;
        } else {
          acc[key] = data[key as keyof Organization];
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Add ENTRY_DATE to formattedData
    formattedData.ENTRY_DATE = formatDateForOracle(new Date());

    // Remove MODIFY_DATE from formattedData
    delete formattedData.MODIFY_DATE;

    // Add host and IP address to the formatted data
    const hostname = os.hostname();
    const ipAddress = ip.address();
    formattedData.HOST_NAME = hostname;
    formattedData.IP_ADDRESS = ipAddress;

    // Construct the column names with the IICSAAB_ prefix
    const columns = Object.keys(formattedData)
      .map((key) => `IICSAAB_${key}`)
      .join(", ");

    // Construct the placeholders for bind parameters with the I prefix
    const values = Object.keys(formattedData)
      .map((key) => {
        if (dateFields.includes(key as keyof Organization)) {
          return `TO_DATE(:I${key}, 'DD-MM-YY')`;
        }
        return `:I${key}`;
      })
      .join(", ");

    // Construct the SQL INSERT statement
    const sql = `
      INSERT INTO IICSAAB_ORGN_MASTER (
        ${columns}
      ) VALUES (
        ${values}
      )
    `;

    // Prepare the bind parameters with the I prefix
    const bindParameters = Object.keys(formattedData).reduce((acc, key) => {
      acc[`I${key}`] = formattedData[key];
      return acc;
    }, {} as { [key: string]: any });

    console.log("Executing SQL:", sql);
    console.log("With bind parameters:", bindParameters);

    // Execute the SQL statement with the prepared bind parameters
    const result = await commonFunction.functionInsert(sql, bindParameters);
    return result;
  } catch (error: any) {
    console.error("Error occurred during insertion:", error);
    throw new Error(`Error inserting data: ${error.message}`);
  }
};

export const updateOrganization = async (
  orgCode: string,
  updatedDetails: Partial<Organization>,
  modifyUserId: string
): Promise<any> => {
  try {
    const updates: string[] = [];
    const binds: { [key: string]: any } = { IICSAAB_ORGN_CODE: orgCode };

    // Add modifyUserId and modifyDate to updates
    updatedDetails.MODIFY_USER = modifyUserId;
    updatedDetails.MODIFY_DATE = new Date();

    for (const key in updatedDetails) {
      if (updatedDetails[key as keyof Organization] !== undefined) {
        // Construct the SQL update statements with the IICSAAB_ prefix
        updates.push(`IICSAAB_${key} = :IICSAAB_${key}`);
        binds[`IICSAAB_${key}`] = updatedDetails[key as keyof Organization];
      }
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Construct the SQL UPDATE statement with the IICSAAB_ prefix
    const sql = `UPDATE IICSAAB_ORGN_MASTER SET ${updates.join(
      ", "
    )} WHERE IICSAAB_ORGN_CODE = :IICSAAB_ORGN_CODE`;

    // Execute the SQL statement with the prepared binds
    const result = await commonFunction.functionUpdate(sql, binds);
    return result;
  } catch (error: any) {
    console.error("Error updating organization:", error.message);
    throw new Error(`Error updating organization: ${error.message}`);
  }
};
