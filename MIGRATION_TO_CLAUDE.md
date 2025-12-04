# Migration from OpenAI to Anthropic Claude

## ✅ Completed Changes

1. **Package Dependencies**
   - ✅ Removed `openai` package
   - ✅ Added `@anthropic-ai/sdk@^0.27.0`

2. **Code Updates**
   - ✅ Replaced OpenAI imports with Anthropic SDK
   - ✅ Updated API calls to use Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
   - ✅ Updated response parsing (Claude uses different response format)
   - ✅ Updated environment variable checks

## 🔧 Required Environment Variable Update

**Update your `.env.local` file:**

```bash
# OLD (remove this)
OPENAI_API_KEY=sk-...

# NEW (add this)
ANTHROPIC_API_KEY=sk-ant-...
```

## 📝 Key Differences

### API Format
- **OpenAI**: `openai.chat.completions.create()` with `response_format: { type: 'json_object' }`
- **Claude**: `anthropic.messages.create()` with `system` parameter separate from `messages`

### Response Parsing
- **OpenAI**: Direct JSON in `completion.choices[0].message.content`
- **Claude**: May wrap JSON in markdown code blocks, needs extraction

### Model
- **OpenAI**: `gpt-4-turbo-preview`
- **Claude**: `claude-3-5-sonnet-20241022` (latest stable)

## 🚀 Benefits of Claude 3.5 Sonnet

1. **Better Context Understanding**: Superior at understanding long conversations
2. **More Natural Responses**: Better at following instructions and maintaining context
3. **Cost Effective**: Competitive pricing for high-quality outputs
4. **Production Ready**: Stable API with excellent reliability

## 📚 Get Your API Key

1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy and add to `.env.local` as `ANTHROPIC_API_KEY`

## ✅ Testing

After updating your `.env.local`:
1. Restart your dev server
2. Test the AI search functionality
3. Verify responses are working correctly

