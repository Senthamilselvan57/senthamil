import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
} from "../controller/userMasterController";

const router = Router();

// Route to create a new user
router.post("/v0/user", createUser);

// Route to get all users
router.get("/v0/user", getAllUsers);

// Route to get a user by ID and update a user by ID
router
  .route("/v0/user/:userId")
  .get(getUserById) // Route to get a user by ID
  .put(updateUserById); // Route to update a user by ID

export default router;
