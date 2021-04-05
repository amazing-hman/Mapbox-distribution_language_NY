import React, { FC } from 'react'
import { Source, Layer } from 'react-map-gl'

import { CensusLayerProps } from './types'
import { CENSUS_PROMOTE_ID_FIELD, censusLayersConfig } from './config.census'
import { useCensusSymb, useZoomToBounds } from './hooks'

export const CensusLayer: FC<CensusLayerProps> = (props) => {
  const { map, beforeId, configKey, mapLoaded } = props
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore // TODO: come on
  const layerConfig = censusLayersConfig[configKey]
  const { sourceID, sourceLayer, routePath } = layerConfig
  const { tableName, url, linePaint } = layerConfig

  const { fillPaint, visible, error, isLoading } = useCensusSymb(
    sourceLayer,
    sourceID,
    map
  )

  useZoomToBounds(routePath, tableName, mapLoaded, map)

  if (error) return null // TODO: sentry

  const visibility = visible && !isLoading ? 'visible' : 'none'

  return (
    <Source
      id={sourceID}
      url={url}
      type="vector"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      promoteId={CENSUS_PROMOTE_ID_FIELD}
    >
      <Layer
        // TODO: rm if layer order is never important
        id={`${sourceID}-placeholder`}
        type="background"
        paint={{ 'background-opacity': 0 }}
      />
      <Layer
        beforeId={beforeId}
        id={`${sourceID}-poly`}
        source={sourceID}
        source-layer={sourceLayer}
        type="fill"
        paint={fillPaint}
        layout={{ visibility }}
      />
      <Layer
        beforeId={beforeId}
        id={`${sourceID}-line`}
        source={sourceID}
        source-layer={sourceLayer}
        type="line"
        paint={linePaint}
        layout={{ visibility }}
      />
    </Source>
  )
}
