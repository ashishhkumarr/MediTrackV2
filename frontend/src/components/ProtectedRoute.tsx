import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../context/AuthContext";

interface Props {
  children: JSX.Element;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
