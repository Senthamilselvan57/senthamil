const commonFunction = require('../../../utils/commonFunction');



export const checkUserExists = async (identifier: string): Promise<boolean> => {
  try {
    const userExistsSql = `
      SELECT COUNT(*) AS userCount
      FROM IICSAAK_USER_MASTER
      WHERE IICSAAK_USER_ID = :identifier OR IICSAAK_PRIM_MOBILE_NO = :identifier
    `;
    const userExistsBind = { identifier };
    const userResult = await commonFunction.functionSelect(userExistsSql, userExistsBind);

    return userResult && userResult.length > 0 && userResult[0].USERCOUNT > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
};

export const getUserIdOrMobile = async (identifier: string): Promise<{ userId: string | null, mobileNumber: string | null }> => {
  try {
    let query = '';
    let bindParams = {};

    if (/^\d{10}$/.test(identifier)) {
      // Identifier is a mobile number
      query = `
        SELECT IICSAAK_USER_ID, IICSAAK_PRIM_MOBILE_NO
        FROM IICSAAK_USER_MASTER
        WHERE IICSAAK_PRIM_MOBILE_NO = :identifier
      `;
      bindParams = { identifier };
    } else {
      // Identifier is a user ID
      query = `
        SELECT IICSAAK_USER_ID, IICSAAK_PRIM_MOBILE_NO
        FROM IICSAAK_USER_MASTER
        WHERE IICSAAK_USER_ID = :identifier
      `;
      bindParams = { identifier };
    }

    const result = await commonFunction.functionSelect(query, bindParams);

    if (result && result.length > 0) {
      return {
        userId: result[0].IICSAAK_USER_ID,
        mobileNumber: result[0].IICSAAK_PRIM_MOBILE_NO,
      };
    } else {
      return {
        userId: null,
        mobileNumber: null,
      };
    }
  } catch (error) {
    console.error('Error fetching user ID or mobile number:', error);
    throw error;
  }
};
