export interface CustomerOrder {
  id: string;
  date: string;
  items: number;
  total: number;
  status: string;
  payment: string;
}

export interface Customer {
  id: string;
  company: string;
  contact: string;
  phone: string;
  creditLimit: number;
  outstanding: number;
  lastOrder: string;
  status: string;
  orders: CustomerOrder[];
}
