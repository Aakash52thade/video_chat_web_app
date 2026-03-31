import {Navigate, Route, Routes} from "react-router";

import HomePage from "./pages/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import OnboardingPage from "./pages/OnboardingPage"
import CallPage from "./pages/CallPage"
import ChatPage from "./pages/ChatPage.jsx"
import NotificationsPage from "./pages/NotificationsPage"
import PageLoader from "./components/PageLoader.jsx"
import FriendsPage from "./pages/FriendsPage.jsx"

// ── NEW IMPORTS ──────────────────────────────────────────────
import WebRTCCallPage from "./pages/WebRTCCallPage.jsx"
import IncomingCallModal from "./components/IncomingCallModal.jsx"
// ─────────────────────────────────────────────────────────────

import {useThemeStore} from "./store/useThemeStore.js"
import {Toaster} from 'react-hot-toast'
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";


const App = () => {
 
  const {isLoading, authUser} = useAuthUser();
  const {theme} = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  if(isLoading) return <PageLoader/>

  return (
    <>    
     <div className="h-screen" data-theme={theme}>
        <Routes>

          {/* ── All your existing routes — UNTOUCHED ────────── */}
          <Route path="/" element={isAuthenticated && isOnboarded ? (
                <Layout showSider={true}>                 
                  <HomePage />
                </Layout>
          ) : (
               <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
          )} />

          <Route path="/signup" element={!isAuthenticated ? <SignUpPage/> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />} />
          
          <Route path="/login" element={!isAuthenticated ? <LoginPage/> : <Navigate to={isOnboarded ? '/' :"/onboarding"} />} />
          
          <Route
            path="/onboarding"
            element={isAuthenticated ? (
              !isOnboarded 
              ? <OnboardingPage/> 
              : <Navigate to="/" />
            ) : <Navigate to="/login" />} 
          />

          <Route
            path="/call/:id"
            element={isAuthenticated && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )} 
          />

          <Route path="/chat/:id" element={
            isAuthenticated && isOnboarded ? (
              <Layout>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          } />
          
          <Route
            path="/Notifications"
            element={isAuthenticated && isOnboarded ? (
              <Layout showSider={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )} 
          />

          <Route 
            path="/friends" 
            element={isAuthenticated && isOnboarded ? (
              <Layout showSider={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )} 
          />

          {/* ── NEW ROUTE: WebRTC direct video call ──────────── */}
          {/* Sits alongside /call/:id (your existing Stream call) */}
          {/* /call/:id        → Stream video (existing, untouched) */}
          {/* /webrtc-call/:roomId → our new WebRTC call           */}
          <Route
            path="/webrtc-call/:roomId"
            element={isAuthenticated && isOnboarded ? (
              <WebRTCCallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )} 
          />
          {/* ─────────────────────────────────────────────────── */}

        </Routes>

        {/* ── NEW: Incoming call popup ─────────────────────────
            Placed OUTSIDE <Routes> so it renders on top of 
            ANY page when someone calls you.
            If it were inside a route, it would only show on that 
            specific page — you'd miss calls on other pages.       */}
        <IncomingCallModal />
        {/* ───────────────────────────────────────────────────── */}

        <Toaster position="top-center" reverseOrder={false} />

     </div>
    </>
  )
}

export default App