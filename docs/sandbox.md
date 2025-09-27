# Python MCP Tool Server Documentation

## Overview

The Python MCP (Model Context Protocol) Tool Server is a FastAPI-based microservice that provides data science capabilities for the Data Science Copilot project. It offers comprehensive data cleaning, statistical analysis, visualization, and machine learning functionality through a REST API.

## Architecture

### Project Structure
```
sandbox/
├── app.py                    # FastAPI main application
├── tools/                    # Data science tool modules
│   ├── cleaning.py          # Data cleaning operations
│   ├── stats.py             # Statistical analysis
│   ├── plotgen.py           # Plotly visualization generation
│   └── train.py             # Machine learning training
├── utils/
│   └── sandbox_runner.py    # Safe subprocess wrapper
├── tests/                   # Comprehensive test suite
│   ├── test_cleaning.py
│   ├── test_stats.py
│   ├── test_plotgen.py
│   └── test_train.py
├── test-data/
│   └── test_small.csv       # Sample dataset for testing
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
└── .dockerignore           # Docker ignore patterns
```

### Technology Stack
- **Framework**: FastAPI
- **Data Processing**: pandas, numpy
- **Machine Learning**: scikit-learn
- **Visualization**: Plotly
- **Containerization**: Docker
- **Testing**: pytest
- **Server**: Uvicorn

## API Endpoints

### Health Check
- **GET** `/health`
- **Response**: `{"status": "ok"}`

### Tools List
- **GET** `/mcp/tools`
- **Response**: List of available tools and their parameters

### Data Cleaning
- **POST** `/mcp/clean/drop_nulls`
- **Purpose**: Remove rows with null values from datasets
- **Request Body**:
  ```json
  {
    "dataset_path": "string",
    "columns": ["string"]  // Optional: specific columns to check
  }
  ```
- **Response**:
  ```json
  {
    "newDatasetPath": "string",
    "rows": 0,
    "columns": 0,
    "summary": "string"
  }
  ```

### Statistical Analysis
- **POST** `/mcp/stats/summary`
- **Purpose**: Compute summary statistics for a column
- **Request Body**:
  ```json
  {
    "dataset_path": "string",
    "column": "string"
  }
  ```
- **Response**:
  ```json
  {
    "mean": 0,
    "median": 0,
    "std": 0,
    "nullPct": 0,
    "histogram": [
      {
        "bin_start": 0,
        "bin_end": 0,
        "count": 0,
        "bin_center": 0
      }
    ]
  }
  ```

### Plot Generation
- **POST** `/mcp/plot/generate`
- **Purpose**: Generate Plotly visualizations
- **Request Body**:
  ```json
  {
    "dataset_path": "string",
    "type": "histogram|scatter|heatmap",
    "columns": ["string"]
  }
  ```
- **Response**:
  ```json
  {
    "plotly_json": {
      "data": [...],
      "layout": {...}
    }
  }
  ```

### Machine Learning Training
- **POST** `/mcp/train`
- **Purpose**: Train machine learning models
- **Request Body**:
  ```json
  {
    "dataset_path": "string",
    "features": ["string"],
    "target": "string",
    "type": "regression|classification"
  }
  ```
- **Response**:
  ```json
  {
    "metrics": {
      "r2_score": 0,
      "mse": 0,
      "rmse": 0,
      "mae": 0
    },
    "artifactPath": "string"
  }
  ```

## Data Science Tools

### 1. Data Cleaning (`tools/cleaning.py`)

#### `drop_nulls(dataset_path, columns=None)`
- **Purpose**: Remove rows with null values
- **Parameters**:
  - `dataset_path`: Path to the dataset file
  - `columns`: Optional list of columns to check for nulls
- **Supported Formats**: CSV, Parquet, Excel (.xlsx, .xls)
- **Returns**: Dictionary with cleaned dataset info

