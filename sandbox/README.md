# Data Science Copilot Python Sandbox

This directory contains the Python sandbox for the Data Science Copilot platform. It provides a secure environment for running data science operations and AI agent tasks.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

The sandbox is designed to be called by the Mastra backend agents. It provides:

- Data loading and validation
- Basic data cleaning operations
- Statistical analysis
- Visualization generation (placeholder)
- Correlation analysis

## Architecture

- `main.py`: Main sandbox class and entry point
- `requirements.txt`: Python dependencies
- `README.md`: This documentation

## Future Enhancements

- Docker containerization for security
- Agent-specific modules
- Real-time visualization generation
- Model training capabilities
- Integration with external data sources
