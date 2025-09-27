# OpenAI API Key Setup Guide

## 🔑 Getting Your OpenAI API Key

1. **Visit OpenAI Platform**: Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Sign In**: Use your OpenAI account (create one if you don't have it)
3. **Create API Key**: Click "Create new secret key"
4. **Copy the Key**: It will look like `sk-...` - copy this value
5. **Keep it Secret**: Never commit this key to version control!

## 🛠️ Setting Up Environment Variables

### Option 1: Create .env file in backend directory

Create a file called `.env` in the `backend/` directory:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-actual-api-key-here
DATABASE_PATH=./data/main.db
PORT=3001
NODE_ENV=development
```

### Option 2: Set environment variable directly

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=sk-your-actual-api-key-here
```

**macOS/Linux:**
```bash
export OPENAI_API_KEY="sk-your-actual-api-key-here"
```

## 🧪 Testing the Setup

Once you've set up your API key, test it by running:

```bash
cd backend
npx ts-node src/mastra/testRealAI.ts
```

This will:
- ✅ Check if your API key is configured
- ✅ Make a real OpenAI API call
- ✅ Fall back to simulation if the key is missing

## 🚀 Running with Real AI

After setting up your API key:

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test the orchestrator**:
   ```bash
   # In another terminal
   curl -X POST http://localhost:3001/api/orchestrator/your-project-id/propose \
     -H "Content-Type: application/json" \
     -d '{"userQuery": "Clean my dataset", "priorActions": []}'
   ```

## 🔒 Security Best Practices

- ✅ **Never commit** `.env` files to version control
- ✅ **Use different keys** for development and production
- ✅ **Set usage limits** on your OpenAI account
- ✅ **Monitor usage** in the OpenAI dashboard
- ✅ **Rotate keys** periodically

## 💰 Cost Management

- Start with small test queries to understand costs
- Monitor usage in the OpenAI dashboard
- Set up billing alerts
- Use `gpt-4o-mini` for development (cheaper than `gpt-4`)

## 🐛 Troubleshooting

**"No OPENAI_API_KEY found"**
- Make sure you created the `.env` file in the `backend/` directory
- Verify the environment variable name is exactly `OPENAI_API_KEY`
- Restart your development server after adding the key

**"Invalid API key"**
- Double-check the key format (should start with `sk-`)
- Ensure you copied the entire key without extra spaces
- Verify the key is active in your OpenAI dashboard

**"Rate limit exceeded"**
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

## 📚 Next Steps

Once your API key is working:
1. Test the CleanerAgent with real AI calls
2. Test the OrchestratorAgent routing decisions
3. Build additional agents (VisualizerAgent, ModelerAgent, etc.)
4. Integrate with your frontend application
