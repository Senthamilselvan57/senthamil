import { Router } from "express";
import {
  getAllOrganizations,
  getOrganizationByCode,
  createOrganization,
  updateOrganizationByCode,
} from "../controller/orgnMasterController";

const router = Router();

// Route to get all organizations
router.route("/orgnmaster").get(getAllOrganizations);

// Route to get an organization by code
router.route("/orgnmaster/:orgCode").get(getOrganizationByCode);

// Route to create a new organization
router.route("/orgnmaster").post(createOrganization);

// Route to update an organization by code
router.route("/orgnmaster/:orgCode").put(updateOrganizationByCode);

export default router;
