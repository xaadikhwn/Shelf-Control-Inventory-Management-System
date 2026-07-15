import { useState, useEffect } from 'react';
import {
  Wallet,
  Banknote,
  Users,
  Clock,
  Play,
  FileText,
  Plus,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { mockApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils';
import { useUI } from '../../context/UIContext';
import type { Employee } from '../../types';

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUI();

  useEffect(() => {
    mockApi.getEmployees().then((data) => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  const grossPayroll = employees.reduce((sum, e) => sum + e.gross, 0);
  const totalDeductions = employees.reduce((sum, e) => sum + e.deductions, 0);
  const netPayroll = employees.reduce((sum, e) => sum + e.netPay, 0);
  const pendingCount = employees.filter((e) => e.status === 'pending').length;

  const columns: Column<Employee>[] = [
    {
      key: 'id',
      header: 'Emp ID',
      render: (row) => (
        <span className="text-accent-blue-light font-mono text-xs">{row.id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => <span className="text-text-secondary">{row.department}</span>,
      sortable: true,
      sortValue: (row) => row.department,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <span className="text-text-secondary">{row.role}</span>,
    },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.gross)}</span>
      ),
      sortable: true,
      sortValue: (row) => row.gross,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      align: 'right',
      render: (row) => (
        <span className="text-red-400">{formatCurrency(row.deductions)}</span>
      ),
    },
    {
      key: 'netPay',
      header: 'Net Pay',
      align: 'right',
      render: (row) => (
        <span className="text-emerald-400 font-medium">
          {formatCurrency(row.netPay)}
        </span>
      ),
    },
    {
      key: 'payDate',
      header: 'Pay Date',
      render: (row) => <span className="text-text-secondary">{row.payDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const footerRow = (
    <tr className="border-t-2 border-navy-400 bg-navy-700/30">
      <td className="px-4 py-3 text-sm font-bold text-text-primary" colSpan={4}>
        Totals
      </td>
      <td className="px-4 py-3 text-sm font-bold text-text-primary text-right">
        {formatCurrency(grossPayroll)}
      </td>
      <td className="px-4 py-3 text-sm font-bold text-red-400 text-right">
        {formatCurrency(totalDeductions)}
      </td>
      <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">
        {formatCurrency(netPayroll)}
      </td>
      <td className="px-4 py-3" colSpan={2} />
    </tr>
  );

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Employee compensation & pay records"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => addToast('Payslips generated', 'success')}
            >
              Payslips
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() =>
                addToast('Add employee form coming in Phase 2', 'info')
              }
            >
              Add Employee
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-4 h-4" />}
              onClick={() =>
                addToast('Payroll run initiated', 'success')
              }
            >
              Run Payroll
              {pendingCount > 0 && (
                <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Gross Payroll"
          value={formatCurrency(grossPayroll)}
          subtitle="December 2024"
          icon={Wallet}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Net Payroll"
          value={formatCurrency(netPayroll)}
          subtitle="after deductions"
          icon={Banknote}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          label="Employees"
          value={employees.length.toString()}
          subtitle="on payroll"
          icon={Users}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <KpiCard
          label="Pending"
          value={pendingCount.toString()}
          subtitle="awaiting processing"
          trend={
            pendingCount > 0
              ? { text: 'Action required', type: 'info' }
              : undefined
          }
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Employee Pay Records Table */}
      <div className="bg-navy-800 border border-navy-500/50 rounded-xl">
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Employee Pay Records — December 2024
          </h3>
        </div>
        <div className="p-5 pt-3">
          <DataTable
            columns={columns}
            data={employees}
            loading={loading}
            footerRow={footerRow}
          />
        </div>
      </div>
    </div>
  );
}
