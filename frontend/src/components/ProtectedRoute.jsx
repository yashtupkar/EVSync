import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUser,
} from "../features/auth/authSelectors";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  if (!isAuthenticated) {
    // Intelligent redirection based on required roles
    if (allowedRoles?.includes('admin')) return <Navigate to="/admin-login" replace />;
    if (allowedRoles?.includes('station_owner')) return <Navigate to="/owner-login" replace />;
    if (allowedRoles?.includes('operator')) return <Navigate to="/operator-login" replace />;
    return <Navigate to="/login" replace />;
  }


  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
