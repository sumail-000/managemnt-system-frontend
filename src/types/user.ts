export interface User {
  id: number;
  name: string;
  email: string;
  company?: string;
  membership_plan?: {
    name: string;
  };
  payment_status: string; // Assuming this will be the status field
  created_at: string;
  last_active_at?: string;
  products_count?: number;
  is_suspended?: boolean;
  avatar?: string;
  billing_history?: {
    id: number;
    invoice_number: string;
    billing_date: string;
    amount: number;
    status: string;
  }[];
  products?: {
    id: number;
    name: string;
    category?: {
      name: string;
    };
    status: string;
    created_at: string;
  }[];
}
