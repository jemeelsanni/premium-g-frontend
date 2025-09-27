/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/AuthTestPanel.tsx - For debugging
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const AuthTestPanel = () => {
    const { login, logout, user, isAuthenticated, error } = useAuthStore();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [loading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testLogin = async () => {
        setLoading(true);
        try {
            addResult(`Attempting login with ${username}...`);
            await login(username, password);
            addResult('✅ Login successful!');
        } catch (error: any) {
            addResult(`❌ Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testLogout = async () => {
        try {
            addResult('Attempting logout...');
            await logout();
            addResult('✅ Logout successful!');
        } catch (error: any) {
            addResult(`❌ Logout failed: ${error.message}`);
        }
    };

    const testToken = async () => {
        const token = localStorage.getItem('token');
        addResult(`Token in localStorage: ${token ? 'Present' : 'Missing'}`);

        if (token) {
            try {
                // Test API call with token
                const response = await fetch('/api/v1/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    addResult(`✅ /auth/me API call successful: ${JSON.stringify(data.data)}`);
                } else {
                    const errorData = await response.json();
                    addResult(`❌ /auth/me API call failed: ${response.status} - ${errorData.message}`);
                }
            } catch (error: any) {
                addResult(`❌ /auth/me API call error: ${error.message}`);
            }
        }
    };

    const clearResults = () => setTestResults([]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">🔧 Authentication Debug Panel</h3>

            {/* Current Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
                <p><strong>Authentication Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
                <p><strong>User:</strong> {user?.username || 'None'}</p>
                <p><strong>Role:</strong> {user?.role || 'None'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
            </div>

            {/* Login Form */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                />
                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin123"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <Button onClick={testLogin} loading={loading} disabled={loading}>
                    Test Login
                </Button>
                <Button onClick={testLogout} variant="outline">
                    Test Logout
                </Button>
                <Button onClick={testToken} variant="outline">
                    Test Token API
                </Button>
                <Button onClick={clearResults} variant="outline">
                    Clear Results
                </Button>
            </div>

            {/* Test Results */}
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
                <div className="text-white mb-2">Test Results:</div>
                {testResults.length === 0 ? (
                    <div className="text-gray-500">No test results yet...</div>
                ) : (
                    testResults.map((result, index) => (
                        <div key={index} className="mb-1">{result}</div>
                    ))
                )}
            </div>

            {/* Backend Setup Instructions */}
            <div className="mt-4 text-sm text-gray-600">
                <p><strong>Backend Setup Required:</strong></p>
                <ol className="list-decimal list-inside">
                    <li>Add the /auth/me endpoint to routes/auth.js</li>
                    <li>Run the test user setup script</li>
                    <li>Ensure backend is running on port 5000</li>
                </ol>
            </div>
        </div>
    );
};