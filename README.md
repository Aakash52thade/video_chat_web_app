


# Video Chat Web App - Project Overview

This is a comprehensive **video chat web application** with social networking features, designed for language learning and communication. The project follows a full-stack architecture with separate frontend and backend components.

## Tech Stack

### Frontend
- **React 19.1.0** with **Vite** as the build tool
- **TailwindCSS** for styling with **DaisyUI** components 
- **React Router** for navigation
- **Zustand** for state management  
- **React Query (@tanstack/react-query)** for server state management

### Backend
- **Node.js** with **Express.js** framework 
- **MongoDB** with **Mongoose** ODM 
- **bcryptjs** for password hashing 
- **Cookie-based authentication** with JWT 
- **CORS** enabled for cross-origin requests 

### Communication Services
- **Stream.io Video SDK** for video calling functionality 
- **Stream Chat SDK** for real-time messaging 

## Core Functionality

### Authentication System
- **User Registration & Login** with email/password
- **User Onboarding** process for profile completion 
- **Protected routes** with authentication middleware

### User Management
- **User Profile System** with language learning focus, including native language, learning language, bio, and location [16](#0-15) 
- **Friend System** with friend requests and connections
- **User Recommendations** for discovering new connections 

### Social Features
- **Send & Accept Friend Requests** 
- **Friend Request Management** (incoming and outgoing)
- **Notifications System** for friend requests and updates 

### Communication Features
- **Real-time Video Calling** using Stream.io Video SDK
- **Real-time Text Messaging** with Stream Chat integration 
- **Stream Token Authentication** for secure communication 

### Application Pages
The application includes several key pages:
- **Home Page** with main dashboard
- **Friends Page** for managing connections
- **Chat Pages** for individual conversations
- **Call Pages** for video communication
- **Onboarding Page** for profile setup 

### UI/UX Features
- **Theme Support** with theme store management 
- **Toast Notifications** for user feedback 
- **Responsive Layout** with conditional sidebar

## Notes

This project appears to be specifically designed for language learning and cultural exchange, as evidenced by the user model including native and learning language fields. The application combines video calling, text messaging, and social networking features to create a comprehensive communication platform. The use of Stream.io services provides professional-grade video and chat capabilities, while the custom backend handles user management and friend relationships. The frontend is built with modern React patterns and includes proper authentication flows and protected routing.
