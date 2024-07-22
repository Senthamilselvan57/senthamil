import { Request, Response, NextFunction } from "express";
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

import {
  selectAllOrganizations,
  selectOrganizationByCode,
  insertOrganization,
  updateOrganization,
  Organization,
} from "../../../models/IICSAA/orgnMaster";
import { stat } from "fs";

// Get all organizations
export const getAllOrganizations = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const result = await selectAllOrganizations();
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error getting all organizations:", error);
      throw { status: 500, message: error.message };
    }
  }
);

// Get an organization by code
export const getOrganizationByCode = asyncHandler(
  async (req: Request, res: Response) => {
    const orgCode = req.params.orgCode;
    try {
      const result = await selectOrganizationByCode(orgCode);
      if (result.length === 0) {
        // Check if result is an empty array
        throw { status: 404, message: "No data found" };
      }
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error getting organization by code:", error);
      const status = error.status || 500;
      throw { status, message: error.message };
    }
  }
);

// Insert a new organization
export const createOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const data: Organization = req.body;
    try {
      const result = await insertOrganization(data);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating organization:", error);

      // Check for specific error message
      if (error.message.includes("Missing mandatory field")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }
);
// Update an organization by code
export const updateOrganizationByCode = asyncHandler(
  async (req: Request, res: Response) => {
    const orgCode = req.params.orgCode;
    const updatedDetails: Partial<Organization> = req.body;

    // Use the orgCode from params as the MODIFY_USER
    const modifyUserId = req.body.MODIFY_USER || "defaultUser"; // Adjust based on your logic for MODIFY_USER

    try {
      const result = await updateOrganization(
        orgCode,
        updatedDetails,
        modifyUserId
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: error.message });
    }
  }
);
