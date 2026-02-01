export interface Project {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
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