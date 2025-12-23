import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  LifebuoyIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/Button";

const navBase = "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const iconClass = "h-4 w-4";
  const links = [
    { to: "/admin", label: "Dashboard", icon: <LifebuoyIcon className={iconClass} /> },
    { to: "/patients", label: "Patients", icon: <UserGroupIcon className={iconClass} /> },
    { to: "/appointments", label: "Appointments", icon: <CalendarDaysIcon className={iconClass} /> },
    {
      to: "/appointments/create",
      label: "New Appointment",
      icon: <ClipboardDocumentListIcon className={iconClass} />
    }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold text-brand">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand">
            <LifebuoyIcon className="h-5 w-5" />
          </div>
          MediTrack
        </NavLink>
        {user ? (
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1 rounded-2xl bg-surface-subtle px-2 py-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `${navBase} flex items-center gap-2 ${
                      isActive
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-brand"
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile/edit"
                className={({ isActive }) =>
                  `${navBase} flex items-center gap-2 ${
                    isActive
                      ? "bg-white text-brand shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-brand"
                  }`
                }
              >
                Profile
              </NavLink>
            </nav>
            <Button variant="secondary" onClick={handleLogout} className="gap-2">
              <ArrowRightOnRectangleIcon className={iconClass} />
              Logout
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate("/login")} variant="primary">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
