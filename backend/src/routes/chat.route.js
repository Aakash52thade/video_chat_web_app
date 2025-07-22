import express from 'express';

import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken } from "../controllers/chat.controller.js";

const router = express.Router();


//in this route we genrate Stream Token
// That help Steam to get authenticate the user's
router.get("/token", protectRoute, getStreamToken);

export default router;