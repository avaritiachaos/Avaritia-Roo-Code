import * as vscode from "vscode"

import {
	MODELS_BY_PROVIDER,
	RooCodeEventName,
	getModelId,
	isProviderName,
	modelIdKeysByProvider,
	type ModelIdKey,
	type ProviderName,
	type ProviderSettings,
} from "@roo-code/types"

import { getModels } from "../api/providers/fetchers/modelCache"
import { buildApiHandler } from "../api"
import { toRouterName, type GetModelsOptions } from "../shared/api"
import type { ClineProvider } from "../core/webview/ClineProvider"

const COMMAND_ID = "roo-cline.switchModelFromStatusBar"

type ModelQuickPickItem = vscode.QuickPickItem & {
	modelId: string
}

const providerLabels: Partial<Record<ProviderName, string>> = {
	...Object.fromEntries(Object.entries(MODELS_BY_PROVIDER).map(([id, meta]) => [id, meta.label])),
	openai: "OpenAI Compatible",
	"gemini-cli": "Gemini CLI",
	"fake-ai": "Fake AI",
}

export function initializeProviderModelStatusBar({
	context,
	provider,
	outputChannel,
}: {
	context: vscode.ExtensionContext
	provider: ClineProvider
	outputChannel: vscode.OutputChannel
}) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
	statusBarItem.command = COMMAND_ID
	statusBarItem.name = "Roo Code Model"
	context.subscriptions.push(statusBarItem)

	const updateStatusBar = async () => {
		try {
			const { apiConfiguration } = await provider.getState()
			const providerName = getProviderName(apiConfiguration)
			const modelId = getCurrentModelId(apiConfiguration)

			statusBarItem.text = `$(symbol-misc) ${getProviderLabel(providerName)} | ${modelId || "Select model"}`
			statusBarItem.tooltip = "Switch Roo Code model"
			statusBarItem.show()
		} catch (error) {
			outputChannel.appendLine(`Failed to update Roo Code model status bar: ${String(error)}`)
		}
	}

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_ID, async () => {
			await showProviderModelQuickPick({ provider, outputChannel, updateStatusBar })
		}),
	)

	const onProviderProfileChanged = () => {
		void updateStatusBar()
	}

	provider.on(RooCodeEventName.ProviderProfileChanged, onProviderProfileChanged)
	context.subscriptions.push({
		dispose: () => provider.off(RooCodeEventName.ProviderProfileChanged, onProviderProfileChanged),
	})

	void updateStatusBar()
}

async function showProviderModelQuickPick({
	provider,
	outputChannel,
	updateStatusBar,
}: {
	provider: ClineProvider
	outputChannel: vscode.OutputChannel
	updateStatusBar: () => Promise<void>
}) {
	const { apiConfiguration, currentApiConfigName = "default" } = await provider.getState()
	const providerName = getProviderName(apiConfiguration)
	const models = await getAvailableModelIds(apiConfiguration, outputChannel)

	if (models.length === 0) {
		void vscode.window.showInformationMessage(`No models found for ${getProviderLabel(providerName)}.`)
		return
	}

	const currentModelId = getCurrentModelId(apiConfiguration)
	const selected = await vscode.window.showQuickPick<ModelQuickPickItem>(
		models.map((modelId) => ({
			label: modelId,
			description: modelId === currentModelId ? "Current" : undefined,
			modelId,
		})),
		{
			placeHolder: `Select ${getProviderLabel(providerName)} model`,
			matchOnDescription: true,
		},
	)

	if (!selected || selected.modelId === currentModelId) {
		return
	}

	const modelIdKey = getModelIdKey(providerName)
	if (!modelIdKey) {
		void vscode.window.showWarningMessage(`Model switching is not supported for ${getProviderLabel(providerName)}.`)
		return
	}

	await provider.upsertProviderProfile(currentApiConfigName, {
		...apiConfiguration,
		apiProvider: providerName,
		[modelIdKey]: selected.modelId,
	})

	await updateStatusBar()
}

async function getAvailableModelIds(
	apiConfiguration: ProviderSettings,
	outputChannel: vscode.OutputChannel,
): Promise<string[]> {
	const providerName = getProviderName(apiConfiguration)
	const staticModels = MODELS_BY_PROVIDER[providerName as keyof typeof MODELS_BY_PROVIDER]?.models

	if (staticModels?.length) {
		return staticModels
	}

	if (providerName === "openai") {
		return getCurrentModelId(apiConfiguration) ? [getCurrentModelId(apiConfiguration)] : []
	}

	try {
		const models = await getModels({
			provider: toRouterName(providerName),
			apiKey: getProviderApiKey(apiConfiguration),
			baseUrl: getProviderBaseUrl(apiConfiguration),
		} as GetModelsOptions)

		return Object.keys(models)
	} catch (error) {
		outputChannel.appendLine(
			`Failed to load ${providerName} models for status bar picker: ${error instanceof Error ? error.message : String(error)}`,
		)
		void vscode.window.showErrorMessage(`Failed to load ${getProviderLabel(providerName)} models.`)
		return []
	}
}

function getProviderName(apiConfiguration: ProviderSettings): ProviderName {
	const providerName = apiConfiguration.apiProvider
	return providerName && isProviderName(providerName) ? providerName : "anthropic"
}

function getProviderLabel(providerName: ProviderName): string {
	return providerLabels[providerName] ?? providerName
}

function getCurrentModelId(apiConfiguration: ProviderSettings): string {
	try {
		return buildApiHandler(apiConfiguration).getModel().id
	} catch {
		return getModelId(apiConfiguration) ?? ""
	}
}

function getModelIdKey(providerName: ProviderName): ModelIdKey | undefined {
	if (providerName === "openai") {
		return "openAiModelId"
	}

	return modelIdKeysByProvider[providerName as keyof typeof modelIdKeysByProvider]
}

function getProviderApiKey(apiConfiguration: ProviderSettings): string | undefined {
	switch (apiConfiguration.apiProvider) {
		case "litellm":
			return apiConfiguration.litellmApiKey
		case "requesty":
			return apiConfiguration.requestyApiKey
		case "unbound":
			return apiConfiguration.unboundApiKey
		case "roo":
			return apiConfiguration.rooApiKey
		case "poe":
			return apiConfiguration.poeApiKey
		case "vercel-ai-gateway":
			return apiConfiguration.vercelAiGatewayApiKey
		default:
			return undefined
	}
}

function getProviderBaseUrl(apiConfiguration: ProviderSettings): string | undefined {
	switch (apiConfiguration.apiProvider) {
		case "litellm":
			return apiConfiguration.litellmBaseUrl
		case "requesty":
			return apiConfiguration.requestyBaseUrl
		case "ollama":
			return apiConfiguration.ollamaBaseUrl
		case "lmstudio":
			return apiConfiguration.lmStudioBaseUrl
		case "roo":
			return process.env.ROO_CODE_PROVIDER_URL ?? "https://api.roocode.com/proxy"
		case "poe":
			return apiConfiguration.poeBaseUrl
		default:
			return undefined
	}
}
