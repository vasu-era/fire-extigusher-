export interface User {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface Customer {
  id: number;
  certificate_no: string;
  customer_name: string;
  mobile: string;
  address: string | null;
  service_date: string;
  expiry_date: string;
  total_qty: number;
  refilling_price: number;
  new_bottle_price: number;
  payment_status: 'pending' | 'paid' | 'partial';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtinguisherDetail {
  id: number;
  customer_id: number;
  ext_type: string;
  ext_capacity: string;
  ext_qty: number;
  ext_refilling_price: number;
  ext_new_price: number;
  service_action_type: 'refilling' | 'new';
  created_at: string;
}

export interface CustomerWithDetails extends Customer {
  extinguishers: ExtinguisherDetail[];
}

export interface CustomerHistory {
  id: number;
  customer_id: number;
  action_type: 'create' | 'update' | 'renew' | 'delete';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_by: number | null;
  created_at: string;
}

export interface Backup {
  id: number;
  backup_date: string;
  customers_count: number;
  details_count: number;
  file_url: string | null;
  created_by: number | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  expiryDue: number;
  expired: number;
  monthlyCount: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface Notification {
  id: number;
  customer_name: string;
  certificate_no: string;
  expiry_date: string;
  days_left: number;
  mobile: string;
}

export type ExtinguisherType = 'ABC' | 'CO2' | 'Water' | 'Foam';

export type ServiceActionType = 'refilling' | 'new';

export interface CapacityOption {
  type: ExtinguisherType;
  capacities: string[];
}

export const CAPACITY_OPTIONS: CapacityOption[] = [
  { type: 'ABC', capacities: ['1 KG', '2 KG', '4 KG', '6 KG', '9 KG', '25 KG', '50 KG'] },
  { type: 'CO2', capacities: ['2 KG', '3 KG', '4.5 KG', '6.5 KG', '22.5 KG'] },
  { type: 'Water', capacities: ['6 LTR', '9 LTR'] },
  { type: 'Foam', capacities: ['6 LTR', '9 LTR', '50 LTR'] },
];

export interface ExtinguisherFormRow {
  id: string;
  ext_type: string;
  ext_capacity: string;
  ext_qty: number;
  service_action_type: ServiceActionType;
  ext_refilling_price: number;
  ext_new_price: number;
}

export interface CustomerFormData {
  customer_name: string;
  mobile: string;
  address: string;
  certificate_no: string;
  service_date: string;
  expiry_duration: number;
  expiry_date: string;
  total_qty: number;
  extinguishers: ExtinguisherFormRow[];
}
