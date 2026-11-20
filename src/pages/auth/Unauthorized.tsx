import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Unauthorized = () => {
    const { isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
                <ShieldOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-900">No access</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Your role doesn&apos;t have any modules enabled yet. Ask the Managing
                    Director to grant permissions in Admin → Role Permissions.
                </p>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Log out
                </button>
            </div>
        </div>
    );
};
