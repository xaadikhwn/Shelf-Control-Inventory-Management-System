import { useState, useEffect } from 'react';
import {
  Truck,
  Banknote,
  AlertTriangle,
  Globe,
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
import type { Supplier } from '../../types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUI();

  useEffect(() => {
    mockApi.getSuppliers().then((data) => {
      setSuppliers(data);
      setLoading(false);
    });
  }, []);

  const totalPayable = suppliers.reduce((sum, s) => sum + s.payable, 0);
  const overduePayables = suppliers.filter((s) => s.status === 'overdue').length;
  const countries = new Set(suppliers.map((s) => s.country)).size;

  const columns: Column<Supplier>[] = [
    {
      key: 'id',
      header: 'Vendor ID',
      render: (row) => (
        <span className="text-accent-blue-light font-mono text-xs">{row.id}</span>
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
      key: 'country',
      header: 'Country',
      render: (row) => <span className="text-text-secondary">{row.country}</span>,
      sortable: true,
      sortValue: (row) => row.country,
    },
    {
      key: 'payable',
      header: 'Payable',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.payable)}</span>
      ),
      sortable: true,
      sortValue: (row) => row.payable,
    },
    {
      key: 'creditTerms',
      header: 'Credit Terms',
      render: (row) => (
        <span className="text-text-secondary">{row.creditTerms}</span>
      ),
    },
    {
      key: 'lastInvoice',
      header: 'Last Invoice',
      render: (row) => (
        <span className="text-text-secondary">{row.lastInvoice}</span>
      ),
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
        Total Payable
      </td>
      <td className="px-4 py-3 text-sm font-bold text-text-primary text-right">
        {formatCurrency(totalPayable)}
      </td>
      <td className="px-4 py-3" colSpan={3} />
    </tr>
  );

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Vendor management & purchase ledger"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => addToast('Supplier data exported', 'success')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() =>
                addToast('Add supplier form coming in Phase 2', 'info')
              }
            >
              Add Supplier
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Suppliers"
          value={suppliers.length.toString()}
          subtitle="active vendors"
          icon={Truck}
          iconColor="text-accent-blue"
          iconBg="bg-accent-blue/10"
        />
        <KpiCard
          label="Total Payable"
          value={formatCurrency(totalPayable)}
          subtitle="across all vendors"
          icon={Banknote}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          label="Overdue Payables"
          value={overduePayables.toString()}
          subtitle="past credit terms"
          trend={
            overduePayables > 0
              ? { text: 'Payment required', type: 'warning' }
              : undefined
          }
          icon={AlertTriangle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <KpiCard
          label="Countries"
          value={countries.toString()}
          subtitle="supplier regions"
          icon={Globe}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
      </div>

      {/* Supplier Purchase Ledger Table */}
      <div className="bg-navy-800 border border-navy-500/50 rounded-xl">
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Supplier Purchase Ledger
          </h3>
        </div>
        <div className="p-5 pt-3">
          <DataTable
            columns={columns}
            data={suppliers}
            loading={loading}
            footerRow={footerRow}
          />
        </div>
      </div>
    </div>
  );
}
