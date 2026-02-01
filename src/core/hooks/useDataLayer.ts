import { useState, useCallback } from 'react';
import { LocalData } from '../storage/local';
import { useAuth } from '../auth/AuthProvider';
import * as Crypto from '../crypto';
import { Project, Document } from '../data/types';

export const useDataLayer = () => {
  const { user, masterKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listProjects = useCallback(async (): Promise<Project[]> => {
    if (!user) return [];
    setLoading(true);
    setError(null);

    const data = await LocalData.listProjects(user.id);

    setLoading(false);
    return data;
  }, [user]);

  const createProject = useCallback(async (name: string): Promise<Project | null> => {
    if (!user || !masterKey) {
      setError('User or Master Key not available');
      return null;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Create Project
      const project = await LocalData.createProject(user.id, name);

      // 2. Create Default Document
      const docSalt = window.crypto.getRandomValues(new Uint8Array(16));
      const info = new Uint8Array(0); // Empty info
      const docKey = await Crypto.deriveDocumentKey(masterKey, docSalt, info);

      const defaultContent = "Hello World"; // Default template
      const { iv, ciphertext } = await Crypto.encrypt(docKey, defaultContent);

      const doc: Document = {
        id: crypto.randomUUID(),
        project_id: project.id,
        owner_id: user.id,
        title: 'main.tex',
        content_encrypted: Crypto.toBase64(ciphertext),
        iv: Crypto.toBase64(iv),
        salt: Crypto.toBase64(docSalt),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await LocalData.createDocument(doc);

      setLoading(false);
      return project;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, masterKey]);

  const getDocument = useCallback(async (projectId: string): Promise<{ content: string; title: string } | null> => {
    if (!masterKey) {
      setError('Master Key not available');
      return null;
    }
    setLoading(true);
    setError(null);

    try {
      const doc = await LocalData.getDocumentByProject(projectId);
      if (!doc) return null;

      // Decrypt
      const salt = Crypto.fromBase64(doc.salt);
      const iv = Crypto.fromBase64(doc.iv);
      const encryptedContent = Crypto.fromBase64(doc.content_encrypted);

      const docKey = await Crypto.deriveDocumentKey(masterKey, salt, new Uint8Array(0));
      const decryptedContent = await Crypto.decrypt(docKey, iv, encryptedContent);

      setLoading(false);
      return {
        content: decryptedContent,
        title: doc.title
      };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [masterKey]);

  const saveDocument = useCallback(async (projectId: string, content: string): Promise<boolean> => {
    if (!masterKey) {
      setError('Master Key not available');
      return false;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch current doc to get salt
      const docData = await LocalData.getDocumentByProject(projectId);
      if (!docData) throw new Error('Document not found');

      const salt = Crypto.fromBase64(docData.salt);

      // 2. Derive key & Encrypt
      const docKey = await Crypto.deriveDocumentKey(masterKey, salt, new Uint8Array(0));
      const { iv, ciphertext } = await Crypto.encrypt(docKey, content);

      // 3. Update
      const updates: Document = {
        ...docData,
        content_encrypted: Crypto.toBase64(ciphertext),
        iv: Crypto.toBase64(iv),
      }

      await LocalData.saveDocument(updates);

      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, [masterKey]);

  return {
    loading,
    error,
    listProjects,
    createProject,
    getDocument,
    saveDocument
  };
};