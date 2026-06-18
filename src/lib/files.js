// Account file uploads. Metadata in Postgres (account_files), bytes in
// Supabase Storage bucket 'account-files' (private; access via signed URLs).
// All calls degrade gracefully in demo mode — they return empty/no-op
// results instead of throwing, and report failures via monitoring.
import { db } from './supabase';
import { reportApiError } from './monitoring';

export const BUCKET = 'account-files';
export const MAX_FILE_BYTES = 26214400; // 25 MB

export const FILE_TYPES = [
  'Commercial Proposal',
  'Contract',
  'SOW',
  'Onboarding Plan',
  'Training Material',
  'Other',
];

// Allowed upload formats: PDF, Office docs, and images. Used both for the file
// picker's `accept` hint and as an enforced client-side gate (the `accept`
// attribute alone is bypassable).
export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp',
];
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',');

export function isAllowedFile(file) {
  if (!file) return false;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

const isDemo = () => !import.meta.env.VITE_SUPABASE_URL;

// Map a DB row to the app's file shape (camelCase).
function rowToFile(row) {
  return {
    id:          row.id,
    clientId:    row.client_id,
    uploadedBy:  row.uploaded_by,
    title:       row.title,
    fileType:    row.file_type,
    storagePath: row.storage_path,
    fileName:    row.file_name,
    fileSize:    row.file_size,
    mimeType:    row.mime_type,
    createdAt:   row.created_at,
  };
}

// List active (non-deleted) files for a client, newest first.
export async function listFiles(clientId) {
  if (isDemo() || !clientId) return [];
  try {
    const { data, error } = await db
      .from('account_files')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToFile);
  } catch (error) {
    reportApiError('files.list', error, { clientId });
    return [];
  }
}

// Upload a File to Storage, then insert a metadata row.
// Returns the created file shape, or throws so the modal can surface the error.
export async function uploadFile({ clientId, file, title, fileType }) {
  if (isDemo()) {
    throw new Error('File uploads require a connected database. Running in demo mode.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File exceeds the 25 MB limit.');
  }
  if (!isAllowedFile(file)) {
    throw new Error('Unsupported file type. Use PDF, Office documents, or images.');
  }

  const { data: userData, error: userErr } = await db.auth.getUser();
  if (userErr || !userData?.user) {
    throw new Error('You must be signed in to upload files.');
  }
  const uid = userData.user.id;

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const uniq = (crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const storagePath = `${uid}/${clientId}/${uniq}_${safeName}`;

  try {
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) throw upErr;

    const { data, error } = await db
      .from('account_files')
      .insert({
        client_id:    clientId,
        uploaded_by:  uid,
        title:        title?.trim() || file.name,
        file_type:    FILE_TYPES.includes(fileType) ? fileType : 'Other',
        storage_path: storagePath,
        file_name:    file.name,
        file_size:    file.size,
        mime_type:    file.type || null,
      })
      .select()
      .single();
    if (error) {
      // Roll back the orphaned object so Storage doesn't drift from metadata.
      await db.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      throw error;
    }
    return rowToFile(data);
  } catch (error) {
    reportApiError('files.upload', error, { clientId });
    throw error;
  }
}

// Create a short-lived signed URL for downloading/viewing a file.
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  if (isDemo() || !storagePath) return null;
  try {
    const { data, error } = await db.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresIn);
    if (error) throw error;
    return data?.signedUrl || null;
  } catch (error) {
    reportApiError('files.signedUrl', error, {});
    return null;
  }
}

// Soft-delete the metadata row and remove the underlying object.
export async function deleteFile(file) {
  if (isDemo() || !file?.id) return false;
  try {
    const { error } = await db
      .from('account_files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', file.id);
    if (error) throw error;
    if (file.storagePath) {
      await db.storage.from(BUCKET).remove([file.storagePath]).catch(() => {});
    }
    return true;
  } catch (error) {
    reportApiError('files.delete', error, { fileId: file.id });
    return false;
  }
}

// Human-readable byte size.
export function fmtBytes(bytes) {
  if (bytes == null || isNaN(Number(bytes))) return '';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
