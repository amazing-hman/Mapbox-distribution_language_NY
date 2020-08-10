import React, { FC, useContext } from 'react'
import * as mbGlFull from 'mapbox-gl'
import { Source, Layer } from 'react-map-gl'

import { GlobalContext } from 'components'
import { LayerPropsPlusMeta } from './types'
import { mbStyleTileConfig } from './config'

type SourceAndLayerType = {
  symbLayers: LayerPropsPlusMeta[]
  labelLayers: LayerPropsPlusMeta[]
}

export const LangMbSrcAndLayer: FC<SourceAndLayerType> = ({
  symbLayers,
  labelLayers,
}) => {
  const { state } = useContext(GlobalContext)
  const { activeLangSymbGroupId, activeLangLabelId } = state

  // NOTE: it did not seem to work when using two different Styles with the same
  // dataset unless waiting until there is something to put into <Source>.
  return (
    <Source
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore // promoteId is just not anywhere in the source...
      promoteId="ID"
      type="vector"
      url={`mapbox://${mbStyleTileConfig.tilesetId}`}
      id={mbStyleTileConfig.internalSrcID}
    >
      {symbLayers.map((layer: LayerPropsPlusMeta) => {
        let { paint, layout } = layer
        const isInActiveGroup =
          layer.metadata['mapbox:group'] === activeLangSymbGroupId

        // Hide if not in active symbology group
        layout = {
          ...layout,
          visibility: isInActiveGroup ? 'visible' : 'none',
        }

        // Set selected feature stroke for all layers of `circle` type
        if (layer.type === 'circle') {
          paint = {
            ...paint,
            'circle-stroke-color': 'cyan',
            'circle-stroke-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3,
              0,
            ],
          }
          // TODO: change symbol size (???) for selected feat. Evidently cannot
          // set layout properties base on feature-state though...
        } else if (layer.type === 'symbol') {
          layout = {
            ...layout,
            'icon-size': 0.5, // 0.8 looks good with 24x24 source image
          }
        }

        return (
          <Layer
            key={layer.id}
            {...layer}
            layout={layout}
            // TODO: some kind of transition/animation on switch
            paint={paint}
          />
        )
      })}
      {labelLayers.map((layer: LayerPropsPlusMeta) => {
        const isActiveLabel = layer.id === activeLangLabelId

        const layout: mbGlFull.AnyLayout = {
          ...layer.layout,
          visibility: isActiveLabel ? 'visible' : 'none',
        }

        return <Layer key={layer.id} {...layer} layout={layout} />
      })}
    </Source>
  )
}
