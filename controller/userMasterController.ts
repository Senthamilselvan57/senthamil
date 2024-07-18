import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { selectUser,  updateUser, insertData } from '../../../models/IICSAA/userMaster';


export const getUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const result = await selectUser(userId);
      res.status(200).json({ status: true, data: result });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      next({ status: 500, message: 'Internal server error' });
    }
  });



  export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, name, email, mobileNumber, sex, maritalStatus, address, aadharNo } = req.body;
      const entryUser = userId; // Assuming user ID is used as entry user
      const entryDate = new Date(); // Assuming current date/time as entry date
  
      const userData = {
        IICSAAK_USER_ID: userId,
        IICSAAK_USER_NAME: name,
        IICSAAK_USER_EMAIL: email,
        IICSAAK_PRIM_MOBILE_NO: mobileNumber,
        IICSAAK_SEX: sex,
        IICSAAK_ENTRY_USER: entryUser,
        IICSAAK_ENTRY_DATE: entryDate,
        IICSAAK_MARITAL_STATUS: maritalStatus,
        IICSAAK_ADDRESS: address,
        IICSAAK_AADHAR_NO: aadharNo,
      };
  
      const result = await insertData(userData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating user:', error.message);
      next({ status: 400, message: error.message });
    }
  };
  
  export const updateUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const { name, email, mobileNumber, sex, maritalStatus, address, aadharNo } = req.body;
      const modifierUser = userId; // Assuming user ID is used as modifier user
      const modifyDate = new Date(); // Assuming current date/time as modify date
  
      const userDataToUpdate = {
        IICSAAK_USER_ID: userId,
        IICSAAK_USER_NAME: name,
        IICSAAK_USER_EMAIL: email,
        IICSAAK_PRIM_MOBILE_NO: mobileNumber,
        IICSAAK_SEX: sex,
        IICSAAK_MODIFY_USER: modifierUser,
        IICSAAK_MODIFY_DATE: modifyDate,
        IICSAAK_MARITAL_STATUS: maritalStatus,
        IICSAAK_ADDRESS: address,
        IICSAAK_AADHAR_NO: aadharNo,
      };
  
      const result = await updateUser(userDataToUpdate);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      next({ status: 400, message: error.message });
    }
  };