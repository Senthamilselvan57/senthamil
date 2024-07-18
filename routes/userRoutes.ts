import { Router } from 'express';
import { getUser, createUser, updateUserDetails } from '../controller/userMasterController';

const router = Router();

router.route('/v0/user')
  .post(createUser)
  

router.route('/v0/user/:userId')
  .get(getUser)
  .put(updateUserDetails);
 
export default router;
