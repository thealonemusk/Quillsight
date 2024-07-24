import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {User} from "../models/user.models.js";
import jwt from "jsonwebtoken";


const genrateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const ser = await User.findById(userId);
        const accessToken = ser.genrateAccessToken();
        const refreshToken = ser.genrateRefreshToken();
        ser.refreshToken = refreshToken;
        ser.save({ validateBeforeSave: false }); 
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(420, "You are not authorised");
    }
};

const registerUser = asyncHandler(async(req,res)=>{
    try {
        const { fullname, username , password , email } = req.body
        console.log("request",req.body)
        if (
            [fullname , username , password , email].some((field) => field?.trim()=== "")
            ) {
                throw new ApiError(400,"ALL feild are required")
            }
        const existeduser = await User.findOne({
            $or: [{username},{email}]
            })
        if(existeduser){
                throw new ApiError(409,"user exsisit")
            }
        let imageLocalPath;
    
        if (req.file){
            imageLocalPath = req.file.path;
        }  
        const imageUrl = await uploadOnCloudinary(imageLocalPath, "Profile photo");
        console.log(imageUrl); 
        
        const newUser = await User.create({
            fullname,
            username,
            password,
            email,
            avtar:imageUrl?.url || "",
        })

        return res.status(200).json(
            new ApiResponse(200,"New User Created",newUser)
        )
    } catch (error) {
        console.log(error.message)
        throw new ApiError(400,`${error.message}`)
    }
})
const loginUser = asyncHandler(async(req,res)=>{
    try {
        const {email , password} = req.body
        console.log(req.body)
        if (email.trim() === "" || password.trim() === "") {
            throw new ApiError(400,"All feild are required")
            }
            console.log("1")
        const user = await User.findOne({email})
        console.log("2")
        if(!user){
            throw new ApiError(400,"User not found")
            }
            console.log("3")
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!(isPasswordValid)){
            throw new ApiError(405, "invalid credential")
            }
            console.log("3")
        const {accessToken, refreshToken} = await genrateAccessTokenAndRefreshToken(user._id)
        console.log("4")    
        const loggedUser = await User.findById(user._id).select("-password -refreshToken")
        console.log(loggedUser)
        const options = {
            httpOnly : true ,
            secure : true
        }
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
              200, 
              {
                  loggedUser : loggedUser,
                  accessToken : accessToken,
                  refreshToken : refreshToken
              },
              "User logged In Successfully"
          )
      )
    }    
  catch (error) {
        console.log(error.message)
        throw new ApiError(400,`${error.message}`)   
    }
})
const logOutUser = asyncHandler(async(req,res)=>{
    // chek form miidle ware is user looged in 
    await User.findByIdAndUpdate(
       req.theUser._id,
       {
           $unset:{
               refreshToken : 1
           }
       }, 
           {
               new : true
           }
    )
    const options = {
       httpOnly: true,
       secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "Admin logged Out"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            User : req.theUser
        },
        "User Details Fetched Succesfully"
    ))
})
export {registerUser,
        loginUser,
        logOutUser,
        getCurrentUser
       }
