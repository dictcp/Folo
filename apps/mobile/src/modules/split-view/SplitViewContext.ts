import type { FeedViewType } from "@follow/constants"
import { jotaiStore } from "@follow/utils"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

import { useIsTabletLayout } from "@/src/lib/responsive"

export interface SplitViewEntryState {
  entryId: string
  view: FeedViewType
  entryIds: string[]
}

const splitViewEntryAtom = atom<SplitViewEntryState | null>(null)

export const useSplitViewEnabled = () => {
  return useIsTabletLayout()
}

export const useSplitViewEntry = () => {
  return useAtomValue(splitViewEntryAtom)
}

export const useSplitViewEntryId = () => {
  return useAtomValue(splitViewEntryAtom)?.entryId ?? null
}

export const useSetSplitViewEntry = () => {
  return useSetAtom(splitViewEntryAtom)
}

export const useSelectSplitViewEntry = () => {
  const setEntry = useSetAtom(splitViewEntryAtom)
  return useCallback(
    (entryId: string, view: FeedViewType, entryIds: string[]) => {
      setEntry({ entryId, view, entryIds })
    },
    [setEntry],
  )
}

export const clearSplitViewEntry = () => {
  jotaiStore.set(splitViewEntryAtom, null)
}
