import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import AppShell from './components/layout/AppShell';

// Code-split routes with React.lazy
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const SalesPage = lazy(() => import('./pages/Sales/SalesPage'));
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage'));
const PayrollPage = lazy(() => import('./pages/Payroll/PayrollPage'));
const ExpensesPage = lazy(() => import('./pages/Expenses/ExpensesPage'));
const CustomersPage = lazy(() => import('./pages/Customers/CustomersPage'));
const SuppliersPage = lazy(() => import('./pages/Suppliers/SuppliersPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/sales', element: <SalesPage /> },
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/payroll', element: <PayrollPage /> },
      { path: '/expenses', element: <ExpensesPage /> },
      { path: '/customers', element: <CustomersPage /> },
      { path: '/suppliers', element: <SuppliersPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <RouterProvider router={router} />
      </UIProvider>
    </AuthProvider>
  );
}