#### `get_dataset_info(dataset_path)`
- **Purpose**: Get basic information about a dataset
- **Returns**: Row count, column count, column names, data types, memory usage, null counts

### 2. Statistical Analysis (`tools/stats.py`)

#### `compute_summary_stats(dataset_path, column)`
- **Purpose**: Compute comprehensive statistics for a numeric column
- **Returns**: Mean, median, standard deviation, null percentage, histogram data

#### `compute_correlation_matrix(dataset_path, columns=None)`
- **Purpose**: Compute correlation matrix for numeric columns
- **Returns**: Correlation matrix with high correlation highlights

#### `detect_outliers(dataset_path, column, method="iqr")`
- **Purpose**: Detect outliers using IQR or Z-score methods
- **Parameters**:
  - `method`: "iqr" or "zscore"
- **Returns**: Outlier count, percentage, values, and bounds

### 3. Plot Generation (`tools/plotgen.py`)

#### `generate_plot(dataset_path, plot_type, columns)`
- **Purpose**: Generate Plotly visualizations
- **Plot Types**:
  - `histogram`: Single or multiple column histograms
  - `scatter`: Two-column scatter plots with trend lines
  - `heatmap`: Correlation heatmaps for multiple columns
- **Returns**: Plotly JSON configuration

#### Key Features:
- Automatic numeric column filtering
- Subplot generation for multiple columns
- Trend line fitting for scatter plots
- Color-coded correlation heatmaps
- Numpy array serialization handling

### 4. Machine Learning Training (`tools/train.py`)

#### `train_model(dataset_path, features, target, model_type)`
- **Purpose**: Train scikit-learn models
- **Model Types**:
  - `regression`: LinearRegression for continuous targets
  - `classification`: LogisticRegression for categorical targets
- **Features**:
  - Automatic data preprocessing
  - Categorical variable encoding
  - Missing value handling
  - Feature scaling
  - Stratified train/test splitting
  - Model artifact persistence

#### `load_model_artifact(artifact_path)`
- **Purpose**: Load saved model artifacts
- **Returns**: Complete model package with model, scaler, and metadata

## Testing

### Test Coverage
- **Total Tests**: 67
- **Coverage**: 100% pass rate
- **Test Categories**:
  - Data cleaning operations
  - Statistical computations
  - Plot generation
  - Machine learning training
  - Error handling
  - Edge cases

### Running Tests
```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_cleaning.py -v

# Run with coverage
python -m pytest tests/ --cov=tools
```

### Test Data
- **File**: `test-data/test_small.csv`
- **Rows**: 26
- **Columns**: 6 (name, age, salary, department, experience_years, performance_score)
- **Purpose**: Comprehensive testing of all data science operations

## Docker Deployment

### Building the Container
```bash
docker build -t python-sandbox .
```

### Running the Container
```bash
# Run in background
docker run -d -p 8080:8080 --name python-sandbox-api python-sandbox

# Run in foreground (for debugging)
docker run -p 8080:8080 python-sandbox
```

### Container Configuration
- **Base Image**: python:3.11-slim
- **Port**: 8080
- **Working Directory**: /sandbox
- **Dependencies**: Installed via requirements.txt
- **Directories**: artifacts/, cleaned/, uploads/

## Dependencies

### Core Dependencies (`requirements.txt`)
```
fastapi
uvicorn[standard]
pandas
pyarrow
scikit-learn
plotly
pytest
```

### System Dependencies (Dockerfile)
- gcc, g++ (for compiling Python packages)
- Python 3.11 runtime

## Error Handling

### Exception Types
- **FileNotFoundError**: Dataset file doesn't exist
- **ValueError**: Invalid parameters or data types
- **KeyError**: Column not found in dataset
- **Exception**: Generic processing errors

### Error Responses
- **400**: Bad Request (validation errors)
- **404**: Not Found (file not found)
- **500**: Internal Server Error (processing errors)

