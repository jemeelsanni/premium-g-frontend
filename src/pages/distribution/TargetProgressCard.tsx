/* eslint-disable @typescript-eslint/no-explicit-any */
import { Target, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../../utils/format';

interface TargetProgressCardProps {
    targetData: any;
}

export const TargetProgressCard = ({ targetData }: TargetProgressCardProps) => {
    const currentWeek = targetData?.performance?.find((p: any) =>
        new Date() >= new Date(p.weekStartDate) && new Date() <= new Date(p.weekEndDate)
    );

    const monthlyProgress = targetData?.summary?.monthlyProgress || 0;
    const weeklyProgress = currentWeek?.percentageAchieved || 0;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Target Progress</h3>
                <Target className="h-5 w-5 text-blue-600" />
            </div>

            <div className="space-y-4">
                {/* Monthly Progress */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Monthly Target</span>
                        <span className="text-sm text-gray-600">
                            {formatNumber(monthlyProgress, 1)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${monthlyProgress >= 100 ? 'bg-green-500' :
                                monthlyProgress >= 75 ? 'bg-blue-500' :
                                    monthlyProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Weekly Progress */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Current Week</span>
                        <span className="text-sm text-gray-600">
                            {formatNumber(weeklyProgress, 1)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${weeklyProgress >= 100 ? 'bg-green-500' :
                                weeklyProgress >= 75 ? 'bg-blue-500' :
                                    weeklyProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Target Details */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-600">Monthly Target</div>
                            <div className="font-semibold">
                                {formatNumber(targetData?.target?.totalPacksTarget || 0)} packs
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-600">Remaining</div>
                            <div className="font-semibold">
                                {formatNumber(targetData?.summary?.remainingPacks || 0)} packs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert for behind target */}
                {monthlyProgress < 50 && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                            Behind monthly target - accelerate sales efforts
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};