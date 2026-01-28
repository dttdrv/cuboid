export interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface EncryptedDocument {
  id: string;
  project_id: string;
  encrypted_content: string;
  iv: string;
}