To calculate the cost of using the app with a document of 4000 characters, we first need to convert those characters into tokens and estimate the total transaction volume (input + output).

1. Token Estimation
In the AI industry (and specifically in the codebase's 
LLMProvider.js
), the rule of thumb is 1 token ≈ 4 characters.

Document Input: 4000 characters ÷ 4 ≈ 1,000 tokens.
Prompt Overhead: Each generation (Activities, Quizzes, etc.) includes a system prompt and instructions. We estimate this at ~250-500 tokens.
Total Input Per Run: ~1,250 - 1,500 tokens.
Estimated Output: Based on the code (e.g., generating 2 activities or a quiz), the AI typically generates 500 - 1,000 tokens of content.
2. Cost Comparison (Gemini vs. OpenAI)
The following table compares the costs for a single full run (Concept extraction + Activity generation) using a total of 1,500 input tokens and 1,000 output tokens.

Model Tier	Model Name	Input Price (per 1M)	Output Price (per 1M)	Estimated Cost per Doc
OpenAI High Performance	GPT-4o	$2.50	$10.00	$0.01375 (~1.4 cents)
OpenAI Budget/Fast	GPT-4o-mini	$0.15	$0.60	$0.00083 (< 0.1 cent)
Google High Performance	Gemini 1.5 Pro	$3.50	$10.50	$0.01575 (~1.6 cents)
Google Budget/Fast	Gemini 1.5 Flash	$0.075	$0.30	$0.00041 (< 0.05 cent)
Summary and Recommendations
Best Value: Gemini 1.5 Flash. It is currenty the cheapest option, costing less than $0.01 for every 20-25 documents processed.
Highest Quality: If you need deep educational reasoning, GPT-4o or Gemini 1.5 Pro are excellent but cost about 1.5 cents per document.
Legacy Warning: If you are using the older GPT-4 (as referenced in 
OpenAIProvider.js
), the cost is significantly higher—roughly $0.10 per document, which is nearly 10x more expensive than the modern GPT-4o.
Recommendation: For a balance of high quality and extremely low cost, I recommend using GPT-4o-mini or Gemini 1.5 Flash. They are both incredibly cheap for processing 4000-character documents.