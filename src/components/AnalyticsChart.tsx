import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsChartProps {
    data: any[];
    title: string;
    type?: 'line' | 'area' | 'bar';
    height?: number;
    color?: string;
}

export const AnalyticsChart = ({
    data,
    title,
    type = 'line',
    height = 300,
    color = '#3B82F6'
}: AnalyticsChartProps) => {
    const formatTooltipValue = (value: any, name: string) => {
        if (name.includes('revenue') || name.includes('amount')) {
            return [`₦${value?.toLocaleString()}`, name];
        }
        return [value?.toLocaleString(), name];
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };

        switch (type) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Bar dataKey="orders" fill={color} />
                    </BarChart>
                );

            default:
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color }}
                        />
                    </LineChart>
                );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
};