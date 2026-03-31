import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "stream-chat-react/dist/css/v2/index.css";

import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// NEW — add this one import
import { SocketProvider } from './context/SocketContext.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>

        {/* NEW — wrap App with SocketProvider */}
        {/* SocketProvider MUST be inside QueryClientProvider     */}
        {/* because SocketContext uses useAuthUser()              */}
        {/* and useAuthUser() uses React Query internally         */}
        {/* If you put SocketProvider OUTSIDE, useAuthUser breaks */}
        <SocketProvider>
          <App />
        </SocketProvider>

      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)