## Performance Considerations

### Memory Management
- Efficient pandas operations
- Lazy loading of large datasets
- Proper cleanup of temporary files

### Processing Time
- Subprocess execution with 60-second timeout
- Optimized data type handling
- Efficient numpy array operations

### Scalability
- Stateless API design
- Container-based deployment
- Horizontal scaling capability

## Security Features

### Input Validation
- File path validation
- Column name verification
- Data type checking
- Parameter sanitization

### Safe Execution
- Subprocess isolation
- Timeout protection
- Resource limits
- Error containment

## Integration

### MCP Protocol Compliance
- Standard REST API endpoints
- JSON request/response format
- Tool discovery mechanism
- Error reporting standards

### Backend Integration
- HTTP client compatibility
- CORS support
- Authentication ready
- Logging integration

## Usage Examples

### Python Client
```python
import requests

# Data cleaning
response = requests.post('http://localhost:8080/mcp/clean/drop_nulls', json={
    "dataset_path": "data.csv",
    "columns": ["age", "salary"]
})

# Statistical analysis
response = requests.post('http://localhost:8080/mcp/stats/summary', json={
    "dataset_path": "data.csv",
    "column": "age"
})

# Plot generation
response = requests.post('http://localhost:8080/mcp/plot/generate', json={
    "dataset_path": "data.csv",
    "type": "histogram",
    "columns": ["age"]
})

# Machine learning
response = requests.post('http://localhost:8080/mcp/train', json={
    "dataset_path": "data.csv",
    "features": ["age", "experience"],
    "target": "salary",
    "type": "regression"
})
```

### cURL Examples
```bash
# Health check
curl http://localhost:8080/health

# Data cleaning
curl -X POST http://localhost:8080/mcp/clean/drop_nulls \
  -H "Content-Type: application/json" \
  -d '{"dataset_path": "data.csv", "columns": ["age"]}'

# Statistics
curl -X POST http://localhost:8080/mcp/stats/summary \
  -H "Content-Type: application/json" \
  -d '{"dataset_path": "data.csv", "column": "age"}'
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
- Check Docker is running
- Verify port 8080 is available
- Check container logs: `docker logs python-sandbox-api`

#### 2. API Errors
- Verify dataset file exists
- Check column names are correct
- Ensure data types are appropriate

#### 3. Plot Generation Issues
- Ensure columns are numeric
- Check for sufficient data points
- Verify plot type is supported

#### 4. Memory Issues
- Use smaller datasets for testing
- Check available system memory
- Monitor container resource usage

### Debugging
```bash
# Check container status
docker ps

# View container logs
docker logs python-sandbox-api

# Access container shell
docker exec -it python-sandbox-api /bin/bash

# Check API health
curl http://localhost:8080/health
```

## Future Enhancements

### Planned Features
- Additional plot types (box plots, violin plots)
- More machine learning algorithms
- Data transformation tools
- Export functionality
- Batch processing
- Real-time streaming

### Performance Improvements
- Caching mechanisms
- Parallel processing
- Memory optimization
- Response compression

## Changelog

### Commit 4 - Initial Implementation
- ✅ Complete FastAPI application
- ✅ Four data science tool modules
- ✅ Comprehensive test suite (67 tests)
- ✅ Docker containerization
- ✅ Interactive API documentation
- ✅ Error handling and validation
- ✅ Numpy serialization fixes
- ✅ Production-ready deployment

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run tests: `python -m pytest tests/ -v`
4. Start development server: `uvicorn app:app --reload`

### Code Standards
- Follow PEP 8 style guidelines
- Add comprehensive docstrings
- Include type hints
- Write tests for new features
- Update documentation

### Testing Requirements
- All tests must pass
- New features require tests
- Maintain 100% test coverage
- Include edge case testing

---

**Status**: Production Ready ✅  
**Last Updated**: September 27, 2025  
**Version**: 1.0.0
