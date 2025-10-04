/* eslint-disable no-case-declarations */
// src/components/distribution/ExportOptionsModal.tsx

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Download, Calendar, Hash } from 'lucide-react';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
    type: 'duration' | 'count' | 'all';
    startDate?: string;
    endDate?: string;
    count?: number;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
    isOpen,
    onClose,
    onExport
}) => {
    const [exportType, setExportType] = useState<'duration' | 'count' | 'all'>('duration');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [count, setCount] = useState(100);

    const handleExport = () => {
        const options: ExportOptions = { type: exportType };

        if (exportType === 'duration') {
            if (!startDate || !endDate) {
                alert('Please select both start and end dates');
                return;
            }
            options.startDate = startDate;
            options.endDate = endDate;
        } else if (exportType === 'count') {
            options.count = count;
        }

        onExport(options);
        onClose();
    };

    // Quick date presets
    const setDatePreset = (preset: 'today' | 'week' | 'month' | 'year') => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start = '';

        switch (preset) {
            case 'today':
                start = end;
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                start = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                start = monthAgo.toISOString().split('T')[0];
                break;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                start = yearAgo.toISOString().split('T')[0];
                break;
        }

        setStartDate(start);
        setEndDate(end);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Orders to PDF">
            <div className="space-y-6">
                {/* Export Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Export Type
                    </label>
                    <div className="space-y-3">
                        {/* Duration Option */}
                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${exportType === 'duration'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onClick={() => setExportType('duration')}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    checked={exportType === 'duration'}
                                    onChange={() => setExportType('duration')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <Calendar className="h-5 w-5 ml-3 mr-2 text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-900">By Date Range</p>
                                    <p className="text-sm text-gray-500">
                                        Export orders within a specific date range
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Count Option */}
                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${exportType === 'count'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onClick={() => setExportType('count')}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    checked={exportType === 'count'}
                                    onChange={() => setExportType('count')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <Hash className="h-5 w-5 ml-3 mr-2 text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-900">By Count</p>
                                    <p className="text-sm text-gray-500">
                                        Export the last N orders (most recent)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* All Orders Option */}
                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${exportType === 'all'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onClick={() => setExportType('all')}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    checked={exportType === 'all'}
                                    onChange={() => setExportType('all')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <Download className="h-5 w-5 ml-3 mr-2 text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-900">All Orders</p>
                                    <p className="text-sm text-gray-500">
                                        Export all orders (may take longer)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Range Inputs */}
                {exportType === 'duration' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setDatePreset('today')}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setDatePreset('week')}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                            >
                                Last 7 Days
                            </button>
                            <button
                                onClick={() => setDatePreset('month')}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                            >
                                Last 30 Days
                            </button>
                            <button
                                onClick={() => setDatePreset('year')}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                            >
                                Last Year
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Count Input */}
                {exportType === 'count' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Orders
                        </label>
                        <Input
                            type="number"
                            min="1"
                            max="1000"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 100)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum: 1000 orders
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>
        </Modal>
    );
};