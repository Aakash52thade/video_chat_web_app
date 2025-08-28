


# Video Chat Web App - Project Overview

This is a comprehensive **video chat web application** with social networking features, designed for language learning and communication. The project follows a full-stack architecture with separate frontend and backend components.

## Tech Stack

### Frontend
- **React 19.1.0** with **Vite** as the build tool [1](#0-0) 
- **TailwindCSS** for styling with **DaisyUI** components [2](#0-1) 
- **React Router** for navigation [3](#0-2) 
- **Zustand** for state management [4](#0-3) 
- **React Query (@tanstack/react-query)** for server state management [5](#0-4) 

### Backend
- **Node.js** with **Express.js** framework [6](#0-5) 
- **MongoDB** with **Mongoose** ODM [7](#0-6) 
- **bcryptjs** for password hashing [8](#0-7) 
- **Cookie-based authentication** with JWT [9](#0-8) 
- **CORS** enabled for cross-origin requests [10](#0-9) 

### Communication Services
- **Stream.io Video SDK** for video calling functionality [11](#0-10) 
- **Stream Chat SDK** for real-time messaging [12](#0-11) 

## Core Functionality

### Authentication System
- **User Registration & Login** with email/password [13](#0-12) 
- **User Onboarding** process for profile completion [14](#0-13) 
- **Protected routes** with authentication middleware [15](#0-14) 

### User Management
- **User Profile System** with language learning focus, including native language, learning language, bio, and location [16](#0-15) 
- **Friend System** with friend requests and connections [17](#0-16) 
- **User Recommendations** for discovering new connections [18](#0-17) 

### Social Features
- **Send & Accept Friend Requests** [19](#0-18) 
- **Friend Request Management** (incoming and outgoing) [20](#0-19) 
- **Notifications System** for friend requests and updates [21](#0-20) 

### Communication Features
- **Real-time Video Calling** using Stream.io Video SDK [22](#0-21) 
- **Real-time Text Messaging** with Stream Chat integration [23](#0-22) 
- **Stream Token Authentication** for secure communication [24](#0-23) 

### Application Pages
The application includes several key pages:
- **Home Page** with main dashboard
- **Friends Page** for managing connections
- **Chat Pages** for individual conversations
- **Call Pages** for video communication
- **Onboarding Page** for profile setup [25](#0-24) 

### UI/UX Features
- **Theme Support** with theme store management [26](#0-25) 
- **Toast Notifications** for user feedback [27](#0-26) 
- **Responsive Layout** with conditional sidebar [28](#0-27) 

## Notes

This project appears to be specifically designed for language learning and cultural exchange, as evidenced by the user model including native and learning language fields. The application combines video calling, text messaging, and social networking features to create a comprehensive communication platform. The use of Stream.io services provides professional-grade video and chat capabilities, while the custom backend handles user management and friend relationships. The frontend is built with modern React patterns and includes proper authentication flows and protected routing.
