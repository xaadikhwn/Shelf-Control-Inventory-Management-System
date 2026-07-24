import { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, AlertTriangle, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import RevenueExpenseChart from '../../components/charts/RevenueExpenseChart';
import SalesByCategoryDonut from '../../components/charts/SalesByCategoryDonut';
import { mockApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import type { DashboardSummary, SalesOrder } from '../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashData, orderData] = await Promise.all([
          mockApi.getDashboardSummary(),
          mockApi.getSalesOrders(),
        ]);
        setSummary(dashData);
        setOrders(orderData.slice(0, 8));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns: Column<SalesOrder>[] = [
    {
      key: 'id',
      header: 'Order ID',
      mono: true,
      render: (row) => (
        <span className="text-accent-blue-light font-mono text-xs">{row.id}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <span className="font-medium">{row.customer}</span>,
      sortable: true,
      sortValue: (row) => row.customer,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="text-text-secondary">{row.date}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (row) => row.items,
      sortable: true,
      sortValue: (row) => row.items,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.total)}</span>
      ),
      sortable: true,
      sortValue: (row) => row.total,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.orderStatus} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (row) => <StatusBadge status={row.payment} />,
    },
  ];

  if (loading || !summary) {
    return (
      <div>
        <PageHeader
          title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`}
          subtitle="Overview for December 2024 · FY2024"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-navy-800 border border-navy-500/50 rounded-xl p-5 h-32 skeleton"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`}
        subtitle={`Role: ${user?.role || 'Staff'} · Overview for December 2024 · FY2024`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          subtitle="Dec 2024"
          trend={{ text: summary.revenueTrend, type: 'up' }}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          label="Outstanding Credit"
          value={formatCurrency(summary.outstandingCredit)}
          subtitle={`${summary.creditAccounts} customer accounts`}
          trend={{
            text: `${summary.overdueAccounts} account overdue`,
            type: 'warning',
          }}
          icon={CreditCard}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Stock Alerts"
          value={`${summary.stockAlerts} SKUs`}
          subtitle={`${summary.outOfStock} out of stock`}
          trend={{ text: 'Reorder required', type: 'warning' }}
          icon={AlertTriangle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <KpiCard
          label="Monthly Payroll"
          value={formatCurrency(summary.monthlyPayroll)}
          subtitle={`${summary.payrollEmployees} employees · Dec`}
          trend={{
            text: `Processed ${summary.payrollProcessed}`,
            type: 'neutral',
          }}
          icon={Users}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={summary.revenueByMonth} />
        </div>
        <div>
          <SalesByCategoryDonut data={summary.salesByCategory} />
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-navy-800 border border-navy-500/50 rounded-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent Sales Orders
          </h3>
          <span className="text-xs text-text-muted">Last 8 orders</span>
        </div>
        <div className="p-5 pt-3">
          <DataTable columns={columns} data={orders} loading={loading} />
        </div>
      </div>
    </div>
  );
}
