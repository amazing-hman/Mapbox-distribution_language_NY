import React, { FC, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { AnyLayout, Expression } from 'mapbox-gl'
import { Source, Layer } from 'react-map-gl'

import { useSymbAndLabelState } from 'components/context'
import { configEndpoints } from 'components/spatial/config'
import { reactQueryDefaults } from 'components/config'
import { RawSheetsResponse } from 'components/config/types'

import { sheetsToJSON } from '../../utils'
import { asyncAwaitFetch, prepEndoFilters } from './utils'
import { useLayersConfig } from './hooks'

import * as config from './config'
import * as Types from './types'

export const LangMbSrcAndLayer: FC = () => {
  const symbLabelState = useSymbAndLabelState()
  const { activeLabelID, activeSymbGroupID } = symbLabelState
  const {
    data: fontsData,
    isLoading: isFontsLoading,
    error: fontsError,
  } = useQuery(
    'sheets-config',
    () => asyncAwaitFetch<RawSheetsResponse>(configEndpoints.langConfig),
    reactQueryDefaults
  )
  const { data: layersData, error: layersError } = useLayersConfig(
    activeSymbGroupID
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [endoFonts, setEndoFonts] = useState<any[]>()

  const getLayout = (layout: AnyLayout): AnyLayout => {
    const bareMinimum: AnyLayout = {
      ...config.mapLabelDefaults.layout,
      ...layout,
    }

    if (!activeLabelID || activeLabelID === 'None' || !endoFonts) {
      return { ...bareMinimum, 'text-field': '' }
    }

    const isEndo = activeLabelID === 'Endonym'
    const defaultFont = ['Noto Sans Regular', 'Arial Unicode MS Regular']
    const defaultTextField: Expression = ['to-string', ['get', activeLabelID]]
    // TODO: check if 'Font Image Alt' is populated instead of using this
    // remnant of the Endo http check implemented before that field existed.
    const imgCheck: Expression = [
      'case',
      ['==', ['slice', ['get', 'Endonym'], 0, 4], ''],
      ['get', 'Language'],
      ['get', 'Endonym'],
    ]

    return {
      ...bareMinimum,
      'text-font': isEndo ? endoFonts : defaultFont,
      'text-field': isEndo ? imgCheck : defaultTextField,
    }
  }

  useEffect(() => {
    if (isFontsLoading || !fontsData?.values) return

    const dataAsJson = sheetsToJSON<{ Font: string; Language: string }[]>(
      fontsData.values
    )

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore // don't care, will be from Airtable soon
    setEndoFonts(prepEndoFilters(dataAsJson))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFontsLoading])

  if (fontsError || layersError)
    throw new Error(`Something went wrong setting up ${activeSymbGroupID}`)

  return (
    <Source
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore // promoteId is just not anywhere in the source...
      type="vector"
      url={`mapbox://${config.mbStyleTileConfig.tilesetId}`}
      id={config.mbStyleTileConfig.langSrcID}
    >
      {/* @ts-ignore */}
      {layersData.map((layer: Types.LayerPropsPlusMeta) => {
        let { paint, layout } = layer

        layout = getLayout(layout)

        // TODO: marker for selected feature
        if (activeLabelID && activeLabelID !== 'None') {
          paint = { ...config.mapLabelDefaults.paint, ...paint }
        }

        return (
          <Layer
            key={layer.id}
            {...layer}
            type="symbol" // R.I.P. circles
            source-layer={config.mbStyleTileConfig.layerId}
            layout={layout}
            paint={paint}
          />
        )
      })}
    </Source>
  )
}
