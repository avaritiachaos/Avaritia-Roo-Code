import type { ModelInfo } from "../model.js"

// https://platform.deepseek.com/docs/api
// preserveReasoning enables interleaved thinking mode for tool calls:
// DeepSeek requires reasoning_content to be passed back during tool call
// continuation within the same turn. See: https://api-docs.deepseek.com/guides/thinking_mode
export type DeepSeekModelId = keyof typeof deepSeekModels

export const deepSeekDefaultModelId: DeepSeekModelId = "deepseek-chat"

export const deepSeekModels = {
	"deepseek-chat": {
		maxTokens: 8192, // 8K max output
		contextWindow: 128_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.28, // $0.28 per million tokens (cache miss) - Updated Dec 9, 2025
		outputPrice: 0.42, // $0.42 per million tokens - Updated Dec 9, 2025
		cacheWritesPrice: 0.28, // $0.28 per million tokens (cache miss) - Updated Dec 9, 2025
		cacheReadsPrice: 0.028, // $0.028 per million tokens (cache hit) - Updated Dec 9, 2025
		description: `DeepSeek-V3.2 (Non-thinking Mode) achieves a significant breakthrough in inference speed over previous models. It tops the leaderboard among open-source models and rivals the most advanced closed-source models globally. Supports JSON output, tool calls, chat prefix completion (beta), and FIM completion (beta).`,
	},
	"deepseek-reasoner": {
		maxTokens: 8192, // 8K max output
		contextWindow: 128_000,
		supportsImages: false,
		supportsPromptCache: true,
		preserveReasoning: true,
		inputPrice: 0.28, // $0.28 per million tokens (cache miss) - Updated Dec 9, 2025
		outputPrice: 0.42, // $0.42 per million tokens - Updated Dec 9, 2025
		cacheWritesPrice: 0.28, // $0.28 per million tokens (cache miss) - Updated Dec 9, 2025
		cacheReadsPrice: 0.028, // $0.028 per million tokens (cache hit) - Updated Dec 9, 2025
		description: `DeepSeek-V3.2 (Thinking Mode) achieves performance comparable to OpenAI-o1 across math, code, and reasoning tasks. Supports Chain of Thought reasoning with up to 8K output tokens. Supports JSON output, tool calls, and chat prefix completion (beta).`,
	},
	"deepseek-v4-flash": {
		maxTokens: 384_000, // 384K max output
		contextWindow: 1_000_000,
		supportsImages: false,
		supportsPromptCache: true,
		preserveReasoning: true,
		supportsReasoningEffort: ["disable", "high", "xhigh"],
		reasoningEffort: "high",
		inputPrice: 0.14, // $0.14 per million tokens (cache miss) - Updated Apr 24, 2026
		outputPrice: 0.28, // $0.28 per million tokens - Updated Apr 24, 2026
		cacheWritesPrice: 0.14, // $0.14 per million tokens (cache miss) - Updated Apr 24, 2026
		cacheReadsPrice: 0.0028, // $0.0028 per million tokens (cache hit) - Updated Apr 24, 2026
		description: `DeepSeek-V4 Flash supports 1M context, 384K max output, tool calls, and thinking/non-thinking modes.`,
	},
	"deepseek-v4-pro": {
		maxTokens: 384_000, // 384K max output
		contextWindow: 1_000_000,
		supportsImages: false,
		supportsPromptCache: true,
		preserveReasoning: true,
		supportsReasoningEffort: ["disable", "high", "xhigh"],
		reasoningEffort: "high",
		inputPrice: 0.435, // $0.435 per million tokens (cache miss) - Updated Apr 24, 2026
		outputPrice: 0.87, // $0.87 per million tokens - Updated Apr 24, 2026
		cacheWritesPrice: 0.435, // $0.435 per million tokens (cache miss) - Updated Apr 24, 2026
		cacheReadsPrice: 0.003625, // $0.003625 per million tokens (cache hit) - Updated Apr 24, 2026
		description: `DeepSeek-V4 Pro supports 1M context, 384K max output, tool calls, and thinking/non-thinking modes.`,
	},
} as const satisfies Record<string, ModelInfo>

// https://api-docs.deepseek.com/quick_start/parameter_settings
export const DEEP_SEEK_DEFAULT_TEMPERATURE = 0.3
