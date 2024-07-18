const commonFunction = require("../../utils/commonFunction");

interface OrgnMaster {
  IICSAAB_ORGN_CODE: string;
  IICSAAB_ORGN_NAME: string;
  IICSAAB_ORGN_TYPE_CODE?: string;
  IICSAAB_GROUP_CODE?: string;
  IICSAAB_SUB_GROUP_CODE?: string;
  IICSAAB_LOGO_CODE?: string;
  IICSAAB_ENTRY_USER?: string;
  IICSAAB_ENTRY_DATE?: string;
  IICSAAB_MODIFY_USER?: string;
  IICSAAB_MODIFY_DATE?: string;
  TO_DATE?: string | null;
}

  export const selectOrgn = async (orgnCode: string) => {
    try {
      const sql = "SELECT * FROM IICSAAB_ORGN_MASTER WHERE IICSAAB_ORGN_CODE = :orgnCode AND TO_DATE IS NULL";
      const binds = { orgnCode };
      const result = await commonFunction.functionSelect(sql, binds);
      return result;
    } catch (error: any) {
      console.error("Error fetching organization:", error.message);
      throw new Error(`Error fetching organization: ${error.message}`);
    }
  };
  
  export const insertOrgn = async (data: OrgnMaster) => {
    try {
      // Check for mandatory fields
      const requiredFields: (keyof OrgnMaster)[] = [
       
      ];
  
      for (const field of requiredFields) {
        if (!data[field]) {
          throw new Error(`${field.split('_').pop()} is missing`);
        }
      }
    // Construct INSERT SQL statement
      const columns = Object.keys(data).join(', ');
      const values = Object.keys(data).map((key) => `:${key}`).join(', ');
      const sql = `INSERT INTO IICSAAB_ORGN_MASTER (${columns}) VALUES (${values})`;
  
      const result = await commonFunction.functionInsert(sql, data);
      return result;
    } catch (error: any) {
      if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === '23503') {
        let errorMessage = 'Foreign key constraint violation: ';
  
        // Extract the foreign key field from the error message
        const match = error.sqlMessage.match(/foreign key constraint fails \(`.*\.(.*)`\)/i);
        if (match && match.length > 1) {
          const foreignKeyField = match[1] as keyof OrgnMaster;
          errorMessage += `${foreignKeyField.split('_').pop()} '${data[foreignKeyField]}' does not exist.`;
        } else {
          errorMessage += 'One or more foreign key constraints violated.';
        }
  
        throw new Error(errorMessage);
      } else {
        console.error('Error occurred during insertion:', error);
        throw new Error(`Error inserting data: ${error.message}`);
      }
    }
  };
  export const updateOrgn = async (data: OrgnMaster) => {
    try {
      const updates: string[] = [];
      const binds: { [key: string]: any } = {
        IICSAAB_ORGN_CODE: data.IICSAAB_ORGN_CODE,
      };
  
      for (const key in data) {
        if (key !== 'IICSAAB_ORGN_CODE' && !key.startsWith('IICSAAB_ORGN_TYPE_CODE') && !key.startsWith('IICSAAB_GROUP_CODE') && !key.startsWith('IICSAAB_SUB_GROUP_CODE') && !key.startsWith('IICSAAB_LOGO_CODE') && data[key as keyof OrgnMaster] !== undefined) {
          updates.push(`${key} = :${key}`);
          binds[key] = data[key as keyof OrgnMaster];
        }
      }
  
      const sql = `UPDATE IICSAAB_ORGN_MASTER SET ${updates.join(', ')} WHERE IICSAAB_ORGN_CODE = :IICSAAB_ORGN_CODE`;
      const result = await commonFunction.functionUpdate(sql, binds);
      return result;
    } catch (error: any) {
      console.error("Error updating organization:", error.message);
      throw new Error(`Error updating organization: ${error.message}`);
    }
  };