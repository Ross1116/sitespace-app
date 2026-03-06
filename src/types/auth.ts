export type AuthUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_type?: string;
  company_name?: string | null;
};
