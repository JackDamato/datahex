import React, { useState, useEffect } from 'react';
import { useCedarOS } from '../contexts/CedarOSContext';
import './DemoMode.css';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const DemoMode: React.FC = () => {
  const { 
    projectId, 
    currentDataset,
    startCorrelationStreaming,
    startVisualizationStreaming,
    addCanvasCard,
    updateCanvasCard
  } = useCedarOS();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const demoSteps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DataHex Demo',
      description: 'This demo will walk you through the complete data analysis workflow using AI agents.',
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      },
      duration: 2000,
      status: 'pending'
    },
    {
      id: 'data_upload',
      title: 'Data Upload & Analysis',
      description: 'Uploading sample dataset and running initial data quality analysis...',
      action: async () => {
        // Simulate data upload and analysis
        await new Promise(resolve => setTimeout(resolve, 3000));
      },
      duration: 3000,
      status: 'pending'
    },
    {
      id: 'data_cleaning',
      title: 'Data Cleaning',
      description: 'AI Cleaner agent identifies and fixes data quality issues...',
      action: async () => {
        // Simulate data cleaning
        addCanvasCard({
          type: 'agent',
          title: 'Data Cleaning Complete',
          x: 0,
          y: 0,
          w: 4,
          h: 3,
          data: {
            agent: 'cleaner',
            status: 'completed',
            results: {
              issues_found: 15,
              issues_fixed: 12,
              data_quality_score: 0.85
            }
          }
        });
        await new Promise(resolve => setTimeout(resolve, 2500));
      },
      duration: 2500,
      status: 'pending'
    },
    {
      id: 'feature_engineering',
      title: 'Feature Engineering',
      description: 'Analyst agent creates new features and transforms existing ones...',
      action: async () => {
        // Simulate feature engineering
        addCanvasCard({
          type: 'agent',
          title: 'Feature Engineering Complete',
          x: 4,
          y: 0,
          w: 4,
          h: 3,
          data: {
            agent: 'analyst',
            status: 'completed',
            results: {
              new_features: 8,
              transformations: ['log_transform', 'scaling', 'one_hot_encoding'],
              feature_importance: 0.92
            }
          }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      },
      duration: 3000,
      status: 'pending'
    },
    {
      id: 'correlation_analysis',
      title: 'Correlation Analysis',
      description: 'Running correlation analysis to identify relationships between variables...',
      action: async () => {
        // Simulate correlation analysis
        if (currentDataset) {
          await startCorrelationStreaming(['age', 'salary', 'score']);
        }
        await new Promise(resolve => setTimeout(resolve, 4000));
      },
      duration: 4000,
      status: 'pending'
    },
    {
      id: 'visualization',
      title: 'Data Visualization',
      description: 'Creating interactive charts and visualizations...',
      action: async () => {
        // Simulate visualization generation
        if (currentDataset) {
          await startVisualizationStreaming('scatter', ['age', 'salary']);
        }
        addCanvasCard({
          type: 'chart',
          title: 'Age vs Salary Scatter Plot',
          x: 0,
          y: 3,
          w: 6,
          h: 4,
          data: {
            chartType: 'scatter',
            columns: ['age', 'salary'],
            insights: ['Strong positive correlation', 'Outliers detected']
          }
        });
        await new Promise(resolve => setTimeout(resolve, 3500));
      },
      duration: 3500,
      status: 'pending'
    },
    {
      id: 'modeling',
      title: 'Machine Learning',
      description: 'Training machine learning models for prediction...',
      action: async () => {
        // Simulate model training
        addCanvasCard({
          type: 'model',
          title: 'Random Forest Model',
          x: 6,
          y: 3,
          w: 6,
          h: 4,
          data: {
            modelResult: {
              algorithm: 'Random Forest',
              accuracy: 0.89,
              precision: 0.87,
              recall: 0.91,
              f1_score: 0.89
            }
          }
        });
        await new Promise(resolve => setTimeout(resolve, 4000));
      },
      duration: 4000,
      status: 'pending'
    },
    {
      id: 'insights',
      title: 'AI Insights & Recommendations',
      description: 'Explainer agent provides insights and recommendations...',
      action: async () => {
        // Simulate AI insights
        addCanvasCard({
          type: 'insights',
          title: 'AI Insights',
          x: 0,
          y: 7,
          w: 12,
          h: 3,
          data: {
            insights: [
              'Strong correlation between age and salary (r=0.78)',
              'Model accuracy of 89% indicates good predictive power',
              'Recommend feature scaling for better performance'
            ],
            recommendations: [
              'Consider collecting more data for underrepresented groups',
              'Feature engineering improved model performance by 15%',
              'Regular retraining recommended every 3 months'
            ]
          }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      },
      duration: 3000,
      status: 'pending'
    }
  ];

  const startDemo = async () => {
    setIsRunning(true);
    setIsCompleted(false);
    setCurrentStep(0);
    setProgress(0);

    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      const step = demoSteps[i];
      
      try {
        step.status = 'running';
        await step.action();
        step.status = 'completed';
      } catch (error) {
        console.error(`Demo step ${step.id} failed:`, error);
        step.status = 'error';
      }

      setProgress(((i + 1) / demoSteps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between steps
    }

    setIsRunning(false);
    setIsCompleted(true);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStep(0);
    setProgress(0);
    demoSteps.forEach(step => {
      step.status = 'pending';
    });
  };

  const currentStepData = demoSteps[currentStep];

  return (
    <div className="demo-mode">
      <div className="demo-header">
        <div className="demo-title">
          <h2>🚀 Demo Mode</h2>
          <p>Experience the complete DataHex workflow with AI agents</p>
        </div>
        <div className="demo-actions">
          {!isRunning && !isCompleted && (
            <button className="start-demo-btn" onClick={startDemo}>
              Start Demo
            </button>
          )}
          {isCompleted && (
            <button className="restart-demo-btn" onClick={resetDemo}>
              Restart Demo
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="demo-progress">
          <div className="progress-header">
            <h3>{currentStepData?.title}</h3>
            <span className="step-counter">
              Step {currentStep + 1} of {demoSteps.length}
            </span>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="progress-description">
            {currentStepData?.description}
          </p>
        </div>
      )}

      <div className="demo-steps">
        <h4>Demo Workflow</h4>
        <div className="steps-list">
          {demoSteps.map((step, index) => (
            <div 
              key={step.id} 
              className={`step-item ${step.status} ${index === currentStep ? 'current' : ''}`}
            >
              <div className="step-icon">
                {step.status === 'completed' && '✅'}
                {step.status === 'running' && '⏳'}
                {step.status === 'error' && '❌'}
                {step.status === 'pending' && (index + 1)}
              </div>
              <div className="step-content">
                <h5>{step.title}</h5>
                <p>{step.description}</p>
                {step.status === 'running' && (
                  <div className="step-progress">
                    <div className="step-progress-bar"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCompleted && (
        <div className="demo-completion">
          <div className="completion-icon">🎉</div>
          <h3>Demo Complete!</h3>
          <p>
            You've seen how DataHex uses AI agents to automate the entire data science workflow. 
            From data cleaning to machine learning, everything is handled intelligently.
          </p>
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-number">8</span>
              <span className="stat-label">AI Agents</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">89%</span>
              <span className="stat-label">Model Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">15</span>
              <span className="stat-label">Data Issues Fixed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">8</span>
              <span className="stat-label">New Features</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMode;
