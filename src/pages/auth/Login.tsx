/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
// import { Package } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const from = location.state?.from?.pathname || '/dashboard';

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            // ✅ Pass username and password separately
            await login(data.username, data.password);
            navigate(from, { replace: true });
        } catch (error: any) {
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto flex items-center justify-center">

                        <img src={logo} alt="Logo" className="w-48 h-48" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Premium G Brands
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Username"
                            {...form.register('username')}
                            error={form.formState.errors.username?.message}
                            autoComplete="username"
                        />

                        <Input
                            label="Password"
                            type="password"
                            {...form.register('password')}
                            error={form.formState.errors.password?.message}
                            autoComplete="current-password"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        Sign in
                    </Button>
                </form>
            </div>
        </div>
    );
};
