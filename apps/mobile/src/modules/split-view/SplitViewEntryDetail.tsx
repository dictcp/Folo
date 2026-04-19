import { FeedViewType, UserRole } from "@follow/constants"
import { useEntry, useEntryReadHistory, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import { useFeedById } from "@follow/store/feed/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { useAutoMarkAsRead } from "@follow/store/unread/hooks"
import { useIsLoggedIn, useUserRole } from "@follow/store/user/hooks"
import * as WebBrowser from "expo-web-browser"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"
import { EntryContentWebView } from "@/src/components/native/webview/EntryContentWebView"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Text } from "@/src/components/ui/typography/Text"
import { CalendarTimeAddCuteReIcon } from "@/src/icons/calendar_time_add_cute_re"
import { Eye2CuteReIcon } from "@/src/icons/eye_2_cute_re"
import { openLink } from "@/src/lib/native"
import { EntryContentContext, useEntryContentContext } from "@/src/modules/entry-content/ctx"
import { EntryAISummary } from "@/src/modules/entry-content/EntryAISummary"
import { EntrySocialTitle, EntryTitle } from "@/src/modules/entry-content/EntryTitle"

import type { SplitViewEntryState } from "./SplitViewContext"

export function SplitViewEntryDetail({ state }: { state: SplitViewEntryState }) {
  return <SplitViewEntryDetailContent key={state.entryId} state={state} />
}

function SplitViewEntryDetailContent({ state }: { state: SplitViewEntryState }) {
  const { entryId, view: viewType } = state
  usePrefetchEntryDetail(entryId)
  const entry = useEntry(entryId, (s) => ({
    title: s.title,
    url: s.url,
    summary: s.settings?.summary,
    translation: s.settings?.translation,
    readability: s.settings?.readability,
    sourceContent: s.settings?.sourceContent,
  }))
  const isLoggedIn = useIsLoggedIn()
  useAutoMarkAsRead(entryId, !!entry && isLoggedIn)

  const ctxValue = useMemo(
    () => ({
      showAISummaryAtom: atom(entry?.summary || false),
      showAITranslationAtom: atom(!!entry?.translation || false),
      showReadabilityAtom: atom(entry?.readability || false),
      showSourceContentAtom: atom(entry?.sourceContent || false),
      titleHeightAtom: atom(0),
    }),
    [entry?.readability, entry?.sourceContent, entry?.summary, entry?.translation],
  )

  return (
    <EntryContentContext value={ctxValue}>
      <ScrollView className="flex-1" contentContainerClassName="pb-16">
        <ItemPressable
          itemStyle={ItemPressableStyle.UnStyled}
          onPress={() => entry?.url && openLink(entry.url)}
          className="rounded-xl px-5 py-4"
        >
          {viewType === FeedViewType.SocialMedia ? (
            <EntrySocialTitle entryId={entryId} />
          ) : (
            <>
              <EntryTitle title={entry?.title || ""} entryId={entryId} />
              <SplitViewEntryInfo entryId={entryId} />
            </>
          )}
        </ItemPressable>
        <View className="px-5">
          <EntryAISummary entryId={entryId} />
        </View>
        {entry && (
          <View className="mt-3 w-full px-5">
            <SplitViewEntryContentWebView entryId={entryId} />
          </View>
        )}
        {viewType === FeedViewType.SocialMedia && (
          <View className="mt-2 px-5">
            <SplitViewEntryInfoSocial entryId={entryId} />
          </View>
        )}
      </ScrollView>
    </EntryContentContext>
  )
}

function SplitViewEntryContentWebView({ entryId }: { entryId: string }) {
  const { showReadabilityAtom, showAITranslationAtom, showSourceContentAtom } =
    useEntryContentContext()
  const showReadabilityOnce = useAtomValue(showReadabilityAtom)
  const translationSetting = useGeneralSettingKey("translation")
  const translationMode = useGeneralSettingKey("translationMode")
  const showTranslationOnce = useAtomValue(showAITranslationAtom)
  const actionLanguage = useActionLanguage()
  const userRole = useUserRole()
  const showTranslation = translationSetting || showTranslationOnce
  const translationPrefetchEnabled =
    showTranslation &&
    (userRole == null || (userRole !== UserRole.Free && userRole !== UserRole.Trial))
  const entry = useEntry(entryId, (s) => ({
    content: s.content,
    readabilityContent: s.readabilityContent,
    url: s.url,
  }))
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    withContent: true,
    target: showReadabilityOnce && entry?.readabilityContent ? "readabilityContent" : "content",
    language: actionLanguage,
    enabled: translationPrefetchEnabled,
    mode: translationMode,
  })

  const setShowReadability = useSetAtom(showReadabilityAtom)
  const { isPending } = usePrefetchEntryDetail(entryId)
  useEffect(() => {
    if (!isPending && !entry?.content) {
      setShowReadability(true)
    }
  }, [isPending, entry?.content, setShowReadability])
  useEffect(() => {
    if (showReadabilityOnce) {
      entrySyncServices.fetchEntryReadabilityContent(entryId)
    }
  }, [showReadabilityOnce, entryId])

  const showSourceContent = useAtomValue(showSourceContentAtom)
  useEffect(() => {
    if (showSourceContent && entry?.url) {
      WebBrowser.openBrowserAsync(entry?.url)
    }
  }, [entry?.url, showSourceContent])

  return (
    <EntryContentWebView
      entryId={entryId}
      showReadability={showReadabilityOnce}
      showTranslation={showTranslation}
    />
  )
}

function SplitViewEntryInfo({ entryId }: { entryId: string }) {
  const entry = useEntry(entryId, (s) => ({
    publishedAt: s.publishedAt,
    feedId: s.feedId,
  }))
  const isLoggedIn = useIsLoggedIn()
  const feed = useFeedById(entry?.feedId)
  const secondaryLabelColor = useColor("secondaryLabel")
  const readCount =
    useEntryReadHistory(entryId, 20, isLoggedIn)?.entryReadHistories?.readCount ?? 0
  const hideRecentReader = useUISettingKey("hideRecentReader")
  if (!entry) return null
  const { publishedAt } = entry
  return (
    <View className="mt-4 flex flex-row items-center gap-4">
      {feed && (
        <View className="flex shrink flex-row items-center gap-2">
          <FeedIcon feed={feed} />
          <Text className="shrink text-xs font-medium leading-tight text-label" numberOfLines={1}>
            {feed.title?.trim()}
          </Text>
        </View>
      )}
      <View className="flex flex-row items-center gap-1">
        <CalendarTimeAddCuteReIcon width={16} height={16} color={secondaryLabelColor} />
        <RelativeDateTime
          date={publishedAt}
          className="text-xs leading-tight text-secondary-label"
        />
      </View>
      {isLoggedIn && !hideRecentReader && (
        <View className="flex flex-row items-center gap-1">
          <Eye2CuteReIcon width={16} height={16} color={secondaryLabelColor} />
          <Text className="text-xs leading-tight text-secondary-label">{readCount}</Text>
        </View>
      )}
    </View>
  )
}

function SplitViewEntryInfoSocial({ entryId }: { entryId: string }) {
  const entry = useEntry(entryId, (s) => ({
    publishedAt: s.publishedAt,
  }))
  if (!entry) return null
  return (
    <View className="mt-3">
      <Text className="text-sm text-secondary-label">
        {entry.publishedAt.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </Text>
    </View>
  )
}

export function SplitViewEmptyDetail() {
  const { t } = useTranslation("common")
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base text-secondary-label">{t("words.select_entry")}</Text>
    </View>
  )
}
