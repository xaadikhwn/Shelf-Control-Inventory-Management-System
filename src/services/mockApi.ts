import { customers, suppliers, products, salesOrders, employees, expenses, dashboardSummary } from '../mock-data';
import type { Customer } from '../types/customer';
import type { Supplier } from '../types/supplier';
import type { Product } from '../types/product';
import type { SalesOrder } from '../types/salesOrder';
import type { Employee } from '../types/employee';
import type { Expense } from '../types/expense';
import type { DashboardSummary } from '../types';

/**
 * Simulates API latency. In Phase 2, this layer will be replaced
 * with real Axios calls — one-line change per function.
 */
const delay = (ms = 300): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // ── Dashboard ──────────────────────────────────────
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    await delay();
    return { ...dashboardSummary };
  },

  // ── Customers ──────────────────────────────────────
  getCustomers: async (): Promise<Customer[]> => {
    await delay();
    return [...customers];
  },

  getCustomerById: async (id: string): Promise<Customer | undefined> => {
    await delay(200);
    return customers.find((c) => c.id === id);
  },

  // ── Suppliers ──────────────────────────────────────
  getSuppliers: async (): Promise<Supplier[]> => {
    await delay();
    return [...suppliers];
  },

  // ── Products / Inventory ───────────────────────────
  getProducts: async (): Promise<Product[]> => {
    await delay();
    return [...products];
  },

  // ── Sales Orders ───────────────────────────────────
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    await delay();
    return [...salesOrders];
  },

  // ── Employees / Payroll ────────────────────────────
  getEmployees: async (): Promise<Employee[]> => {
    await delay();
    return [...employees];
  },

  // ── Expenses ───────────────────────────────────────
  getExpenses: async (): Promise<Expense[]> => {
    await delay();
    return [...expenses];
  },
};

export default mockApi;
