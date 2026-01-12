# 📊 Token Limits & Document Size Guide

## Current Token Limits by Provider

The application now automatically checks document size and provides helpful feedback when limits are exceeded.

### Token Limits (Input + Output Combined)

| Provider | Model | Token Limit | Character Limit* | Recommended Max |
|----------|-------|-------------|------------------|-----------------|
| **OpenAI** | GPT-4 | ~8K tokens | ~24,000 chars | ~14,000 chars |
| **OpenAI** | GPT-4 Turbo | ~128K tokens | ~384,000 chars | ~230,000 chars |
| **OpenAI** | GPT-3.5 Turbo | ~16K tokens | ~48,000 chars | ~29,000 chars |
| **Anthropic** | Claude 3 Opus | ~200K tokens | ~600,000 chars | ~360,000 chars |
| **Anthropic** | Claude 3 Sonnet | ~200K tokens | ~600,000 chars | ~360,000 chars |
| **Anthropic** | Claude 3 Haiku | ~200K tokens | ~600,000 chars | ~360,000 chars |
| **Google** | Gemini Pro | ~32K tokens | ~96,000 chars | ~58,000 chars |
| **Google** | Gemini Pro Vision | ~16K tokens | ~48,000 chars | ~29,000 chars |

*Approximate conversion: 1 token ≈ 4 characters (varies by language and content)

## What Happens When You Exceed Limits

### Automatic Handling

The application now:

1. **Checks document size** before sending to LLM
2. **Estimates token count** (characters ÷ 4)
3. **Compares to model limit**
4. **Shows warning** if document is too large
5. **Truncates automatically** if necessary
6. **Falls back to local extraction** if LLM fails

### Warning Message

When you upload a large PDF, you'll see:

```
⚠️ Document is very large (50,000 characters).

Current limit for openai (gpt-4): ~6,000 tokens

The document will be truncated to the first 14,400 characters.

Tip: Use a model with higher limits:
- OpenAI: GPT-4 Turbo (100K tokens)
- Anthropic: Claude 3 (150K tokens)
- Google: Gemini Pro (25K tokens)
```

### Fallback Behavior

If LLM extraction fails:
```
"LLM extraction failed. Using local extraction as fallback."
```

The application will use the local semantic extraction (keyword-based) instead.

## Recommended Solutions

### Option 1: Use a Model with Higher Limits

**Best for large documents:**

1. **Anthropic Claude 3** (Recommended)
   - 200K token limit
   - Excellent for long documents
   - ~360,000 characters supported
   - Best quality for educational content

2. **OpenAI GPT-4 Turbo**
   - 128K token limit
   - Good for large documents
   - ~230,000 characters supported
   - High quality output

3. **Google Gemini Pro**
   - 32K token limit
   - Moderate document size
   - ~58,000 characters supported
   - Good balance of cost and quality

### Option 2: Split Your Document

For very large documents:

1. **Split into sections**
   - Divide PDF into logical chapters/sections
   - Process each section separately
   - Combine results manually

2. **Extract key sections**
   - Select most important pages
   - Focus on core content
   - Skip appendices, references, etc.

### Option 3: Use Local Extraction

For documents that exceed even the highest limits:

1. **Disable LLM** (set provider to "none")
2. **Use local semantic extraction**
3. **Edit generated content** manually
4. **Quality will be lower** but functional

## How to Change Your Model

### In the Application

1. Click **⚙️ Settings** icon (top right)
2. Select **Provider** (OpenAI, Anthropic, or Google)
3. Select **Model** with higher token limit
4. Enter **API Key**
5. Click **Save Settings**

### Recommended Models by Document Size

| Document Size | Recommended Model | Provider |
|---------------|-------------------|----------|
| < 14,000 chars | GPT-4 | OpenAI |
| 14K - 29K chars | GPT-3.5 Turbo | OpenAI |
| 29K - 58K chars | Gemini Pro | Google |
| 58K - 230K chars | GPT-4 Turbo | OpenAI |
| 230K+ chars | Claude 3 Opus/Sonnet | Anthropic |

## Understanding Token Counts

### What is a Token?

- A token is a piece of text (word, part of word, or punctuation)
- English: ~1 token = 0.75 words = 4 characters
- Other languages may use more tokens

### Example Token Counts

