import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/utils/helpers';
import { CHART_COLORS } from '@/utils/constants';

// Get color array for charts
const getChartColors = () => CHART_COLORS.array || Object.values(CHART_COLORS).filter(v => typeof v === 'string');


// Base Chart Wrapper
interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Line Chart
interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface CustomLineChartProps {
  data: LineChartData[];
  lines: { dataKey: string; color?: string; name?: string }[];
  xAxisKey?: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data,
  lines,
  xAxisKey = 'name',
  height = 300,
  title,
  subtitle,
  className,
  showGrid = true,
  showLegend = true,
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <LineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis dataKey={xAxisKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || getChartColors()[index % getChartColors().length]}
            strokeWidth={2}
            dot={{ fill: line.color || getChartColors()[index % getChartColors().length], strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ChartWrapper>
  );
};

// Area Chart
interface CustomAreaChartProps {
  data: LineChartData[];
  areas: { dataKey: string; color?: string; name?: string }[];
  xAxisKey?: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

export const CustomAreaChart: React.FC<CustomAreaChartProps> = ({
  data,
  areas,
  xAxisKey = 'name',
  height = 300,
  title,
  subtitle,
  className,
  showGrid = true,
  showLegend = true,
  stacked = false,
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <AreaChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis dataKey={xAxisKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stroke={area.color || getChartColors()[index % getChartColors().length]}
            fill={area.color || getChartColors()[index % getChartColors().length]}
            fillOpacity={0.3}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </AreaChart>
    </ChartWrapper>
  );
};

// Bar Chart
interface CustomBarChartProps {
  data: LineChartData[];
  bars: { dataKey: string; color?: string; name?: string }[];
  xAxisKey?: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}

export const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data,
  bars,
  xAxisKey = 'name',
  height = 300,
  title,
  subtitle,
  className,
  showGrid = true,
  showLegend = true,
  stacked = false,
  horizontal = false,
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        {horizontal ? (
          <>
            <YAxis type="category" dataKey={xAxisKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || getChartColors()[index % getChartColors().length]}
            stackId={stacked ? 'stack' : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartWrapper>
  );
};

// Pie/Donut Chart
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface CustomPieChartProps {
  data: PieChartData[];
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  donut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  height = 300,
  title,
  subtitle,
  className,
  showLegend = true,
  donut = false,
  innerRadius = 60,
  outerRadius = 100,
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={donut ? innerRadius : 0}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || getChartColors()[index % getChartColors().length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
      </PieChart>
    </ChartWrapper>
  );
};

// Stat Card with mini chart
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  chartData?: { value: number }[];
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  chartData,
  className,
}) => {
  const isPositive = change && change >= 0;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={cn('mt-1 text-sm font-medium', isPositive ? 'text-success-600' : 'text-error-600')}>
              {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% {changeLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-primary-50 text-primary-500">
            {icon}
          </div>
        )}
      </div>
      {chartData && chartData.length > 0 && (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                fill={isPositive ? '#10b981' : '#ef4444'}
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default {
  ChartWrapper,
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  StatCard,
};
