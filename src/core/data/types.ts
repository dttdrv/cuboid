export interface Project {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  created_at: string;
  updated_at?: string;
  role?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  factors?: any[];
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
  expires_at?: number;
}

export interface Document {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  content_encrypted: string; // Base64 blob
  iv: string; // Base64 blob
  salt: string; // Base64 blob
  created_at: string;
}