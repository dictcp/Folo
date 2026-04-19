import type { PropsWithChildren } from "react"
import { View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { useSplitViewEnabled, useSplitViewEntry } from "./SplitViewContext"
import { SplitViewEmptyDetail, SplitViewEntryDetail } from "./SplitViewEntryDetail"

const SPLIT_VIEW_LEFT_WIDTH_RATIO = 0.4
const SPLIT_VIEW_LEFT_MIN_WIDTH = 320
const SPLIT_VIEW_LEFT_MAX_WIDTH = 420

export function SplitViewContainer({ children }: PropsWithChildren) {
  const isSplitView = useSplitViewEnabled()

  if (!isSplitView) {
    return children
  }

  return <SplitViewLayout>{children}</SplitViewLayout>
}

function SplitViewLayout({ children }: PropsWithChildren) {
  const splitViewEntry = useSplitViewEntry()
  const separatorColor = useColor("opaqueSeparator")

  return (
    <View className="flex-1 flex-row">
      <View
        className="flex-shrink-0"
        style={{
          width: `${SPLIT_VIEW_LEFT_WIDTH_RATIO * 100}%`,
          minWidth: SPLIT_VIEW_LEFT_MIN_WIDTH,
          maxWidth: SPLIT_VIEW_LEFT_MAX_WIDTH,
        }}
      >
        {children}
      </View>
      <View
        style={{
          width: 0.5,
          backgroundColor: separatorColor,
        }}
      />
      <View className="flex-1 bg-system-background">
        {splitViewEntry ? (
          <SplitViewEntryDetail state={splitViewEntry} />
        ) : (
          <SplitViewEmptyDetail />
        )}
      </View>
    </View>
  )
}
