import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useThemeStore } from "../store/useThemeStore"; // Add this import

const Layout = ({children, showSider=false}) => {
  const { theme } = useThemeStore(); // Add this line

  return (
    <div className='min-h-screen' data-theme={theme}> {/* Add data-theme={theme} */}
      <div className='flex'>
        {showSider && <Sidebar />}

        <div className='flex-1 overflow-y-auto'>
            <Navbar />
            {children}
        </div>
      </div>
    </div>
  )
}

export default Layout