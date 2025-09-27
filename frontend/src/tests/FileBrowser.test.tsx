import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CedarOSProvider } from '../contexts/CedarOSContext';
import FileBrowser from '../components/FileBrowser';

// Mock the API service
jest.mock('../contexts/AuthContext', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock fetch for file operations
global.fetch = jest.fn();

const mockFiles = [
  {
    id: '1',
    name: 'linear_regression_model.pkl',
    type: 'model',
    size: 1024,
    path: '/uploads/model.pkl',
    metadata: { algorithm: 'LinearRegression', accuracy: 0.85 }
  },
  {
    id: '2',
    name: 'sales_chart.png',
    type: 'chart',
    size: 2048,
    path: '/uploads/chart.png',
    metadata: { chartType: 'bar', dimensions: { width: 800, height: 600 } }
  },
  {
    id: '3',
    name: 'dataset.csv',
    type: 'dataset',
    size: 4096,
    path: '/uploads/dataset.csv',
    metadata: { rows: 1000, columns: 5 }
  }
];

const mockCedarOS = {
  fileTree: mockFiles,
  addFile: jest.fn(),
  removeFile: jest.fn(),
  addCanvasCard: jest.fn(),
  setCurrentDataset: jest.fn(),
  currentDataset: null
};

const renderFileBrowser = (projectId = 'test-project') => {
  return render(
    <BrowserRouter>
      <CedarOSProvider>
        <FileBrowser projectId={projectId} />
      </CedarOSProvider>
    </BrowserRouter>
  );
};

describe('FileBrowser Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ files: mockFiles })
    });
  });

  describe('File Categories', () => {
    it('should display collapsible categories for different file types', () => {
      renderFileBrowser();
      
      expect(screen.getByText('Models')).toBeInTheDocument();
      expect(screen.getByText('Charts')).toBeInTheDocument();
      expect(screen.getByText('Datasets')).toBeInTheDocument();
    });

    it('should show file count for each category', () => {
      renderFileBrowser();
      
      expect(screen.getByText('(1)')).toBeInTheDocument(); // 1 model file
      expect(screen.getByText('(1)')).toBeInTheDocument(); // 1 chart file
      expect(screen.getByText('(1)')).toBeInTheDocument(); // 1 dataset file
    });

    it('should toggle category expansion when clicked', () => {
      renderFileBrowser();
      
      const modelsCategory = screen.getByText('Models').closest('.category-header');
      expect(modelsCategory).toBeInTheDocument();
      
      // Initially expanded
      expect(screen.getByText('linear_regression_model.pkl')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(modelsCategory!);
      
      // File should be hidden
      expect(screen.queryByText('linear_regression_model.pkl')).not.toBeInTheDocument();
    });
  });

  describe('File Actions', () => {
    it('should open file in canvas when clicked', () => {
      const mockAddCanvasCard = jest.fn();
      mockCedarOS.addCanvasCard = mockAddCanvasCard;
      
      renderFileBrowser();
      
      const modelFile = screen.getByText('linear_regression_model.pkl');
      fireEvent.click(modelFile);
      
      expect(mockAddCanvasCard).toHaveBeenCalledWith({
        type: 'model',
        title: 'linear_regression_model.pkl',
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number)
      });
    });

    it('should download file when download button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test content']))
      });
      
      renderFileBrowser();
      
      const downloadButton = screen.getAllByTitle('Download')[0];
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/projects/test-project/files/1/download',
          expect.any(Object)
        );
      });
    });

    it('should delete file when delete button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'File deleted successfully' })
      });
      
      const mockRemoveFile = jest.fn();
      mockCedarOS.removeFile = mockRemoveFile;
      
      renderFileBrowser();
      
      const deleteButton = screen.getAllByTitle('Delete')[0];
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/projects/test-project/files/1',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
        expect(mockRemoveFile).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('File Upload', () => {
    it('should open upload modal when upload button clicked', () => {
      renderFileBrowser();
      
      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);
      
      expect(screen.getByText('Upload Files')).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      const mockAddFile = jest.fn();
      mockCedarOS.addFile = mockAddFile;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          fileId: 'new-file-id',
          name: 'new-file.csv',
          type: 'dataset',
          size: 1024
        })
      });
      
      renderFileBrowser();
      
      // Open upload modal
      fireEvent.click(screen.getByText('Upload'));
      
      // Create a file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.files = [new File(['test content'], 'new-file.csv', { type: 'text/csv' })];
      
      // Simulate file selection
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/test-project/files',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no files', () => {
      const emptyCedarOS = { ...mockCedarOS, fileTree: [] };
      
      render(
        <BrowserRouter>
          <CedarOSProvider>
            <FileBrowser projectId="test-project" />
          </CedarOSProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('Click Upload to add files to your project')).toBeInTheDocument();
    });
  });
});
