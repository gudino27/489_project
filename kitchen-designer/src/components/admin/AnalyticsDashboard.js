import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Users, Eye, MousePointer, Smartphone, RefreshCw } from 'lucide-react';
import sessionManager from '../utils/sessionManager';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [analytics, setAnalytics] = useState({
    overview: {
      totalVisitors: 0,
      totalPageViews: 0,
      designsCreated: 0,
      quotesRequested: 0,
      conversionRate: 0
    },
    conversionFunnel: [],
    leadSources: [],
    deviceBreakdown: [],
    pageViews: [],
    realTime: {
      activeNow: 0,
      last24Hours: {
        visitors: 0,
        pageViews: 0,
        designs: 0
      }
    }
  });

  // Get auth headers
  const getAuthHeaders = () => {
    const session = sessionManager.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.token ? `Bearer ${session.token}` : ''
    };
  };

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/analytics/dashboard?range=${timeRange}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  // Stats card component
  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: `2px solid ${color}20`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
        {change && (
          <span style={{
            fontSize: '0.875rem',
            color: change > 0 ? '#10B981' : '#EF4444',
            fontWeight: '600'
          }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{value.toLocaleString()}</p>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto', color: '#6B7280' }} />
        <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analytics Dashboard</h1>
          <p style={{ color: '#6B7280' }}>Track website performance and user behavior</p>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: timeRange === range ? '#2563EB' : 'transparent',
                color: timeRange === range ? 'white' : '#6B7280',
                fontWeight: timeRange === range ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
              {range === '1y' && 'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Stats */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(110, 110, 110, 1) 0%, rgba(110, 110, 110, 0.54) 100%)', borderRadius: '12px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Live Activity</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Active Now</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{analytics.realTime.activeNow}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Visitors (24h)</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{analytics.realTime.last24Hours.visitors}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Page Views (24h)</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{analytics.realTime.last24Hours.pageViews}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Designs Created (24h)</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{analytics.realTime.last24Hours.designs}</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          icon={Users}
          title="Total Visitors"
          value={analytics.overview.totalVisitors}
          color="#3B82F6"
        />
        <StatCard
          icon={Eye}
          title="Page Views"
          value={analytics.overview.totalPageViews}
          color="#8B5CF6"
        />
        <StatCard
          icon={MousePointer}
          title="Designs Created"
          value={analytics.overview.designsCreated}
          color="#10B981"
        />
        <StatCard
          icon={TrendingUp}
          title="Quotes Requested"
          value={analytics.overview.quotesRequested}
          color="#F59E0B"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Page Views Trend */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Page Views Over Time</h3>
          <div style={{ height: '300px' }}>
            <Line
              options={lineChartOptions}
              data={{
                labels: analytics.pageViews.map(d => d.date),
                datasets: [{
                  label: 'Page Views',
                  data: analytics.pageViews.map(d => d.views),
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
            />
          </div>
        </div>

        {/* Conversion Funnel */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Conversion Funnel</h3>
          <div style={{ height: '300px' }}>
            <Bar
              options={barChartOptions}
              data={{
                labels: analytics.conversionFunnel.map(d => d.stage),
                datasets: [{
                  data: analytics.conversionFunnel.map(d => d.count),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                  ],
                }]
              }}
            />
          </div>
        </div>

        {/* Lead Sources */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Lead Sources</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                }
              }}
              data={{
                labels: analytics.leadSources.map(d => d.source),
                datasets: [{
                  data: analytics.leadSources.map(d => d.count),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                  ],
                }]
              }}
            />
          </div>
        </div>

        {/* Device Breakdown */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} />
            Device Breakdown
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                }
              }}
              data={{
                labels: analytics.deviceBreakdown.map(d => d.device),
                datasets: [{
                  data: analytics.deviceBreakdown.map(d => d.count),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                  ],
                }]
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
