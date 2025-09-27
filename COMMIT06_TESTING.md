# Commit 06 Testing Guide

This document describes how to test the Commit 06 implementation for the MCP Python sandbox integration.

## Overview

Commit 06 implements:
- `POST /mcp/clean/drop_nulls` - Clean datasets by removing null values
- `POST /mcp/runtime/execute_python` - Execute Python code on datasets safely
- Backend integration with dataset version tracking
- Comprehensive test suite

## Prerequisites

1. **Backend running** on `http://localhost:3001`
2. **Sandbox running** on `http://localhost:8080`
3. **Python 3.11+** with required packages
4. **Node.js** with npm for backend tests

## Quick Start

### 1. Start Services

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm run dev

# Terminal 2: Start Sandbox
cd sandbox
pip install -r requirements.txt
python app.py
```

### 2. Run All Tests

```bash
# From project root
python run_commit06_tests.py
```

## Individual Test Suites

### 1. Sandbox Tests (pytest)

Tests the Python sandbox endpoints directly:

```bash
cd sandbox
python -m pytest tests/test_commit06_endpoints.py -v
```

**What it tests:**
- `/mcp/clean/drop_nulls` endpoint with various parameters
- `/mcp/runtime/execute_python` endpoint with different code samples
- Error handling for missing datasets, forbidden imports, timeouts
- Direct function calls to verify core logic

### 2. Backend Tests (Jest)

Tests the backend MCP client and routes:

```bash
cd backend
npm test
```

**What it tests:**
- MCP client connection to sandbox
- Backend routes for drop_nulls and execute_python
- Authentication requirements
- Dataset version tracking
- Error handling

### 3. Integration Tests (Node.js)

Tests the full backend-to-sandbox integration:

```bash
node backend/tests/test_mcp_integration.js
```

**What it tests:**
- End-to-end API calls through backend
- Database integration for dataset versions
- Authentication flow
- Error propagation

### 4. End-to-End Tests (Python)

Tests the complete user workflow:

```bash
python test_commit06_e2e.py
```

**What it tests:**
- Upload dataset → Clean → Execute Python → Verify results
- Dataset version history tracking
- File system operations
- Complete user journey

## Test Data

The tests create sample datasets with:
- Mixed data types (strings, numbers)
- Null values for testing cleaning operations
- Realistic business data (names, ages, salaries, departments)

## Expected Results

### Drop Nulls Operation
- **Input**: Dataset with null values
- **Output**: New parquet file with nulls removed
- **Database**: New `dataset_versions` entry created
- **API Response**: `{ newDatasetId, rows, summary }`

### Execute Python Operation
- **Input**: Dataset ID and Python code
- **Output**: New parquet file with processed data
- **Database**: New `dataset_versions` entry created
- **API Response**: `{ status, newDatasetId, stdout, stderr, summary }`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001 and 8080 are available
2. **Missing dependencies**: Run `pip install -r requirements.txt` in sandbox
3. **Database errors**: Delete `backend/data/main.db` to reset
4. **Permission errors**: Ensure write access to `sandbox/uploads/`

### Service Health Checks

```bash
# Check backend
curl http://localhost:3001/health

# Check sandbox
curl http://localhost:8080/health

# Check sandbox tools
curl http://localhost:8080/mcp/tools
```

### Debug Mode

Run tests with verbose output:

```bash
# Sandbox tests
python -m pytest sandbox/tests/test_commit06_endpoints.py -v -s

# Backend tests
cd backend && npm test -- --verbose

# E2E tests
python test_commit06_e2e.py
```

## Test Coverage

The test suite covers:
- ✅ **Unit tests** for individual functions
- ✅ **Integration tests** for API endpoints
- ✅ **End-to-end tests** for complete workflows
- ✅ **Error handling** for edge cases
- ✅ **Security validation** for Python code execution
- ✅ **Database operations** for version tracking
- ✅ **File system operations** for parquet handling

## Success Criteria

All tests must pass for Commit 06 to be considered complete:
- [ ] Sandbox endpoints working correctly
- [ ] Backend integration functioning
- [ ] Dataset version tracking operational
- [ ] Security measures in place
- [ ] Error handling comprehensive
- [ ] End-to-end workflow working

## Next Steps

After all tests pass:
1. Commit the changes to your branch
2. Create a pull request
3. Document any deployment requirements
4. Update the main README with new endpoints
