import React, { useState, useRef, useEffect } from 'react';
import { useCedarOS, type CanvasCard } from '../contexts/CedarOSContext';
import './Canvas.css';

interface CanvasProps {
  projectId: string;
}

const Canvas: React.FC<CanvasProps> = ({ projectId: _projectId }) => {
  const { 
    canvasCards, 
    addCanvasCard,
    updateCanvasCard, 
    removeCanvasCard,
    setSelectedColumn,
    currentDataset,
    datasetRows,
    datasetHeaders,
    datasetTypes,
    datasetTotalRows
  } = useCedarOS();
  
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [resizedCard, setResizedCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const rowHeight = 35; // Height of each row in pixels
  const visibleRows = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleRows + 5, datasetRows.length); // Add 5 buffer rows
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-create dataset card when currentDataset changes
  useEffect(() => {
    if (currentDataset && datasetRows.length > 0) {
      // Check if there's already a dataset card
      const hasDatasetCard = canvasCards.some(card => card.type === 'dataset');
      
      if (!hasDatasetCard) {
        addCanvasCard({
          type: 'dataset',
          title: currentDataset.name,
          x: 50,
          y: 50,
          width: 600,
          height: 400,
          data: currentDataset
        });
      }
    }
  }, [currentDataset, datasetRows, canvasCards, addCanvasCard]);

  // Handle card dragging
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      return; // Don't drag if clicking on resize handle
    }
    
    const card = canvasCards.find(c => c.id === cardId);
    if (!card) return;

    setDraggedCard(cardId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedCard) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    // Constrain to canvas bounds
    const constrainedX = Math.max(0, Math.min(newX, canvasRect.width - 200));
    const constrainedY = Math.max(0, Math.min(newY, canvasRect.height - 100));

    updateCanvasCard(draggedCard, { x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setDraggedCard(null);
  };

  // Handle card resizing
  const handleResizeStart = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const card = canvasCards.find(c => c.id === cardId);
    if (!card) return;

    setResizedCard(cardId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: card.width,
      height: card.height
    });
    
    e.preventDefault();
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizedCard) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    const newWidth = Math.max(200, resizeStart.width + deltaX);
    const newHeight = Math.max(100, resizeStart.height + deltaY);

    updateCanvasCard(resizedCard, { width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setResizedCard(null);
  };

  // Event listeners
  useEffect(() => {
    if (draggedCard) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedCard, dragOffset]);

  useEffect(() => {
    if (resizedCard) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizedCard, resizeStart]);



  // Handle column selection
  const handleColumnClick = (column: string) => {
    setSelectedColumn(column);
  };

  // Render dataset table
  const renderDatasetTable = () => {
    if (!currentDataset || datasetRows.length === 0) {
      return (
        <div className="dataset-table">
          <div className="table-header">
            <h4>No Dataset Available</h4>
            <span className="table-stats">Upload a dataset to get started</span>
          </div>
        </div>
      );
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    };

    const visibleRows = datasetRows.slice(startIndex, endIndex);
    const totalHeight = datasetRows.length * rowHeight;
    const offsetY = startIndex * rowHeight;

    return (
      <div className="dataset-table">
        <div className="table-header">
          <h4>{currentDataset.name}</h4>
          <span className="table-stats">
            {datasetTotalRows} rows × {datasetHeaders.length} columns
          </span>
        </div>
        <div className="table-container">
          <div className="table-scroll-container" onScroll={handleScroll} ref={(el) => {
            if (el) {
              setContainerHeight(el.clientHeight);
            }
          }}>
            <div style={{ height: totalHeight, position: 'relative' }}>
              <table style={{ transform: `translateY(${offsetY}px)` }}>
                <thead>
                  <tr>
                    {datasetHeaders.map((column: string, index: number) => (
                      <th 
                        key={index}
                        onClick={() => handleColumnClick(column)}
                        className="clickable-column"
                        title={`Type: ${datasetTypes[column] || 'unknown'}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIndex) => (
                    <tr key={startIndex + rowIndex} style={{ height: rowHeight }}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render agent card
  const renderAgentCard = (card: CanvasCard) => {
    return (
      <div className="agent-card">
        <div className="agent-header">
          <h4>{card.title}</h4>
          <div className="agent-status">
            <span className={`status-indicator ${card.progress === 100 ? 'completed' : 'running'}`}></span>
            {card.progress === 100 ? 'Completed' : 'Running...'}
          </div>
        </div>
        <div className="agent-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${card.progress || 0}%` }}
            ></div>
          </div>
          <span className="progress-text">{card.progress || 0}%</span>
        </div>
        <div className="agent-logs">
          <h5>Logs:</h5>
          <div className="logs-container">
            {(card.logs || []).map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render model card
  const renderModelCard = (card: CanvasCard) => {
    const modelData = card.data as any;
    const modelUrl = modelData?.filePath ? `http://localhost:3001${modelData.filePath.replace('./', '/')}` : null;
    console.log('Model card data:', modelData);
    console.log('Model URL:', modelUrl);
    
    return (
      <div className="model-card">
        <div className="model-content">
          {modelUrl ? (
            <img 
              src={modelUrl} 
              alt={card.title}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                border: '1px solid #e1e5e9',
                borderRadius: '4px'
              }}
              onError={(e) => {
                console.error('Failed to load model:', modelUrl);
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
          ) : null}
          <div 
            className="model-placeholder"
            style={{ display: modelUrl ? 'none' : 'block' }}
          >
            <div className="model-icon">🤖</div>
            <p>Model visualization would appear here</p>
          </div>
        </div>
      </div>
    );
  };

  // Render chart card
  const renderChartCard = (card: CanvasCard) => {
    const chartData = card.data as any;
    const chartUrl = chartData?.filePath ? `http://localhost:3001${chartData.filePath.replace('./', '/')}` : null;
    console.log('Chart card data:', chartData);
    console.log('Chart URL:', chartUrl);
    
    return (
      <div className="chart-card">
        <div className="chart-content">
          {chartUrl ? (
            <img 
              src={chartUrl} 
              alt={card.title}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                border: '1px solid #e1e5e9',
                borderRadius: '4px'
              }}
              onError={(e) => {
                console.error('Failed to load chart:', chartUrl);
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
          ) : null}
          <div 
            className="chart-placeholder"
            style={{ display: chartUrl ? 'none' : 'block' }}
          >
            <div className="chart-icon">📈</div>
            <p>Chart visualization would appear here</p>
          </div>
        </div>
      </div>
    );
  };

  // Render image card
  const renderImageCard = (card: CanvasCard) => {
    const imageData = card.data as any;
    const imageUrl = imageData?.filePath ? `http://localhost:3001${imageData.filePath.replace('./', '/')}` : null;
    console.log('Image card data:', imageData);
    console.log('Image URL:', imageUrl);
    
  return (
      <div className="image-card">
        <div className="image-header">
          <h4>🖼️ {card.title}</h4>
        </div>
        <div className="image-content">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={card.title}
              style={{ 
                width: '100%', 
                height: '200px', 
                objectFit: 'contain',
                border: '1px solid #e1e5e9',
                borderRadius: '4px'
              }}
              onError={(e) => {
                console.error('Failed to load image:', imageUrl);
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
          ) : null}
          <div 
            className="image-placeholder"
            style={{ display: imageUrl ? 'none' : 'block' }}
          >
            📷 Image Preview
            <br />
            <small>Failed to load image</small>
          </div>
        </div>
      </div>
    );
  };

  // Render card content based on type
  const renderCardContent = (card: CanvasCard) => {
    switch (card.type) {
      case 'dataset':
        return renderDatasetTable();
      case 'agent':
        return renderAgentCard(card);
      case 'model':
        return renderModelCard(card);
      case 'chart':
        return renderChartCard(card);
      case 'image':
        return renderImageCard(card);
      default:
        return <div>Unknown card type</div>;
    }
  };

  return (
    <div className="canvas">
      <div className="canvas-content" ref={canvasRef}>
        {canvasCards.length === 0 ? (
        <div className="welcome-message">
            <h3>Welcome to DataHex</h3>
            <p>Your data science workspace is ready. Upload files or select agents to get started.</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">📁</span>
              <span>Upload CSV, JSON, or Excel files</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <span>AI agents handle cleaning and analysis</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Interactive visualizations</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💡</span>
              <span>Explainable AI insights</span>
            </div>
          </div>
        </div>
        ) : (
          <div className="cards-container">
            {canvasCards.map((card) => (
              <div
                key={card.id}
                className={`canvas-card ${card.type} ${draggedCard === card.id ? 'dragging' : ''}`}
                style={{
                  left: card.x,
                  top: card.y,
                  width: card.width,
                  height: card.height,
                }}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
              >
                <div className="card-header" onMouseDown={(e) => e.stopPropagation()}>
                  <h4>{card.title}</h4>
                  <div className="card-actions">
                    <button 
                      className="card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCanvasCard(card.id, { isFullscreen: !card.isFullscreen });
                      }}
                    >
                      {card.isFullscreen ? '⤓' : '⤢'}
                    </button>
                    <button 
                      className="card-btn close"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCanvasCard(card.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="card-content">
                  {renderCardContent(card)}
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, card.id)}
                ></div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;