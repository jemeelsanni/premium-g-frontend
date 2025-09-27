import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                    <ShieldX className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Access Denied
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    You don't have permission to access this page.
                </p>
                <div className="mt-6">
                    <Button onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};
