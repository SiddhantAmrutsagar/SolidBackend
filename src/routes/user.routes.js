import {Router} from 'express';
import {registerUser, 
        loginUser, 
        logoutUser, 
        refreshAccessToken, 
        updateUserAvatar, 
        updateAccountDetails, 
        getCurrentUser, 
        changeCurrentPassword, 
        updateUserCoverImage, 
        getUserChannelProfile, 
        getWatchHistory} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    //middleware which first upload the files to cloudinary then allow to save the data in database
    //upload.fields() is used when you're uploading multiple fields with different names (avatar and coverImage).
    //when this route is hit the upload middleware will do the file uploading process first then the registerUser function will be called
    
    //this is how files is selected and uploaded to local storage
    upload.fields([
        { 
            name: "avatar",
            maxCount: 1
        },
        { 
            name: "coverImage",
            maxCount: 1
        }                                            
    ]),
    registerUser
);
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, updateAccountDetails)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/update-Avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/upadate-coverImage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route("/c/:username").get(
    verifyJWT,
    getUserChannelProfile
)

router.route("/watchHistory").get(
    verifyJWT, 
    getWatchHistory
)

export default router