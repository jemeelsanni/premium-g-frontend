import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { AppModule, useModuleAccess } from '../utils/permissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Module gate driven by the role-permissions config. */
    module?: AppModule;
    /** Hard role gate (use only for things that must not be configurable). */
    allowedRoles?: UserRole[];
}

export const PermissionsLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
);

export const ProtectedRoute = ({ children, module, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuthStore();
    const { loaded, canAccess, homeRoute } = useModuleAccess();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Wait for the permissions config so we don't decide on stale fallbacks.
    if (!loaded) {
        return <PermissionsLoading />;
    }

    const roleBlocked = allowedRoles && user && !allowedRoles.includes(user.role);
    const moduleBlocked = module && !canAccess(module);

    if (roleBlocked || moduleBlocked) {
        // Send them to a page they *can* open, not back to login.
        return <Navigate to={homeRoute} replace />;
    }

    return <>{children}</>;
};

/** Redirects "/" and unknown paths to the user's first accessible module. */
export const HomeRedirect = () => {
    const { isAuthenticated } = useAuthStore();
    const { loaded, homeRoute } = useModuleAccess();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!loaded) return <PermissionsLoading />;
    return <Navigate to={homeRoute} replace />;
};
