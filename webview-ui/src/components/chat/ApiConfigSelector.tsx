import { useState, useMemo, useCallback, useEffect } from "react"
import { Fzf } from "fzf"

import { cn } from "@/lib/utils"
import { useRooPortal } from "@/components/ui/hooks/useRooPortal"
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { vscode } from "@/utils/vscode"
import { Button } from "@/components/ui"

import { IconButton } from "./IconButton"

type ApiConfigMeta = {
	id: string
	name: string
	apiProvider?: string
	modelId?: string
}

type ProviderGroup = {
	key: string
	label: string
	configs: ApiConfigMeta[]
}

const PROVIDER_LABELS: Record<string, string> = {
	anthropic: "Anthropic",
	bedrock: "Amazon Bedrock",
	deepseek: "DeepSeek",
	gemini: "Google Gemini",
	"gemini-cli": "Gemini CLI",
	vertex: "Vertex AI",
	openai: "OpenAI Compatible",
	"openai-native": "OpenAI",
	"openai-codex": "OpenAI Codex",
	openrouter: "OpenRouter",
	ollama: "Ollama",
	lmstudio: "LM Studio",
	mistral: "Mistral",
	moonshot: "Moonshot",
	minimax: "MiniMax",
	requesty: "Requesty",
	unbound: "Unbound",
	poe: "Poe",
	xai: "xAI",
	baseten: "Baseten",
	litellm: "LiteLLM",
	sambanova: "SambaNova",
	zai: "Z.ai",
	fireworks: "Fireworks AI",
	"qwen-code": "Qwen Code",
	roo: "Roo",
	"vscode-lm": "VS Code LM",
	"vercel-ai-gateway": "Vercel AI Gateway",
}

const getProviderKey = (config?: ApiConfigMeta) => config?.apiProvider ?? "unknown"

const getProviderLabel = (apiProvider?: string) => {
	if (!apiProvider) {
		return "Other"
	}

	return PROVIDER_LABELS[apiProvider] ?? apiProvider
}

interface ApiConfigSelectorProps {
	value: string
	displayName: string
	disabled?: boolean
	title: string
	onChange: (value: string) => void
	triggerClassName?: string
	listApiConfigMeta: ApiConfigMeta[]
	pinnedApiConfigs?: Record<string, boolean>
	togglePinnedApiConfig: (id: string) => void
	lockApiConfigAcrossModes: boolean
	onToggleLockApiConfig: () => void
}

