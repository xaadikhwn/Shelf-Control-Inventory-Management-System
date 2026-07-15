import { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  AlertTriangle,
  TrendingDown,
  Plus,
  Download,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import CustomerDetailModal from './CustomerDetailModal';
import { mockApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils';
import { useUI } from '../../context/UIContext';
import type { Customer } from '../../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { addToast } = useUI();

  useEffect(() => {
    mockApi.getCustomers().then((data) => {
      setCustomers(data);
      setLoading(false);
    });
  }, []);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);
  const overdueAccounts = customers.filter((c) => c.status === 'overdue').length;
  const atRisk = customers.filter((c) => c.status === 'warning').length;

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'Acct ID',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(row);
          }}
          className="text-accent-blue-light font-mono text-xs hover:underline"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (row) => <span className="font-medium">{row.company}</span>,
      sortable: true,
      sortValue: (row) => row.company,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => <span className="text-text-secondary">{row.contact}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="text-text-secondary font-mono text-xs">{row.phone}</span>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      render: (row) => (
        <span className="text-text-secondary">{formatCurrency(row.creditLimit)}</span>
      ),
      sortable: true,
      sortValue: (row) => row.creditLimit,
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      render: (row) =>
        row.outstanding > 0 ? (
          <span className="font-medium">{formatCurrency(row.outstanding)}</span>
        ) : (
          <span className="text-text-muted">–</span>
        ),
      sortable: true,
      sortValue: (row) => row.outstanding,
    },
    {
      key: 'utilisation',
      header: 'Utilisation',
      render: (row) => {
        const pct =
          row.creditLimit > 0
            ? (row.outstanding / row.creditLimit) * 100
            : 0;
        return (
          <div className="min-w-[100px]">
            <ProgressBar percentage={pct} showLabel />
          </div>
        );
      },
    },
    {
      key: 'lastOrder',
      header: 'Last Order',
      render: (row) => (
        <span className="text-text-secondary">{row.lastOrder}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customer Accounts"
        subtitle="Credit ledger & account management"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => addToast('Customer data exported', 'success')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() =>
                addToast('Add customer form coming in Phase 2', 'info')
              }
            >
              Add Customer
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Customers"
          value={customers.length.toString()}
          subtitle="registered accounts"
          icon={Users}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle="credit balances"
          trend={{ text: 'Across all accounts', type: 'neutral' }}
          icon={CreditCard}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Overdue Accounts"
          value={overdueAccounts.toString()}
          subtitle="past due date"
          trend={
            overdueAccounts > 0
              ? { text: 'Immediate follow-up', type: 'warning' }
              : undefined
          }
          icon={AlertTriangle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <KpiCard
          label="At-Risk"
          value={atRisk.toString()}
          subtitle="near credit limit"
          trend={
            atRisk > 0
              ? { text: 'Monitor closely', type: 'warning' }
              : undefined
          }
          icon={TrendingDown}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
      </div>

      {/* Customer Credit Ledger Table */}
      <div className="bg-navy-800 border border-navy-500/50 rounded-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Customer Credit Ledger
          </h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => addToast('Ledger exported', 'success')}
          >
            Export
          </Button>
        </div>
        <div className="p-5 pt-3">
          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            onRowClick={(row) => setSelectedCustomer(row)}
          />
        </div>
      </div>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
