import express from "express";

import { protectRoute} from "../middleware/auth.middleware.js";
import {getRecommendedUsers,
       getMyFriends,
       sendFriendRequest, 
       acceptFriendRequest,
       getFriendRequests,
       getOutgoingFriendReqs,
    } 
       from "../controllers/user.controller.js"

const router = express.Router();

//apply auth middleware to all route ==> meanes.. whenever we go any of this route
//                 it will check route is protected or not;
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

//friend request
router.post("/friend-request/:id", sendFriendRequest);
//accept friend request;
router.put("/friend-request/:id/accept", acceptFriendRequest)

//reject friendRequest;


router.get("/friend-request", getFriendRequests);
router.get("/outgoing-friend-request", getOutgoingFriendReqs);

export default router;