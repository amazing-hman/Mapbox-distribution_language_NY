import React, { FC, useState, useContext, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useHistory } from 'react-router-dom'
import {
  AttributionControl,
  Map as MbMap,
  setRTLTextPlugin,
  VectorSource,
  LngLatBoundsLike,
} from 'mapbox-gl'
import MapGL, { InteractiveMap, MapLoadEvent } from 'react-map-gl'
import { useTheme } from '@material-ui/core/styles'

import 'mapbox-gl/dist/mapbox-gl.css'

import { GlobalContext, LoadingBackdrop } from 'components'
import { initLegend } from 'components/legend/utils'
import { LangMbSrcAndLayer } from './LangMbSrcAndLayer'
import { MapPopup } from './MapPopup'
import { MapTooltip } from './MapTooltip'
import { MapCtrlBtns } from './MapCtrlBtns'
import { BoundariesLayer } from './BoundariesLayer'

import * as MapTypes from './types'
import * as utils from './utils'
import * as config from './config'
import * as events from './events'
import { LangRecordSchema } from '../../context/types'
import {
  getIDfromURLparams,
  findFeatureByID,
  useWindowResize,
} from '../../utils'

const { layerId: sourceLayer, langSrcID } = config.mbStyleTileConfig
const { neighbConfig, countiesConfig } = config
const neighSrcId = neighbConfig.source.id
const countiesSrcId = countiesConfig.source.id

// Jest or whatever CANNOT find this plugin. And importing it from
// `react-map-gl` is useless as well.
if (typeof window !== undefined && typeof setRTLTextPlugin === 'function') {
  // Ensure right-to-left languages (Arabic, Hebrew) are shown correctly
  setRTLTextPlugin(
    // latest version: https://www.npmjs.com/package/@mapbox/mapbox-gl-rtl-text
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    // Yeah not today TS, thanks anyway:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    (error): Error => error, // supposed to be an error-handling function
    true // lazy: only load when the map first encounters Hebrew or Arabic text
  )
}

