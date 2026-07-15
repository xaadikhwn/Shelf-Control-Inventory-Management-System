import { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  Clock,
  Grid3X3,
  Plus,
  Download,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { mockApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils';
import { useUI } from '../../context/UIContext';
import type { Expense } from '../../types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUI();

  useEffect(() => {
    mockApi.getExpenses().then((data) => {
      setExpenses(data);
      setLoading(false);
    });
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = expenses
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const pendingTotal = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const categories = new Set(expenses.map((e) => e.category)).size;

  const columns: Column<Expense>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (row) => (
        <span className="text-accent-blue-light font-mono text-xs">{row.ref}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span className="font-medium">{row.description}</span>,
      sortable: true,
      sortValue: (row) => row.description,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-text-secondary">{row.category}</span>,
      sortable: true,
      sortValue: (row) => row.category,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.amount)}</span>
      ),
      sortable: true,
      sortValue: (row) => row.amount,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="text-text-secondary">{row.date}</span>,
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      render: (row) => <span className="text-text-secondary">{row.submittedBy}</span>,
      sortable: true,
      sortValue: (row) => row.submittedBy,
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
        title="Expenses"
        subtitle="Business expenditure tracking · December 2024"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => addToast('Expense data exported', 'success')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() =>
                addToast('Expense logged successfully', 'success')
              }
            >
              Log Expense
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle="December 2024"
          icon={Receipt}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Approved"
          value={formatCurrency(approvedTotal)}
          subtitle={`${expenses.filter((e) => e.status === 'approved').length} items`}
          trend={{ text: 'Processed', type: 'up' }}
          icon={CheckCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          label="Pending Approval"
          value={pendingCount.toString()}
          subtitle={formatCurrency(pendingTotal)}
          trend={
            pendingCount > 0
              ? { text: 'Awaiting review', type: 'warning' }
              : undefined
          }
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <KpiCard
          label="Categories"
          value={categories.toString()}
          subtitle="active cost centres"
          icon={Grid3X3}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
      </div>

      {/* Expense Claims Table */}
      <div className="bg-navy-800 border border-navy-500/50 rounded-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Expense Claims — December 2024
          </h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => addToast('CSV exported', 'success')}
          >
            CSV
          </Button>
        </div>
        <div className="p-5 pt-3">
          <DataTable columns={columns} data={expenses} loading={loading} />
        </div>
      </div>
    </div>
  );
}
