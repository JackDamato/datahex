import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import websocketService, { type WebSocketCallbacks } from '../services/websocketService';

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

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
  timestamp: string;
  error?: string;
  stats?: { [key: string]: { total: number, numeric: number, nonNumeric: number } };
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
  selectedColumns: string[];
  summaryStats: ColumnStats | null;
  correlationMatrix: CorrelationMatrix | null;
  chatMessages: ChatMessage[];
  agentProposals: AgentProposal[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // WebSocket state
  wsConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  streamingProgress: number;
  streamingMessage: string;
  isStreaming: boolean;
  
  // Visualization state
  currentVisualization: any | null;
  visualizationHistory: any[];
  
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
  setSelectedColumns: (columns: string[]) => void;
  addSelectedColumn: (column: string) => void;
  removeSelectedColumn: (column: string) => void;
  setSummaryStats: (stats: ColumnStats | null) => void;
  setCorrelationMatrix: (matrix: CorrelationMatrix | null) => void;
  updateSummaryStats: (projectId: string, columns: string[]) => Promise<void>;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addAgentProposal: (proposal: Omit<AgentProposal, 'id' | 'timestamp'>) => void;
  updateAgentProposal: (id: string, status: 'accepted' | 'rejected') => void;
  clearError: () => void;
  loadDataset: (projectId: string) => Promise<void>;
  
  // WebSocket actions
  connectWebSocket: (projectId: string) => Promise<void>;
  disconnectWebSocket: () => void;
  startCorrelationStreaming: (columns: string[]) => Promise<void>;
  startVisualizationStreaming: (chartType: string, columns: string[], options?: any) => Promise<void>;
  updateStreamingProgress: (progress: number, message: string) => void;
  setStreamingComplete: (data: any) => void;
  
  // Visualization actions
  setCurrentVisualization: (visualization: any) => void;
  addVisualizationToHistory: (visualization: any) => void;
  clearVisualizationHistory: () => void;
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
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState<ColumnStats | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentProposals, setAgentProposals] = useState<AgentProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WebSocket state
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [streamingProgress, setStreamingProgress] = useState<number>(0);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  
  // Visualization state
  const [currentVisualization, setCurrentVisualization] = useState<any | null>(null);
  const [visualizationHistory, setVisualizationHistory] = useState<any[]>([]);
  
  // Debug logging for fileTree changes
  useEffect(() => {
    console.log('CedarOS: fileTree changed to:', fileTree);
    console.log('CedarOS: fileTree length:', fileTree.length);
    if (fileTree.length > 0) {
      console.log('CedarOS: First file:', fileTree[0]);
    }
  }, [fileTree]);

  // Auto-update summary stats when selected columns change
  useEffect(() => {
    if (projectId && selectedColumns.length > 0) {
      updateSummaryStats(projectId, selectedColumns);
    }
  }, [selectedColumns, projectId]);

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

  const addSelectedColumn = (column: string) => {
    setSelectedColumns(prev => {
      if (!prev.includes(column)) {
        return [...prev, column];
      }
      return prev;
    });
  };

  const removeSelectedColumn = (column: string) => {
    setSelectedColumns(prev => prev.filter(col => col !== column));
  };

  const updateSummaryStats = async (projectId: string, columns: string[]) => {
    if (columns.length === 0) {
      setSummaryStats(null);
      setCorrelationMatrix(null);
      return;
    }

    try {
      // For single column, get detailed stats
      if (columns.length === 1) {
        const response = await fetch(`http://localhost:3001/api/projects/${projectId}/summary-stats/${columns[0]}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const stats = await response.json();
          setSummaryStats(stats);
        }
      }

      // For multiple columns, get correlation matrix
      if (columns.length > 1) {
        console.log(`📊 Requesting correlation matrix for columns: ${columns.join(', ')}`);
        const response = await fetch(`http://localhost:3001/api/projects/${projectId}/correlation-matrix`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ columns })
        });

        if (response.ok) {
          const matrix = await response.json();
          console.log(`📊 Correlation matrix received:`, matrix);
          setCorrelationMatrix(matrix);
        } else {
          const error = await response.json();
          console.error(`❌ Correlation matrix error:`, error);
          setCorrelationMatrix({
            columns: [],
            matrix: [],
            timestamp: new Date().toISOString(),
            error: error.error || 'Failed to calculate correlation matrix'
          });
        }
      }
    } catch (error) {
      console.error('Error updating summary stats:', error);
    }
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
      
      console.log('CedarOS: Dataset data received:', {
        id: datasetData.id,
        name: datasetData.name,
        headers: datasetData.headers,
        rowsLength: datasetData.rows.length,
        totalRows: datasetData.totalRows
      });
      
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
      
      console.log('CedarOS: Setting dataset state:', {
        currentDataset: dataset.name,
        datasetRowsLength: datasetData.rows.length,
        datasetHeaders: datasetData.headers
      });
      
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

  // ==================== WEBSOCKET METHODS ====================

  const connectWebSocket = async (projectId: string): Promise<void> => {
    try {
      setWsConnectionStatus('connecting');
      console.log('🔗 Connecting WebSocket for project:', projectId);
      
      const callbacks: WebSocketCallbacks = {
        onStatus: (message: string, progress: number) => {
          console.log('📊 WebSocket status:', message, progress);
          setStreamingMessage(message);
          setStreamingProgress(progress);
        },
        
        onProgress: (message: string, progress: number, data: any) => {
          console.log('📈 WebSocket progress:', message, progress, data);
          setStreamingMessage(message);
          setStreamingProgress(progress);
          
          // Update correlation matrix if provided
          if (data?.correlationMatrices) {
            setCorrelationMatrix({
              columns: data.correlationMatrices.pearson ? Object.keys(data.correlationMatrices.pearson) : [],
              matrix: data.correlationMatrices.pearson ? 
                Object.values(data.correlationMatrices.pearson).map((row: any) => 
                  Object.values(row)
                ) : [],
              timestamp: new Date().toISOString()
            });
          }
          
          // Update summary stats if provided
          if (data?.datasetInfo) {
            console.log('📊 Updating dataset info from WebSocket:', data.datasetInfo);
          }
        },
        
        onComplete: (data: any) => {
          console.log('✅ WebSocket analysis complete:', data);
          setStreamingMessage('Analysis completed!');
          setStreamingProgress(100);
          setIsStreaming(false);
          
          // Update final results
          if (data) {
            if (data.correlationMatrices) {
              setCorrelationMatrix({
                columns: data.correlationMatrices.pearson ? Object.keys(data.correlationMatrices.pearson) : [],
                matrix: data.correlationMatrices.pearson ? 
                  Object.values(data.correlationMatrices.pearson).map((row: any) => 
                    Object.values(row)
                  ) : [],
                timestamp: new Date().toISOString()
              });
            }
          }
        },
        
        onError: (error: string) => {
          console.error('❌ WebSocket error:', error);
          setError(`WebSocket error: ${error}`);
          setWsConnectionStatus('error');
          setIsStreaming(false);
        },
        
        onCorrelationComplete: (data: any) => {
          console.log('🔗 Correlation analysis complete via WebSocket:', data);
          setStreamingMessage('Correlation analysis completed!');
          setStreamingProgress(100);
          setIsStreaming(false);
          
          // Update correlation matrix with final results
          if (data?.correlation_matrices?.pearson) {
            const pearson = data.correlation_matrices.pearson;
            const columns = Object.keys(pearson);
            const matrix = columns.map(col => 
              columns.map(otherCol => pearson[col][otherCol])
            );
            
            setCorrelationMatrix({
              columns,
              matrix,
              timestamp: new Date().toISOString()
            });
          }
        },
        
        onVisualizationComplete: (data: any) => {
          console.log('📊 Visualization complete via WebSocket:', data);
          setStreamingMessage('Visualization completed!');
          setStreamingProgress(100);
          setIsStreaming(false);
          
          // Update current visualization
          setCurrentVisualization(data);
          addVisualizationToHistory(data);
        }
      };
      
      await websocketService.connect(projectId, callbacks);
      setWsConnectionStatus('connected');
      console.log('✅ WebSocket connected successfully');
      
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      setWsConnectionStatus('error');
      setError('Failed to connect to real-time updates');
    }
  };

  const disconnectWebSocket = (): void => {
    console.log('🔌 Disconnecting WebSocket');
    websocketService.disconnect();
    setWsConnectionStatus('disconnected');
    setIsStreaming(false);
    setStreamingProgress(0);
    setStreamingMessage('');
  };

  const startCorrelationStreaming = async (columns: string[]): Promise<void> => {
    if (!projectId) {
      setError('No project ID available for streaming');
      return;
    }

    try {
      setIsStreaming(true);
      setStreamingProgress(0);
      setStreamingMessage('Starting correlation analysis...');
      
      console.log('🌊 Starting correlation streaming for columns:', columns);
      
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/correlation/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columns })
      });

      if (!response.ok) {
        throw new Error(`Failed to start correlation streaming: ${response.statusText}`);
      }

      // The streaming will be handled by WebSocket callbacks
      console.log('✅ Correlation streaming started');
      
    } catch (error) {
      console.error('❌ Failed to start correlation streaming:', error);
      setError('Failed to start correlation analysis');
      setIsStreaming(false);
    }
  };

  const startVisualizationStreaming = async (chartType: string, columns: string[], options?: any): Promise<void> => {
    if (!projectId) {
      setError('No project ID available for streaming');
      return;
    }

    try {
      setIsStreaming(true);
      setStreamingProgress(0);
      setStreamingMessage('Starting visualization generation...');
      
      console.log('📊 Starting visualization streaming for chart type:', chartType, 'columns:', columns);
      
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/visualization/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chartType, columns, options })
      });

      if (!response.ok) {
        throw new Error(`Failed to start visualization streaming: ${response.statusText}`);
      }

      // The streaming will be handled by WebSocket callbacks
      console.log('✅ Visualization streaming started');
      
    } catch (error) {
      console.error('❌ Failed to start visualization streaming:', error);
      setError('Failed to start visualization generation');
      setIsStreaming(false);
    }
  };

  const updateStreamingProgress = (progress: number, message: string): void => {
    setStreamingProgress(progress);
    setStreamingMessage(message);
  };

  const setStreamingComplete = (data: any): void => {
    setIsStreaming(false);
    setStreamingProgress(100);
    setStreamingMessage('Analysis completed!');
    
    // Update final state with complete data
    if (data) {
      console.log('📊 Setting streaming complete with data:', data);
    }
  };

  // Visualization methods
  const addVisualizationToHistory = (visualization: any): void => {
    setVisualizationHistory(prev => [...prev, {
      ...visualization,
      id: `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearVisualizationHistory = (): void => {
    setVisualizationHistory([]);
  };

  // Auto-connect WebSocket when project changes
  useEffect(() => {
    if (projectId) {
      connectWebSocket(projectId);
      
      // Cleanup on unmount or project change
      return () => {
        disconnectWebSocket();
      };
    }
  }, [projectId]);

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
    selectedColumns,
    summaryStats,
    correlationMatrix,
    chatMessages,
    agentProposals,
    
    // UI state
    isLoading,
    error,
    
    // WebSocket state
    wsConnectionStatus,
    streamingProgress,
    streamingMessage,
    isStreaming,
    
    // Visualization state
    currentVisualization,
    visualizationHistory,
    
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
    setSelectedColumns,
    addSelectedColumn,
    removeSelectedColumn,
    setSummaryStats,
    setCorrelationMatrix,
    updateSummaryStats,
    addChatMessage,
    addAgentProposal,
    updateAgentProposal,
    clearError,
    loadDataset,
    
    // WebSocket actions
    connectWebSocket,
    disconnectWebSocket,
    startCorrelationStreaming,
    startVisualizationStreaming,
    updateStreamingProgress,
    setStreamingComplete,
    
    // Visualization actions
    setCurrentVisualization,
    addVisualizationToHistory,
    clearVisualizationHistory,
  };

  return (
    <CedarOSContext.Provider value={value}>
      {children}
    </CedarOSContext.Provider>
  );
};

export default CedarOSContext;
