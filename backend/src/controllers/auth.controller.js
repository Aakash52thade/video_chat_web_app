//here we right all auth functionality;

import User from "../models/User.js"; 
import jwt from "jsonwebtoken";
import {upsertStreamUser} from "../lib/stream.js";


export async function signup(req, res) {
    //get the value form schema and de-structure here
    const {email, password, fullName} = req.body;

    try {
        if(!password || !email || !fullName){
            return res.status(400).json({message: "All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
        }  

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "Email already exists, please use a different one"});
        }

        const idx = Math.floor(Math.random() * 100) + 1; // genrate number between 1 - 100;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`


       const newUser = await User.create({
            email,
            fullName,
            password,
            profilePic: randomAvatar,
        });

        //Todo: CREATE THE USER IN STREAM AS WELL
        try {
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.profilePic || ""
            });
            console.log(`Stream user created from ${newUser.fullName}`)
        } catch (error) {
            console.log("Error creating Stream user:", error);
        }


        //now we create JWT TOKEN for new user;
        const token = jwt.sign({user: newUser._id}, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d"
        })

        res.cookie("jwt", token, {
            maxAge : 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, //prevent XSS attacks,
            sameSite: "strict", // Prevent CSRF attacks
            secure: process.env.NODE_ENV === "production",
        })

        res.status(201).json({
            success: true,
            user:newUser,
        })


        
    } catch (error) {
        console.log("Erro is signup controller", error);
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

export async function login(req, res) {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "Invalid email are required"});
        }
        
        // 1st.  check email is present in User_database if not invalid
        const user = await User.findOne({email});
        if(!user) return res.status(401).json({message: "Invalid email or password"});

        //2nd:  here we compare new password, and the set password during signup. if not matched then invalied;
        const isPasswordCorrect = await user.matchPassword(password)
        if(!isPasswordCorrect) return res.status(401).json({message: "Invalid email or password"});

        const token = jwt.sign({user: user._id}, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d"
        })

        res.cookie("jwt", token, {
            maxAge : 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, //prevent XSS attacks,
            sameSite: "strict", // Prevent CSRF attacks
            secure: process.env.NODE_ENV === "production",
        })

          res.status(200).json({
            success: true,
            user,
            token
        })
    


    } catch (error) {
        console.log("Erro is login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

export  function logout(req, res) {
    res.clearCookie("jwt");
    res.status(200).json({success: true, message: "Logout successful"});
}

export async function onboard(req, res) {
  try {
     const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    // TODO: update this in stream

     const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
        await upsertStreamUser({
            id: updatedUser._id.toString(),
            name: updatedUser.fullName,
            image: updatedUser.profilePic || "",
        });
        console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (error) {
        console.log("Error updating Stream user during onboarding:", streamError.message);
    }


    res.status(200).json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("OnBoarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


