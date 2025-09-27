# Data Science Copilot API Documentation

## Overview

The Data Science Copilot API provides endpoints for chat interactions and streaming responses, powered by Mastra and integrated with CedarOS.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently using stub authentication. In production, this will use proper API keys or OAuth.

## Endpoints

### Health Check

**GET** `/health`

Returns the current status of the backend service.

**Response:**
```json
{
  "status": "ok",
  "message": "Data Science Copilot Backend is running"
}
```

### Chat API

**POST** `/chat`

Handles chat messages and returns responses from the AI agents.

**Request Body:**
```json
{
  "message": "string",
  "context": {
    "dataset": "optional dataset info",
    "session_id": "optional session identifier"
  }
}
```

**Response:**
```json
{
  "message": "Hello from backend (stub)",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "success"
}
```

### Streaming Chat API

**POST** `/chat/stream`

Handles chat messages and returns streaming responses using Server-Sent Events.

**Request Body:**
```json
{
  "message": "string",
  "context": {
    "dataset": "optional dataset info",
    "session_id": "optional session identifier"
  }
}
```

**Response (Server-Sent Events):**
```
data: {"type": "message", "content": "Hello from backend (stub) - streaming response", "timestamp": "2024-01-01T00:00:00.000Z"}

data: {"type": "message", "content": "CedarOS-Mastra integration is working!", "timestamp": "2024-01-01T00:00:01.000Z"}

data: {"type": "done", "content": "Stream complete", "timestamp": "2024-01-01T00:00:02.000Z"}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request
- `500`: Internal Server Error

Error responses include:
```json
{
  "error": "Error message description"
}
```

## CORS

The API is configured to accept requests from:
- `http://localhost:5173` (Frontend development server)

## Future Endpoints

Planned endpoints for future releases:

- `POST /agents/cleaner` - Data cleaning operations
- `POST /agents/analyst` - Feature engineering
- `POST /agents/visualizer` - Chart generation
- `POST /agents/modeler` - Model training
- `POST /agents/explainer` - Result explanation
- `GET /datasets` - List uploaded datasets
- `POST /datasets/upload` - Upload new dataset
- `GET /datasets/{id}/stats` - Get dataset statistics