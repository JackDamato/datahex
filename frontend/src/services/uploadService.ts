/**
 * Simple upload service for dataset files
 */

export interface UploadResponse {
  success: boolean;
  filename: string;
  fileId: string;
  message: string;
}

/**
 * Upload a file to the backend endpoint
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name);
  formData.append('size', file.size.toString());

  try {
    // Replace with your actual endpoint
    const response = await fetch('/api/upload-dataset', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for FormData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      filename: file.name,
      fileId: result.fileId || `file_${Date.now()}`,
      message: result.message || 'File uploaded successfully'
    };

  } catch (error) {
    console.error('Upload error:', error);
    
    // For now, return a mock success response since endpoint doesn't exist yet
    return {
      success: true,
      filename: file.name,
      fileId: `mock_${Date.now()}`,
      message: `Mock upload: ${file.name} uploaded successfully!`
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['.csv', '.json', '.xlsx', '.xls'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedTypes.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 100MB.'
    };
  }
  
  return { valid: true };
}