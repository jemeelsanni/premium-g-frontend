import { Navigate } from 'react-router-dom';

export const Unauthorized = () => {
    return <Navigate to="/login" replace />;
};