export const Map: FC<MapTypes.MapComponent> = ({
  symbLayers,
  labelLayers,
  baselayer,
  wrapClassName,
}) => {
  const history = useHistory()
  const { state, dispatch } = useContext(GlobalContext)
  const mapRef: React.RefObject<InteractiveMap> = React.createRef()
  const { selFeatAttribs, mapLoaded } = state
  const theme = useTheme()
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const { width, height } = useWindowResize()
  const [viewport, setViewport] = useState(config.initialMapState)
  const [mapOffset, setMapOffset] = useState<[number, number]>([0, 0])
  const [popupVisible, setPopupVisible] = useState<boolean>(false)
  const [popupContent, setPopupContent] = useState<MapTypes.PopupClean>()
  const [tooltipOpen, setTooltipOpen] = useState<MapTypes.MapTooltip | null>(
    null
  )
  const lookups = {
    counties: useQuery<MapTypes.MbBoundaryLookup[]>(countiesSrcId).data,
    neighborhoods: useQuery<MapTypes.MbBoundaryLookup[]>(neighSrcId).data,
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  // ^^^^^ otherwise it wants things like mapRef and dispatch 24/7
  // Set the offset for transitions like `flyTo` and `easeTo`
  useEffect((): void => {
    const deskBreakPoint = theme.breakpoints.values.md
    const wideFella = width >= deskBreakPoint
    const offset = utils.prepMapOffset(wideFella)

    setIsDesktop(wideFella)
    setMapOffset(offset)
  }, [width, height])

  // TODO: another file
  useEffect((): void => {
    if (!mapRef.current || !mapLoaded) return

    const map: MbMap = mapRef.current.getMap()
    const currentLayerNames = state.legendItems.map((item) => item.legendLabel)

    utils.filterLayersByFeatIDs(map, currentLayerNames, state.langFeatIDs)
  }, [state.langFeatIDs])

  // TODO: put in... legend?
  useEffect((): void => {
    initLegend(dispatch, state.activeLangSymbGroupId, symbLayers)
  }, [state.activeLangSymbGroupId])

  // (Re)load symbol icons. Must be done whenever `baselayer` is changed,
  // otherwise the images no longer exist.
  // TODO: rm if no longer using. Currently experiencing tons of issues with
  // custom styles vs. default MB in terms of fonts/glyps and icons/images
  useEffect((): void => {
    if (mapRef.current) {
      const map: MbMap = mapRef.current.getMap()
      utils.addLangTypeIconsToMap(map, config.langTypeIconsConfig)
    }
  }, [baselayer]) // baselayer may be irrelevant if only using Light BG

  // Do selected feature stuff on sel feat change or map load
  useEffect((): void => {
    // Map not ready
    if (!mapRef.current || !mapLoaded) return

    const map: MbMap = mapRef.current.getMap()

    // Deselect any language features
    clearAllSelFeats(map)

    if (!selFeatAttribs) return

    // NOTE: won't get this far on load even if feature is selected. The timing
    // and order of the whole process prevent that. Make feature appear selected

    const { ID, Latitude: latitude, Longitude: longitude } = selFeatAttribs

    setSelFeatState(map, ID, true)

    utils.flyToCoords(
      map,
      { latitude, longitude, zoom: 12 },
      mapOffset,
      selFeatAttribs
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selFeatAttribs, mapLoaded])

  // TODO: higher zIndex on selected feature
  function setSelFeatState(map: MbMap, id: number, selected: boolean) {
    map.setFeatureState({ sourceLayer, source: langSrcID, id }, { selected })
  }

  function onHover(event: MapTypes.MapEvent) {
    if (!mapRef.current || !mapLoaded) return

    const map: MbMap = mapRef.current.getMap()

    events.onHover(event, setTooltipOpen, map)
  }

  // Runs only once and kicks off the whole thinig
  function onLoad(mapLoadEvent: MapLoadEvent) {
    const { target: map } = mapLoadEvent

    const langSrc = map.getSource('languages-src') as VectorSource
    const langSrcBounds = langSrc.bounds as LngLatBoundsLike
    const idFromUrl = getIDfromURLparams(window.location.search)
    const cacheOfIDs: number[] = []
    const uniqueRecords: LangRecordSchema[] = []
    const rawLangFeats = map.querySourceFeatures(langSrcID, { sourceLayer })

    // TODO: start from actual layer bounds somehow, then zoom is not needed.
    map.fitBounds(langSrcBounds) // ensure all feats are visible.

    // Just the properties for table/results, don't need GeoJSON cruft. Also
    // need to make sure each ID is unique as there have been initial data
    // inconsistencies, and more importantly MB may have feature duplication if
    // there is a tile overlap.
    rawLangFeats.forEach((thisFeat) => {
      if (
        !thisFeat.properties ||
        cacheOfIDs.indexOf(thisFeat.properties.ID) !== -1
      ) {
        return
      }

      const justTheProps = thisFeat.properties as LangRecordSchema

      cacheOfIDs.push(justTheProps.ID)
      uniqueRecords.push(justTheProps)
    })

    const matchingRecord = findFeatureByID(uniqueRecords, idFromUrl)

    // NOTE: could not get this into the same `useEffect` that handles when
    // selFeatAttribs or mapLoaded are changed with an MB error/crash.
    if (!matchingRecord) flyHome()

    // TODO: set paint property
    // https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setpaintproperty

    dispatch({ type: 'INIT_LANG_LAYER_FEATURES', payload: uniqueRecords })
    dispatch({ type: 'SET_MAP_LOADED', payload: true })

    // Give MB some well-deserved cred
    map.addControl(new AttributionControl({ compact: false }), 'bottom-right')

    // TODO: put all these init events below into `utils.events.ts`

    // Maintain viewport state sync if needed (e.g. after things like `flyTo`),
    // otherwise the map shifts back to previous position after panning or
    // zooming.
    map.on('moveend', function onMoveEnd(zoomEndEvent) {
      // No custom event data, regular move event
      if (zoomEndEvent.forceViewportUpdate) {
        setViewport({
          ...viewport, // spreading just in case bearing or pitch are added
          zoom: map.getZoom(),
          latitude: map.getCenter().lat,
          longitude: map.getCenter().lng,
        })
      }
    })

    // Close popup on the start of moving so no jank
    map.on('movestart', function onMoveStart(zoomEndEvent) {
      if (zoomEndEvent.selFeatAttribs || zoomEndEvent.popupBasics)
        setPopupVisible(false)
    })

    map.on('zoomend', function onMoveEnd(zoomEndEvent) {
      const { selFeatAttribs: attribs, popupBasics } = zoomEndEvent as {
        selFeatAttribs?: LangRecordSchema
        popupBasics?: MapTypes.PopupClean
      }

      if (!map.isMoving()) {
        if (attribs) {
          setPopupVisible(true)
          setPopupContent({
            latitude: attribs.Latitude,
            longitude: attribs.Longitude,
            ...utils.prepSelLangFeatPopup(attribs),
          })
        } else if (popupBasics) {
          setPopupVisible(true)
          setPopupContent({ ...popupBasics })
        }
      }
    })
  }

  function onNativeClick(event: MapTypes.MapEvent): void {
    if (!mapRef || !mapRef.current || !mapLoaded) return

    const { features } = event
    const sourcesToCheck = [langSrcID, neighSrcId, countiesSrcId]
    const topFeat = features[0]

    // Nothing under the click, or nothing we care about
    if (!topFeat || !sourcesToCheck.includes(topFeat.source)) {
      // Clear sel feat no matter what
      dispatch({ type: 'SET_SEL_FEAT_ATTRIBS', payload: null })

      return
    }

    const isBoundary = [neighSrcId, countiesSrcId].includes(topFeat.source)

    if (isBoundary) {
      const map: MbMap = mapRef.current.getMap()
      const boundsConfig = { width, height, isDesktop, mapOffset }
      const lookup = lookups[topFeat.source as 'neighborhoods' | 'counties']

      events.handleBoundaryClick(
        map,
        topFeat,
        boundsConfig,
        selFeatAttribs,
        lookup
      )
    } else {
      const langFeat = topFeat as MapTypes.LangFeature

      // TODO: use `initialEntries` in <MemoryRouter> to test routing
      history.push(`/details?id=${langFeat.properties.ID}`)
    }

    // TODO: rm if not needed
    // No language features under click, clear the route. Note that this keeps
    // the `id` in the URL if there is already a selected feature, which feels a
    // little weird, but it's much better than relying on a dummy route like
    // `id=-1`. Still not the greatest so keep an eye out for a better solution.

    setTooltipOpen(null) // super annoying if tooltip stays intact after a click
    setPopupVisible(false) // closed by movestart anyway, but smoother this way
  }

  // Assumes map is ready
  function clearAllSelFeats(map: MbMap) {
    // TODO: add `selected` key?
    map.removeFeatureState({ source: langSrcID, sourceLayer })
  }

  function flyHome() {
    if (!mapRef.current) return

    const map: MbMap = mapRef.current.getMap()
    const { latitude, longitude, zoom } = utils.getWebMercSettings(
      width,
      height,
      isDesktop,
      mapOffset,
      config.initialBounds
    )

    map.flyTo(
      {
        essential: true, // not THAT essential if you... don't like cool things
        zoom,
        center: { lng: longitude, lat: latitude },
      },
      {
        // Total hack
        selFeatAttribs: popupContent ? null : selFeatAttribs,
        forceViewportUpdate: true,
        popupBasics: popupContent,
      }
    )
  }

  // TODO: into utils if it doesn't require passing 1000 args
  function onMapCtrlClick(actionID: MapTypes.MapControlAction) {
    if (!mapRef.current) return

    if (actionID === 'info') {
      dispatch({ type: 'TOGGLE_OFF_CANVAS_NAV' })
    } else if (actionID === 'home') {
      flyHome()
    } else {
      // Assumes `in` or `out` from here down...

      const map: MbMap = mapRef.current.getMap()
      const { zoom } = viewport

      map.flyTo(
        {
          essential: true, // not THAT essential if you... don't like cool things
          zoom: actionID === 'in' ? zoom + 1 : zoom - 1,
          center: map.getCenter(),
        },
        {
          // Total hack
          selFeatAttribs: popupContent ? null : selFeatAttribs,
          forceViewportUpdate: true,
          popupBasics: popupContent,
        }
      )
    }
  }

  return (
    <div className={wrapClassName}>
      {!mapLoaded && <LoadingBackdrop />}
      <MapGL
        {...viewport}
        className="mb-language-map"
        clickRadius={4} // much comfier for small points on small screens
        ref={mapRef}
        height="100%"
        width="100%"
        attributionControl={false}
        mapOptions={{ logoPosition: 'bottom-right' }}
        mapboxApiAccessToken={config.MAPBOX_TOKEN}
        mapStyle={config.mbStyleTileConfig.customStyles.light}
        onViewportChange={setViewport}
        onClick={(event: MapTypes.MapEvent) => onNativeClick(event)}
        onHover={onHover}
        onLoad={(mapLoadEvent) => onLoad(mapLoadEvent)}
      >
        {symbLayers && labelLayers && (
          <>
            {/* TODO: put back!! */}
            {/* {symbLayers && ( */}
            {symbLayers && state.neighbLayerVisible && (
              <>
                {[neighbConfig, countiesConfig].map((boundaryConfig) => (
                  <BoundariesLayer
                    key={boundaryConfig.source.id}
                    {...boundaryConfig}
                    beforeId={
                      /* eslint-disable operator-linebreak */
                      state.legendItems.length
                        ? state.legendItems[0].legendLabel
                        : ''
                      /* eslint-enable operator-linebreak */
                    }
                  />
                ))}
              </>
            )}
            <LangMbSrcAndLayer
              {...{ symbLayers, labelLayers }}
              activeLangSymbGroupId={state.activeLangSymbGroupId}
              activeLangLabelId={state.activeLangLabelId}
            />
          </>
        )}
        {popupVisible && popupContent && (
          <MapPopup
            latitude={popupContent.latitude}
            longitude={popupContent.longitude}
            heading={popupContent.heading}
            subheading={popupContent.subheading}
            setPopupVisible={setPopupVisible}
          />
        )}
        {isDesktop && tooltipOpen && (
          <MapTooltip setTooltipOpen={setTooltipOpen} {...tooltipOpen} />
        )}
      </MapGL>
      <MapCtrlBtns
        {...{ mapRef, mapOffset, isDesktop }}
        onMapCtrlClick={(actionID: MapTypes.MapControlAction) => {
          onMapCtrlClick(actionID)
        }}
      />
    </div>
  )
}
