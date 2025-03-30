import React from "react";
import { motion } from "framer-motion";
import {
  FiHome,
  FiFolder,
  FiMail,
  FiCalendar,
  FiCloud,
  FiSettings,
  FiMenu,
  FiX,
} from "react-icons/fi";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  text,
  isActive = false,
  onClick,
}) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
          isActive
            ? "bg-primary-100 text-primary-700"
            : "hover:bg-secondary-100 text-secondary-600 hover:text-secondary-800"
        }`}
      >
        <span className="text-xl mr-3">{icon}</span>
        <span className="font-medium">{text}</span>
      </button>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  isOpen,
  toggleSidebar,
}) => {
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? "closed" : "open"}
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 h-full glass-panel border-r border-gray-200 z-30 
                   ${isMobile ? "w-[280px]" : "w-[280px]"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-primary-700 flex items-center">
            <span className="bg-primary-500 text-white p-1 rounded mr-2">
              AI
            </span>
            Personal Assistant
          </h1>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <FiX className="text-secondary-500" />
            </button>
          )}
        </div>

        <nav className="p-4">
          <h2 className="text-xs uppercase font-semibold text-secondary-400 mb-3 ml-2">
            Main
          </h2>
          <ul className="space-y-1">
            <NavItem icon={<FiHome />} text="Home" isActive />
            <NavItem icon={<FiFolder />} text="Files" />
            <NavItem icon={<FiMail />} text="Email" />
            <NavItem icon={<FiCalendar />} text="Calendar" />
            <NavItem icon={<FiCloud />} text="Cloud Storage" />
          </ul>

          <h2 className="text-xs uppercase font-semibold text-secondary-400 mb-3 ml-2 mt-8">
            Settings
          </h2>
          <ul className="space-y-1">
            <NavItem icon={<FiSettings />} text="Settings" />
          </ul>
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="bg-primary-50 p-4 rounded-xl">
            <p className="text-sm text-primary-700 font-medium">Need help?</p>
            <p className="text-xs text-primary-600 mt-1">
              Check our documentation to learn more about integrating with your
              services.
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-4 p-3 bg-white rounded-full shadow-soft z-20"
        >
          <FiMenu className="text-secondary-700" />
        </button>
      )}
    </>
  );
};

export default Sidebar;
