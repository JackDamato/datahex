import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from './AuthContext';

// ==================== TYPE DEFINITIONS ====================

export interface Dataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  filePath: string;
  columnNames: string[];
  data: any[][];
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'dataset' | 'chart' | 'model' | 'image';
  size: number;
  filePath: string;
  createdAt: string;
  metadata?: any;
}

export interface CanvasCard {
  id: string;
  type: 'dataset' | 'agent' | 'image' | 'chart' | 'model';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: any;
  isFullscreen?: boolean;
  agentId?: string;
  progress?: number;
  logs?: string[];
}

export interface ColumnStats {
  column: string;
  mean?: number;
  median?: number;
  std?: number;
  missing: number;
  missingPercentage: number;
  unique: number;
  dataType: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface AgentProposal {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
  data?: any;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// ==================== CEDAROS STATE INTERFACE ====================

export interface CedarState {
  // Core data
  currentDataset: Dataset | null;
  datasetRows: string[][];
  datasetHeaders: string[];
  datasetTypes: Record<string, string>;
  datasetTotalRows: number;
  canvasCards: CanvasCard[];
  fileTree: ProjectFile[];
  selectedColumn: string | null;
  summaryStats: ColumnStats | null;
  chatMessages: ChatMessage[];
  agentProposals: AgentProposal[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentDataset: (dataset: Dataset | null) => void;
  setDatasetRows: (rows: string[][]) => void;
  setDatasetHeaders: (headers: string[]) => void;
  setDatasetTypes: (types: Record<string, string>) => void;
  setDatasetTotalRows: (totalRows: number) => void;
  addCanvasCard: (card: Omit<CanvasCard, 'id'>) => void;
  updateCanvasCard: (id: string, updates: Partial<CanvasCard>) => void;
  removeCanvasCard: (id: string) => void;
  setFileTree: (files: ProjectFile[]) => void;
  addFile: (file: ProjectFile) => void;
  removeFile: (fileId: string) => void;
  setSelectedColumn: (column: string | null) => void;
  setSummaryStats: (stats: ColumnStats | null) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addAgentProposal: (proposal: Omit<AgentProposal, 'id' | 'timestamp'>) => void;
  updateAgentProposal: (id: string, status: 'accepted' | 'rejected') => void;
  clearError: () => void;
  loadDataset: (projectId: string) => Promise<void>;
}

// ==================== CEDAROS CONTEXT ====================

const CedarOSContext = createContext<CedarState | undefined>(undefined);

export const useCedarOS = () => {
  const context = useContext(CedarOSContext);
  if (!context) {
    throw new Error('useCedarOS must be used within a CedarOSProvider');
  }
  return context;
};

// ==================== CEDAROS PROVIDER ====================

interface CedarOSProviderProps {
  children: ReactNode;
  projectId: string;
}

export const CedarOSProvider: React.FC<CedarOSProviderProps> = ({ children, projectId }) => {
  // State
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [datasetRows, setDatasetRows] = useState<string[][]>([]);
  const [datasetHeaders, setDatasetHeaders] = useState<string[]>([]);
  const [datasetTypes, setDatasetTypes] = useState<Record<string, string>>({});
  const [datasetTotalRows, setDatasetTotalRows] = useState<number>(0);
  const [canvasCards, setCanvasCards] = useState<CanvasCard[]>([]);
  const [fileTree, setFileTree] = useState<ProjectFile[]>([]);
  
  // Debug logging for fileTree changes
  useEffect(() => {
    console.log('CedarOS: fileTree changed to:', fileTree);
    console.log('CedarOS: fileTree length:', fileTree.length);
    if (fileTree.length > 0) {
      console.log('CedarOS: First file:', fileTree[0]);
    }
  }, [fileTree]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<ColumnStats | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentProposals, setAgentProposals] = useState<AgentProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== ACTIONS ====================

  const addCanvasCard = (card: Omit<CanvasCard, 'id'>) => {
    console.log('CedarOS: Adding canvas card:', card);
    const newCard: CanvasCard = {
      ...card,
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    console.log('CedarOS: Created new card with ID:', newCard.id);
    setCanvasCards(prev => {
      const updated = [...prev, newCard];
      console.log('CedarOS: Updated canvas cards count:', updated.length);
      return updated;
    });
  };

  const updateCanvasCard = (id: string, updates: Partial<CanvasCard>) => {
    setCanvasCards(prev => 
      prev.map(card => card.id === id ? { ...card, ...updates } : card)
    );
  };

  const removeCanvasCard = (id: string) => {
    setCanvasCards(prev => prev.filter(card => card.id !== id));
  };

  const addFile = (file: ProjectFile) => {
    setFileTree(prev => [...prev, file]);
  };

  const removeFile = (fileId: string) => {
    setFileTree(prev => prev.filter(file => file.id !== fileId));
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const addAgentProposal = (proposal: Omit<AgentProposal, 'id' | 'timestamp'>) => {
    const newProposal: AgentProposal = {
      ...proposal,
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setAgentProposals(prev => [...prev, newProposal]);
  };

  const updateAgentProposal = (id: string, status: 'accepted' | 'rejected') => {
    setAgentProposals(prev => 
      prev.map(proposal => 
        proposal.id === id ? { ...proposal, status } : proposal
      )
    );
  };

  const clearError = () => setError(null);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeCedarOS = async () => {
      try {
        console.log('CedarOS: Initializing with projectId:', projectId);
        console.log('CedarOS: Auth token:', localStorage.getItem('authToken'));
        setIsLoading(true);
        setError(null);

        // Load project files
        const files = await loadProjectFiles(projectId);
        console.log('CedarOS: Setting fileTree to:', files);
        console.log('CedarOS: Files count:', files.length);
        setFileTree(files);

        // Initialize with dummy data for development (but don't override fileTree)
        initializeDummyData();

        // Load dataset data
        await loadDataset(projectId);

        console.log('CedarOS: Initialization complete');

      } catch (err) {
        console.error('Error initializing CedarOS:', err);
        setError('Failed to initialize workspace');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      console.log('CedarOS: Starting initialization for projectId:', projectId);
      initializeCedarOS();
    } else {
      console.log('CedarOS: No projectId provided');
    }
  }, [projectId]);

  // ==================== HELPER FUNCTIONS ====================

  const loadProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
    try {
      console.log('Loading project files for projectId:', projectId);
      const authToken = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!authToken);
      
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/files`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load project files:', response.statusText, errorText);
        return [];
      }

      const files = await response.json();
      console.log('Loaded project files:', files);
      console.log('Number of files loaded:', files.length);
      return files;
    } catch (error) {
      console.error('Error loading project files:', error);
      return [];
    }
  };

  const loadDataset = async (projectId: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/dataset`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No dataset found for this project
          setCurrentDataset(null);
          setDatasetRows([]);
          setDatasetHeaders([]);
          setDatasetTypes({});
          setDatasetTotalRows(0);
          return;
        }
        throw new Error(`Failed to load dataset: ${response.statusText}`);
      }

      const datasetData = await response.json();
      
      // Update dataset state
      const dataset: Dataset = {
        id: datasetData.id,
        name: datasetData.name,
        rows: datasetData.rows.length,
        columns: datasetData.headers.length,
        filePath: `/uploads/${datasetData.name}`,
        columnNames: datasetData.headers,
        data: datasetData.rows,
        createdAt: new Date().toISOString(),
      };
      
      setCurrentDataset(dataset);
      setDatasetRows(datasetData.rows);
      setDatasetHeaders(datasetData.headers);
      setDatasetTypes(datasetData.types);
      setDatasetTotalRows(datasetData.totalRows);
      
    } catch (error) {
      console.error('Error loading dataset:', error);
      setError('Failed to load dataset');
    }
  };

  const initializeDummyData = () => {
    // Initialize dummy chat messages
    const dummyMessages: ChatMessage[] = [
      {
        id: 'msg_1',
        text: 'Welcome to DataHex! I can help you analyze your data.',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 'msg_2',
        text: 'Upload a dataset to get started with analysis.',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 240000).toISOString(),
      },
    ];
    setChatMessages(dummyMessages);

    // Initialize dummy agent proposals
    const dummyProposals: AgentProposal[] = [
      {
        id: 'proposal_1',
        agentId: 'data_cleaner',
        agentName: 'Data Cleaner',
        action: 'Remove duplicates',
        description: 'Found 15 duplicate rows in the dataset',
        status: 'pending',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: 'proposal_2',
        agentId: 'outlier_detector',
        agentName: 'Outlier Detector',
        action: 'Flag outliers',
        description: 'Detected 3 potential outliers in sales column',
        status: 'pending',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ];
    setAgentProposals(dummyProposals);
  };

  // ==================== CONTEXT VALUE ====================

  const value: CedarState = {
    // Core data
    currentDataset,
    datasetRows,
    datasetHeaders,
    datasetTypes,
    datasetTotalRows,
    canvasCards,
    fileTree,
    selectedColumn,
    summaryStats,
    chatMessages,
    agentProposals,
    
    // UI state
    isLoading,
    error,
    
    // Actions
    setCurrentDataset,
    setDatasetRows,
    setDatasetHeaders,
    setDatasetTypes,
    setDatasetTotalRows,
    addCanvasCard,
    updateCanvasCard,
    removeCanvasCard,
    setFileTree,
    addFile,
    removeFile,
    setSelectedColumn,
    setSummaryStats,
    addChatMessage,
    addAgentProposal,
    updateAgentProposal,
    clearError,
    loadDataset,
  };

  return (
    <CedarOSContext.Provider value={value}>
      {children}
    </CedarOSContext.Provider>
  );
};

export default CedarOSContext;
