import { Request, Response, NextFunction } from "express";

export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

import {
  selectAllUsers,
  selectUserById,
  insertUser,
  updateUser,
  UserDetails,
} from "../../../models/IICSAA/userMaster";

// Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await selectAllUsers();
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error getting all users:", error);
    throw { status: 500, message: error.message };
  }
});

// Get a user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  try {
    const result = await selectUserById(userId);
    if (result.length === 0) {
      // Check if result is an empty array
      throw { status: 404, message: "No data found" };
    }
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error getting user by ID:", error);
    const status = error.status || 500;
    throw { status, message: error.message };
  }
});

// Insert a new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data: UserDetails = req.body;
  try {
    const result = await insertUser(data);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Check for specific error message
    if (error.message.includes("Missing mandatory field")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

export const updateUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const updatedDetails: Partial<UserDetails> = req.body;

    // Use the userId from params as the MODIFY_USER
    const modifyUserId = userId;

    try {
      const result = await updateUser(modifyUserId, updatedDetails);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message });
    }
  }
);
