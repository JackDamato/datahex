import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useCedarOS } from '../contexts/CedarOSContext';
import Plot from 'react-plotly.js';
import './ChartCanvas.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ChartItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'chart' | 'dataset' | 'agent';
  title: string;
  data?: any;
  plotlyJson?: any;
  pngPreview?: string;
  isFullscreen?: boolean;
}

interface ChartCanvasProps {
  className?: string;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({ className = '' }) => {
  const { 
    currentVisualization, 
    visualizationHistory,
    currentDataset,
    datasetRows,
    datasetHeaders,
    canvasCards,
    addCanvasCard,
    updateCanvasCard,
    removeCanvasCard
  } = useCedarOS();

  const [layouts, setLayouts] = useState<{ [key: string]: any }>({});
  const [fullscreenItem, setFullscreenItem] = useState<ChartItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Convert canvas cards to chart items
  const chartItems: ChartItem[] = canvasCards.map(card => ({
    i: card.id,
    x: card.x || 0,
    y: card.y || 0,
    w: card.w || 6,
    h: card.h || 4,
    type: card.type as 'chart' | 'dataset' | 'agent',
    title: card.title,
    data: card.data,
    plotlyJson: card.plotlyJson,
    pngPreview: card.pngPreview,
    isFullscreen: false
  }));

  // Add current visualization as a chart item
  useEffect(() => {
    if (currentVisualization && !chartItems.find(item => item.i === 'current-viz')) {
      const vizItem: ChartItem = {
        i: 'current-viz',
        x: 0,
        y: 0,
        w: 8,
        h: 6,
        type: 'chart',
        title: `${currentVisualization.chart_type} Chart`,
        plotlyJson: currentVisualization.plotly_json,
        pngPreview: currentVisualization.png_preview,
        data: currentVisualization
      };
      
      addCanvasCard({
        type: 'chart',
        title: vizItem.title,
        x: vizItem.x,
        y: vizItem.y,
        w: vizItem.w,
        h: vizItem.h,
        data: vizItem.data,
        plotlyJson: vizItem.plotlyJson,
        pngPreview: vizItem.pngPreview
      });
    }
  }, [currentVisualization, addCanvasCard]);

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: any, layouts: any) => {
    setLayouts(layouts);
    
    // Update canvas cards with new positions
    layout.forEach((item: any) => {
      updateCanvasCard(item.i, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      });
    });
  }, [updateCanvasCard]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag stop
  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle resize
  const handleResize = useCallback((layout: any, oldItem: any, newItem: any) => {
    updateCanvasCard(newItem.i, {
      w: newItem.w,
      h: newItem.h
    });
  }, [updateCanvasCard]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback((item: ChartItem) => {
    if (fullscreenItem?.i === item.i) {
      setFullscreenItem(null);
    } else {
      setFullscreenItem(item);
    }
  }, [fullscreenItem]);

  // Close fullscreen
  const closeFullscreen = useCallback(() => {
    setFullscreenItem(null);
  }, []);

  // Render chart content
  const renderChartContent = (item: ChartItem) => {
    if (item.type === 'chart' && item.plotlyJson) {
      return (
        <div className="chart-content">
          <Plot
            data={item.plotlyJson.data || []}
            layout={{
              ...item.plotlyJson.layout,
              autosize: true,
              margin: { l: 40, r: 40, t: 40, b: 40 },
              showlegend: true
            }}
            config={{
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      );
    }

    if (item.type === 'dataset' && currentDataset) {
      return (
        <div className="dataset-content">
          <div className="dataset-header">
            <h4>{currentDataset.name}</h4>
            <span className="dataset-info">
              {currentDataset.rows} rows × {currentDataset.columns} columns
            </span>
          </div>
          <div className="dataset-table">
            <table>
              <thead>
                <tr>
                  {datasetHeaders.slice(0, 5).map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                  {datasetHeaders.length > 5 && <th>...</th>}
                </tr>
              </thead>
              <tbody>
                {datasetRows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.slice(0, 5).map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                    {datasetHeaders.length > 5 && <td>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {datasetRows.length > 10 && (
              <div className="dataset-more">
                ... and {datasetRows.length - 10} more rows
              </div>
            )}
          </div>
        </div>
      );
    }

    if (item.type === 'agent') {
      return (
        <div className="agent-content">
          <div className="agent-header">
            <h4>{item.title}</h4>
            <span className="agent-status">Active</span>
          </div>
          <div className="agent-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '75%' }}></div>
            </div>
            <span className="progress-text">Processing data...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="empty-content">
        <div className="empty-icon">📊</div>
        <p>No content available</p>
      </div>
    );
  };

  // Render chart item
  const renderChartItem = (item: ChartItem) => (
    <div key={item.i} className={`chart-item ${item.type} ${isDragging ? 'dragging' : ''}`}>
      <div className="chart-header">
        <h3 className="chart-title">{item.title}</h3>
        <div className="chart-actions">
          <button 
            className="action-btn fullscreen-btn"
            onClick={() => toggleFullscreen(item)}
            title="Toggle fullscreen"
          >
            {fullscreenItem?.i === item.i ? '⤓' : '⤢'}
          </button>
          <button 
            className="action-btn close-btn"
            onClick={() => removeCanvasCard(item.i)}
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>
      <div className="chart-body">
        {renderChartContent(item)}
      </div>
      {item.pngPreview && (
        <div className="chart-preview">
          <img src={item.pngPreview} alt="Chart preview" />
        </div>
      )}
    </div>
  );

  // Render fullscreen modal
  const renderFullscreenModal = () => {
    if (!fullscreenItem) return null;

    return (
      <div className="fullscreen-modal" onClick={closeFullscreen}>
        <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
          <div className="fullscreen-header">
            <h2>{fullscreenItem.title}</h2>
            <button className="close-btn" onClick={closeFullscreen}>×</button>
          </div>
          <div className="fullscreen-body">
            {renderChartContent(fullscreenItem)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`chart-canvas ${className}`}>
      <div className="canvas-toolbar">
        <div className="toolbar-left">
          <h2>Chart Canvas</h2>
          <span className="item-count">{chartItems.length} items</span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn" title="Add Chart">
            📊
          </button>
          <button className="toolbar-btn" title="Add Dataset">
            📋
          </button>
          <button className="toolbar-btn" title="Clear All">
            🗑️
          </button>
        </div>
      </div>

      <div className="canvas-grid" ref={gridRef}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onResize={handleResize}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={true}
          isResizable={true}
          margin={[16, 16]}
          containerPadding={[16, 16]}
        >
          {chartItems.map(renderChartItem)}
        </ResponsiveGridLayout>
      </div>

      {renderFullscreenModal()}
    </div>
  );
};

export default ChartCanvas;