| Text Type | Characters | Estimated Tokens | Fits in GPT-4? | Fits in Claude 3? |
|-----------|------------|------------------|----------------|-------------------|
| Short article | 5,000 | ~1,250 | ✅ Yes | ✅ Yes |
| Medium article | 20,000 | ~5,000 | ✅ Yes | ✅ Yes |
| Long article | 50,000 | ~12,500 | ❌ No | ✅ Yes |
| Small book chapter | 100,000 | ~25,000 | ❌ No | ✅ Yes |
| Full book chapter | 200,000 | ~50,000 | ❌ No | ✅ Yes |
| Multiple chapters | 500,000 | ~125,000 | ❌ No | ✅ Yes |

## Error Messages Explained

### "LLM extraction failed. Using local extraction as fallback."

**Cause**: 
- Document too large for selected model
- API error or timeout
- Invalid API key
- Network issue

**Solution**:
1. Check document size
2. Switch to model with higher limit
3. Verify API key is correct
4. Check internet connection
5. Try again with smaller document

### "Document too large for [provider]"

**Cause**: 
- Document exceeds token limit for selected model

**Solution**:
1. Use model with higher limit (see table above)
2. Split document into smaller parts
3. Extract only key sections
4. Use local extraction instead

### "Invalid LLM response format"

**Cause**: 
- LLM returned non-JSON response
- Response was truncated
- API error

**Solution**:
1. Try again (may be temporary)
2. Check API key and credits
3. Use smaller document
4. Switch to different model

## Cost Considerations

### Token Pricing (Approximate)

| Provider | Model | Input Cost | Output Cost |
|----------|-------|------------|-------------|
| OpenAI | GPT-4 | $0.03/1K tokens | $0.06/1K tokens |
| OpenAI | GPT-4 Turbo | $0.01/1K tokens | $0.03/1K tokens |
| OpenAI | GPT-3.5 Turbo | $0.0005/1K tokens | $0.0015/1K tokens |
| Anthropic | Claude 3 Opus | $0.015/1K tokens | $0.075/1K tokens |
| Anthropic | Claude 3 Sonnet | $0.003/1K tokens | $0.015/1K tokens |
| Anthropic | Claude 3 Haiku | $0.00025/1K tokens | $0.00125/1K tokens |
| Google | Gemini Pro | Free (with limits) | Free (with limits) |

### Cost Examples

**Processing a 50,000 character document (~12,500 tokens input, ~5,000 tokens output):**

| Model | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| GPT-4 | $0.38 | $0.30 | **$0.68** |
| GPT-4 Turbo | $0.13 | $0.15 | **$0.28** |
| Claude 3 Sonnet | $0.04 | $0.08 | **$0.12** |
| Claude 3 Haiku | $0.003 | $0.006 | **$0.009** |
| Gemini Pro | Free | Free | **Free** |

## Best Practices

### 1. Check Document Size First

Before uploading:
```
- Small (< 10 pages): Any model works
- Medium (10-30 pages): Use GPT-4 Turbo or Claude 3
- Large (30+ pages): Use Claude 3 Opus/Sonnet
- Very Large (100+ pages): Split into sections
```

### 2. Start with Cheaper Models

- Try GPT-3.5 Turbo or Gemini Pro first
- Upgrade to GPT-4 or Claude 3 if needed
- Use Claude 3 Haiku for cost-effective large documents

### 3. Optimize Your Documents

- Remove unnecessary content (headers, footers, page numbers)
- Extract only relevant sections
- Clean up formatting issues
- Remove duplicate content

### 4. Monitor Your Usage

- Check API usage in provider dashboard
- Set spending limits
- Use free tier (Gemini Pro) for testing

## Summary

**Current Limits** (Conservative, with room for output):
- **GPT-4**: ~14,000 characters
- **GPT-4 Turbo**: ~230,000 characters
- **GPT-3.5 Turbo**: ~29,000 characters
- **Claude 3**: ~360,000 characters ⭐ Best for large docs
- **Gemini Pro**: ~58,000 characters

**Recommendations**:
1. **For most documents**: Use GPT-4 Turbo or Claude 3 Sonnet
2. **For cost-effectiveness**: Use Claude 3 Haiku or Gemini Pro
3. **For quality**: Use Claude 3 Opus or GPT-4
4. **For very large docs**: Use Claude 3 (any variant)

The application will automatically warn you and truncate if needed, but choosing the right model upfront provides the best results!

---

**Last Updated**: December 4, 2025
**Status**: ✅ Automatic limit checking implemented