export const ApiConfigSelector = ({
	value,
	displayName,
	disabled = false,
	title,
	onChange,
	triggerClassName = "",
	listApiConfigMeta,
	pinnedApiConfigs,
	togglePinnedApiConfig,
	lockApiConfigAcrossModes,
	onToggleLockApiConfig,
}: ApiConfigSelectorProps) => {
	const { t } = useAppTranslation()
	const [open, setOpen] = useState(false)
	const [searchValue, setSearchValue] = useState("")
	const [activeProviderKey, setActiveProviderKey] = useState<string>("")
	const portalContainer = useRooPortal("roo-portal")

	// Create searchable items for fuzzy search.
	const searchableItems = useMemo(
		() =>
			listApiConfigMeta.map((config) => ({
				original: config,
				searchStr: [config.name, config.modelId, config.apiProvider, getProviderLabel(config.apiProvider)]
					.filter(Boolean)
					.join(" "),
			})),
		[listApiConfigMeta],
	)

	// Create Fzf instance.
	const fzfInstance = useMemo(
		() => new Fzf(searchableItems, { selector: (item) => item.searchStr }),
		[searchableItems],
	)

	// Filter configs based on search.
	const filteredConfigs = useMemo(() => {
		if (!searchValue) {
			return listApiConfigMeta
		}

		const matchingItems = fzfInstance.find(searchValue).map((result) => result.item.original)
		return matchingItems
	}, [listApiConfigMeta, searchValue, fzfInstance])

	const providerGroups = useMemo<ProviderGroup[]>(() => {
		const groups = new Map<string, ProviderGroup>()

		for (const config of filteredConfigs) {
			const key = getProviderKey(config)

			if (!groups.has(key)) {
				groups.set(key, {
					key,
					label: getProviderLabel(config.apiProvider),
					configs: [],
				})
			}

			groups.get(key)!.configs.push(config)
		}

		return Array.from(groups.values()).map((group) => ({
			...group,
			configs: [...group.configs].sort((a, b) => {
				const pinnedDelta = Number(!!pinnedApiConfigs?.[b.id]) - Number(!!pinnedApiConfigs?.[a.id])

				return pinnedDelta
			}),
		}))
	}, [filteredConfigs, pinnedApiConfigs])

	const currentConfig = useMemo(
		() => listApiConfigMeta.find((config) => config.id === value),
		[listApiConfigMeta, value],
	)

	const currentProviderKey = getProviderKey(currentConfig)
	const preferredProviderKey = providerGroups.some((group) => group.key === currentProviderKey)
		? currentProviderKey
		: (providerGroups[0]?.key ?? "")

	useEffect(() => {
		if (!providerGroups.length) {
			setActiveProviderKey("")
			return
		}

		if (!providerGroups.some((group) => group.key === activeProviderKey)) {
			setActiveProviderKey(preferredProviderKey)
		}
	}, [activeProviderKey, preferredProviderKey, providerGroups])

	const activeProviderGroup = providerGroups.find((group) => group.key === activeProviderKey) ?? providerGroups[0]

	const handleSelect = useCallback(
		(configId: string) => {
			const selectedConfig = listApiConfigMeta.find((config) => config.id === configId)

			if (selectedConfig) {
				setActiveProviderKey(getProviderKey(selectedConfig))
			}

			onChange(configId)
			setOpen(false)
			setSearchValue("")
		},
		[listApiConfigMeta, onChange],
	)

	const handleEditClick = useCallback(() => {
		vscode.postMessage({ type: "switchTab", tab: "settings" })
		setOpen(false)
	}, [])

	const renderProviderItem = useCallback(
		(group: ProviderGroup) => {
			const isActive = group.key === activeProviderGroup?.key
			const currentCount = group.configs.filter((config) => config.id === value).length
			const pinnedCount = group.configs.filter((config) => pinnedApiConfigs?.[config.id]).length

			return (
				<button
					key={group.key}
					type="button"
					onClick={() => setActiveProviderKey(group.key)}
					className={cn(
						"w-full px-2 py-1.5 text-left text-sm cursor-pointer flex items-center gap-2",
						"hover:bg-vscode-list-hoverBackground",
						isActive &&
							"bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground",
					)}>
					<span className="truncate flex-1 min-w-0">{group.label}</span>
					<div className="flex items-center gap-1 flex-shrink-0">
						{pinnedCount > 0 && <span className="codicon codicon-pin text-[10px] opacity-60" />}
						{currentCount > 0 && <span className="codicon codicon-check text-xs" />}
						<span className="text-[10px] opacity-70">{group.configs.length}</span>
					</div>
				</button>
			)
		},
		[activeProviderGroup?.key, pinnedApiConfigs, value],
	)

	const renderModelItem = useCallback(
		(config: ApiConfigMeta) => {
			const isCurrentConfig = config.id === value
			const isPinned = !!pinnedApiConfigs?.[config.id]

			return (
				<div
					key={config.id}
					onClick={() => handleSelect(config.id)}
					className={cn(
						"px-3 py-1.5 text-sm cursor-pointer flex items-center group gap-2",
						"hover:bg-vscode-list-hoverBackground",
						isCurrentConfig &&
							"bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground",
					)}>
					<div className="flex-1 min-w-0 flex flex-col overflow-hidden leading-tight">
						<span className="truncate">{config.modelId || config.name}</span>
						{config.modelId && (
							<span className="text-xs text-vscode-descriptionForeground opacity-80 truncate">
								{config.name}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1 flex-shrink-0">
						{isCurrentConfig && (
							<div className="size-5 p-1 flex items-center justify-center">
								<span className="codicon codicon-check text-xs" />
							</div>
						)}
						<StandardTooltip content={isPinned ? t("chat:unpin") : t("chat:pin")}>
							<Button
								variant="ghost"
								size="icon"
								tabIndex={-1}
								onClick={(e) => {
									e.stopPropagation()
									togglePinnedApiConfig(config.id)
									vscode.postMessage({ type: "toggleApiConfigPin", text: config.id })
								}}
								className={cn("size-5 flex items-center justify-center", {
									"opacity-0 group-hover:opacity-100": !isPinned && !isCurrentConfig,
									"bg-accent opacity-100": isPinned,
								})}>
								<span className="codicon codicon-pin text-xs opacity-50" />
							</Button>
						</StandardTooltip>
					</div>
				</div>
			)
		},
		[value, pinnedApiConfigs, handleSelect, t, togglePinnedApiConfig],
	)

	return (
		<Popover open={open} onOpenChange={setOpen} data-testid="api-config-selector-root">
			<StandardTooltip content={title}>
				<PopoverTrigger
					disabled={disabled}
					data-testid="dropdown-trigger"
					className={cn(
						"min-w-0 inline-flex items-center relative whitespace-nowrap px-1.5 py-1 text-xs",
						"bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground",
						"transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset",
						disabled
							? "opacity-50 cursor-not-allowed"
							: "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer",
						triggerClassName,
					)}>
					<span className="truncate">{displayName}</span>
				</PopoverTrigger>
			</StandardTooltip>
			<PopoverContent
				align="start"
				sideOffset={4}
				container={portalContainer}
				className="p-0 overflow-hidden w-[520px] max-w-[calc(100vw-24px)]">
				<div className="flex flex-col w-full">
					{/* Search input or info blurb */}
					{listApiConfigMeta.length > 6 ? (
						<div className="relative p-2 border-b border-vscode-dropdown-border">
							<input
								aria-label={t("common:ui.search_placeholder")}
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								placeholder={t("common:ui.search_placeholder")}
								className="w-full h-8 px-2 py-1 text-xs bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-0"
								autoFocus
							/>
							{searchValue.length > 0 && (
								<div className="absolute right-4 top-0 bottom-0 flex items-center justify-center">
									<span
										className="codicon codicon-close text-vscode-input-foreground opacity-50 hover:opacity-100 text-xs cursor-pointer"
										onClick={() => setSearchValue("")}
									/>
								</div>
							)}
						</div>
					) : (
						<div className="p-3 border-b border-vscode-dropdown-border">
							<p className="text-xs text-vscode-descriptionForeground m-0">
								{t("prompts:apiConfiguration.select")}
							</p>
						</div>
					)}

					{/* Provider/model picker */}
					{filteredConfigs.length === 0 && searchValue ? (
						<div className="py-2 px-3 text-sm text-vscode-foreground/70">{t("common:ui.no_results")}</div>
					) : (
						<div className="grid grid-cols-[170px_minmax(0,1fr)] max-h-[320px] overflow-hidden">
							<div
								className="border-r border-vscode-dropdown-border overflow-y-auto"
								data-testid="api-provider-column"
								aria-label={t("settings:providers.apiProvider")}>
								<div className="sticky top-0 z-10 bg-vscode-dropdown-background px-2 py-1 text-[10px] uppercase tracking-wide text-vscode-descriptionForeground border-b border-vscode-dropdown-border">
									{t("settings:providers.apiProvider")}
								</div>
								<div className="py-1">{providerGroups.map(renderProviderItem)}</div>
							</div>
							<div
								className="overflow-y-auto"
								data-testid="api-model-column"
								aria-label={t("settings:providers.model")}>
								<div className="sticky top-0 z-10 bg-vscode-dropdown-background px-3 py-1 text-[10px] uppercase tracking-wide text-vscode-descriptionForeground border-b border-vscode-dropdown-border">
									{activeProviderGroup?.label ?? t("settings:providers.model")}
								</div>
								<div className="py-1">{activeProviderGroup?.configs.map(renderModelItem)}</div>
							</div>
						</div>
					)}

					{/* Bottom bar with buttons on left and title on right */}
					<div className="flex flex-row items-center justify-between px-2 py-2 border-t border-vscode-dropdown-border">
						<div className="flex flex-row gap-1">
							<IconButton
								iconClass="codicon-settings-gear"
								title={t("chat:edit")}
								onClick={handleEditClick}
								tooltip={false}
							/>
							<IconButton
								iconClass={lockApiConfigAcrossModes ? "codicon-lock" : "codicon-unlock"}
								title={
									lockApiConfigAcrossModes
										? t("chat:unlockApiConfigAcrossModes")
										: t("chat:lockApiConfigAcrossModes")
								}
								className={lockApiConfigAcrossModes ? "text-vscode-focusBorder" : "opacity-60"}
								onClick={onToggleLockApiConfig}
							/>
						</div>

						{/* Info icon and title on the right with matching spacing */}
						<div className="flex items-center gap-1 pr-1">
							{listApiConfigMeta.length > 6 && (
								<StandardTooltip content={t("prompts:apiConfiguration.select")}>
									<span className="codicon codicon-info text-xs text-vscode-descriptionForeground opacity-70 hover:opacity-100 cursor-help" />
								</StandardTooltip>
							)}
							<h4 className="m-0 font-medium text-sm text-vscode-descriptionForeground">
								{t("prompts:apiConfiguration.title")}
							</h4>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
