import React, { useState, useEffect } from 'react';
import { useCedarOS } from '../contexts/CedarOSContext';
import './ModelingResults.css';

interface ModelResult {
  id: string;
  modelInfo: {
    algorithm: string;
    model_type: string;
    features_used: string[];
    target: string;
    train_samples: number;
    test_samples: number;
    feature_count: number;
  };
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    r2_score?: number;
    mean_squared_error?: number;
    mean_absolute_error?: number;
    rmse?: number;
    confusion_matrix?: number[][];
  };
  feature_importance: { [key: string]: number };
  cross_validation: {
    scores: number[];
    mean_score: number;
    std_score: number;
    cv_folds: number;
  };
  visualizations: { [key: string]: string };
  model_metadata: {
    trained_at: string;
    random_state: number;
    test_size: number;
  };
}

interface ModelingResultsProps {
  className?: string;
}

const ModelingResults: React.FC<ModelingResultsProps> = ({ className = '' }) => {
  const { 
    canvasCards, 
    addCanvasCard, 
    updateCanvasCard,
    currentDataset,
    datasetHeaders 
  } = useCedarOS();

  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Extract model results from canvas cards
  useEffect(() => {
    const models = canvasCards
      .filter(card => card.type === 'model' && card.data?.modelResult)
      .map(card => card.data.modelResult as ModelResult);
    setModelResults(models);
  }, [canvasCards]);

  // Handle model training
  const handleTrainModel = async (algorithm: string, modelType: 'classification' | 'regression') => {
    if (!currentDataset || datasetHeaders.length === 0) {
      alert('Please load a dataset first');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Call backend modeling endpoint
      const response = await fetch(`http://localhost:3001/api/projects/current/modeling/train`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: currentDataset.id,
          features: datasetHeaders.slice(0, 5), // Use first 5 columns as features
          target: datasetHeaders[datasetHeaders.length - 1], // Use last column as target
          model_type: modelType,
          algorithm: algorithm,
          test_size: 0.2,
          random_state: 42
        })
      });

      if (!response.ok) {
        throw new Error(`Model training failed: ${response.statusText}`);
      }

      const result = await response.json();
      setTrainingProgress(100);

      // Add model result to canvas
      const modelResult: ModelResult = {
        id: `model_${Date.now()}`,
        ...result
      };

      addCanvasCard({
        type: 'model',
        title: `${algorithm} ${modelType} Model`,
        x: Math.random() * 6,
        y: Math.random() * 4,
        w: 6,
        h: 8,
        data: { modelResult }
      });

      setModelResults(prev => [...prev, modelResult]);
      setSelectedModel(modelResult);

    } catch (error) {
      console.error('Model training failed:', error);
      alert('Model training failed. Please try again.');
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  // Handle model comparison
  const handleCompareModels = async () => {
    if (!currentDataset || datasetHeaders.length === 0) {
      alert('Please load a dataset first');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/projects/current/modeling/compare`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: currentDataset.id,
          features: datasetHeaders.slice(0, 5),
          target: datasetHeaders[datasetHeaders.length - 1],
          model_type: 'classification',
          algorithms: ['random_forest', 'logistic_regression', 'gradient_boosting', 'svm']
        })
      });

      if (!response.ok) {
        throw new Error(`Model comparison failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add comparison results to canvas
      addCanvasCard({
        type: 'model',
        title: 'Model Comparison Results',
        x: 0,
        y: 0,
        w: 12,
        h: 8,
        data: { comparisonResult: result }
      });

    } catch (error) {
      console.error('Model comparison failed:', error);
      alert('Model comparison failed. Please try again.');
    }
  };

  // Render model performance card
  const renderModelCard = (model: ModelResult) => {
    const isClassification = model.modelInfo.model_type === 'classification';
    const primaryMetric = isClassification ? 'accuracy' : 'r2_score';
    const primaryValue = model.metrics[primaryMetric] || 0;

    return (
      <div 
        key={model.id} 
        className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
        onClick={() => setSelectedModel(model)}
      >
        <div className="model-header">
          <h3 className="model-title">{model.modelInfo.algorithm}</h3>
          <span className="model-type">{model.modelInfo.model_type}</span>
        </div>
        
        <div className="model-metrics">
          <div className="primary-metric">
            <span className="metric-label">{primaryMetric.replace('_', ' ').toUpperCase()}</span>
            <span className="metric-value">{(primaryValue * 100).toFixed(1)}%</span>
          </div>
          
          <div className="secondary-metrics">
            {isClassification ? (
              <>
                <div className="metric-item">
                  <span className="metric-label">Precision</span>
                  <span className="metric-value">{(model.metrics.precision || 0).toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Recall</span>
                  <span className="metric-value">{(model.metrics.recall || 0).toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">F1 Score</span>
                  <span className="metric-value">{(model.metrics.f1_score || 0).toFixed(3)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="metric-item">
                  <span className="metric-label">RMSE</span>
                  <span className="metric-value">{(model.metrics.rmse || 0).toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">MAE</span>
                  <span className="metric-value">{(model.metrics.mean_absolute_error || 0).toFixed(3)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="model-info">
          <div className="info-item">
            <span className="info-label">Features</span>
            <span className="info-value">{model.modelInfo.feature_count}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Train/Test</span>
            <span className="info-value">{model.modelInfo.train_samples}/{model.modelInfo.test_samples}</span>
          </div>
          <div className="info-item">
            <span className="info-label">CV Score</span>
            <span className="info-value">{(model.cross_validation.mean_score * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="model-actions">
          <button 
            className="action-btn view-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedModel(model);
            }}
          >
            View Details
          </button>
          <button 
            className="action-btn export-btn"
            onClick={(e) => {
              e.stopPropagation();
              // Export model functionality
            }}
          >
            Export
          </button>
        </div>
      </div>
    );
  };

  // Render feature importance chart
  const renderFeatureImportance = (model: ModelResult) => {
    const features = Object.entries(model.feature_importance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return (
      <div className="feature-importance">
        <h4>Feature Importance</h4>
        <div className="importance-chart">
          {features.map(([feature, importance]) => (
            <div key={feature} className="importance-item">
              <span className="feature-name">{feature}</span>
              <div className="importance-bar">
                <div 
                  className="importance-fill"
                  style={{ width: `${(importance / Math.max(...Object.values(model.feature_importance))) * 100}%` }}
                ></div>
              </div>
              <span className="importance-value">{(importance * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render confusion matrix
  const renderConfusionMatrix = (model: ModelResult) => {
    if (!model.metrics.confusion_matrix) return null;

    const cm = model.metrics.confusion_matrix;
    const total = cm.flat().reduce((sum, val) => sum + val, 0);

    return (
      <div className="confusion-matrix">
        <h4>Confusion Matrix</h4>
        <div className="matrix-container">
          <div className="matrix-labels">
            <div className="matrix-label-y">Actual</div>
            <div className="matrix-label-x">Predicted</div>
          </div>
          <div className="matrix-grid">
            {cm.map((row, i) => (
              <div key={i} className="matrix-row">
                {row.map((cell, j) => (
                  <div 
                    key={j} 
                    className={`matrix-cell ${i === j ? 'diagonal' : ''}`}
                    style={{
                      backgroundColor: `rgba(0, 123, 255, ${(cell / Math.max(...cm.flat())) * 0.8 + 0.2})`,
                      color: cell > Math.max(...cm.flat()) / 2 ? 'white' : 'black'
                    }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render ROC curve
  const renderROCCurve = (model: ModelResult) => {
    if (!model.visualizations.roc_curve) return null;

    return (
      <div className="roc-curve">
        <h4>ROC Curve</h4>
        <div className="chart-container">
          <img 
            src={model.visualizations.roc_curve} 
            alt="ROC Curve" 
            className="chart-image"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`modeling-results ${className}`}>
      <div className="modeling-header">
        <div className="header-left">
          <h2>Modeling Results</h2>
          <span className="model-count">{modelResults.length} models trained</span>
        </div>
        <div className="header-actions">
          <button 
            className="train-btn"
            onClick={() => handleTrainModel('random_forest', 'classification')}
            disabled={isTraining}
          >
            {isTraining ? `Training... ${trainingProgress}%` : 'Train Random Forest'}
          </button>
          <button 
            className="compare-btn"
            onClick={handleCompareModels}
            disabled={isTraining}
          >
            Compare Models
          </button>
        </div>
      </div>

      {isTraining && (
        <div className="training-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${trainingProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">Training model...</span>
        </div>
      )}

      <div className="modeling-content">
        <div className="models-grid">
          {modelResults.map(renderModelCard)}
        </div>

        {selectedModel && (
          <div className="model-details">
            <div className="details-header">
              <h3>{selectedModel.modelInfo.algorithm} Model Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedModel(null)}
              >
                ×
              </button>
            </div>

            <div className="details-content">
              <div className="details-section">
                <h4>Model Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Algorithm</span>
                    <span className="info-value">{selectedModel.modelInfo.algorithm}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type</span>
                    <span className="info-value">{selectedModel.modelInfo.model_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Features</span>
                    <span className="info-value">{selectedModel.modelInfo.features_used.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Target</span>
                    <span className="info-value">{selectedModel.modelInfo.target}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trained At</span>
                    <span className="info-value">
                      {new Date(selectedModel.model_metadata.trained_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  {Object.entries(selectedModel.metrics).map(([key, value]) => (
                    <div key={key} className="metric-card">
                      <span className="metric-label">{key.replace('_', ' ').toUpperCase()}</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(4) : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-section">
                {renderFeatureImportance(selectedModel)}
              </div>

              <div className="details-section">
                {renderConfusionMatrix(selectedModel)}
              </div>

              <div className="details-section">
                {renderROCCurve(selectedModel)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelingResults;
