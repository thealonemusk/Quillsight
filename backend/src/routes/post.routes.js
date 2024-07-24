import { Router } from "express";
import { authVerify } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { addPost, deletePost, editPost, getAllUpdate, getCreatedPost, getSavedUpdate } from "../controllers/posts.controllers.js";

const router = Router()
router.route("/addPost").post(authVerify,upload.single("image"),addPost)
router.route("/getyourpost").get(authVerify,getCreatedPost)
router.route("/getAllPost").get(authVerify,getAllUpdate)
router.route("/likedpost").get(authVerify,getSavedUpdate)
router.route("/editPost").post(authVerify,upload.single("image"),editPost)
router.route("/deletePost").post(authVerify,deletePost)


export default router