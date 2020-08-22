import React, { FC, useState, useContext, useEffect } from 'react'
import { useLocation, Switch, Route } from 'react-router-dom'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Box, IconButton } from '@material-ui/core'
import { MdClose } from 'react-icons/md'

import { Map, MapPanel } from 'components/map'
import { GlobalContext } from 'components'
import { LayerPropsNonBGlayer } from './types'
import { panelsConfig } from '../../config/panels-config'
import { getIDfromURLparams, getMbStyleDocument } from '../../utils'
import { mbStyleTileConfig, MID_BREAKPOINT } from './config'

const transforms = {
  open: 'translateY(0%)',
  closed: 'translateY(100%)',
}

const panelWidths = {
  mid: 375,
  midLarge: 475,
}

// TODO: into separate file, too big
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    mapWrapRoot: {
      bottom: 0,
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      width: '100%',
      // TODO: ensure attribution and logo are both clearly visible at all
      // breakpoints. A bit mixed/scattered RN.
      '& .mapboxgl-ctrl-top-right': {
        bottom: -18,
        right: 50,
        [theme.breakpoints.up('sm')]: {
          bottom: 6,
          right: 2,
          top: 'auto',
        },
      },
      '& .mapboxgl-ctrl-bottom-left': {
        bottom: -4,
        [theme.breakpoints.up('sm')]: {
          bottom: 0,
          left: 0,
        },
      },
      '& .mapboxgl-ctrl-bottom-left a': {
        color: theme.palette.grey[700],
      },
    },
    mapItselfWrap: {
      bottom: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
    },
    mapPanelsWrap: {
      bottom: 4,
      left: theme.spacing(1),
      position: 'absolute',
      right: theme.spacing(1),
      top: '50%',
      transition: '300ms transform',
      // TODO: you know what
      [theme.breakpoints.up(MID_BREAKPOINT)]: {
        bottom: theme.spacing(3), // above mapbox stuffs
        left: theme.spacing(3),
        top: theme.spacing(3),
        width: panelWidths.mid,
      },
      [theme.breakpoints.up('md')]: {
        width: panelWidths.midLarge,
      },
      '& .MuiPaper-root': {
        height: '100%',
        overflowY: 'auto',
      },
    },
    closePanel: {
      color: theme.palette.common.white,
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      zIndex: 2,
    },
  })
)

export const MapWrap: FC = () => {
  const classes = useStyles()
  const loc = useLocation()
  const { state, dispatch } = useContext(GlobalContext)
  const [panelOpen, setPanelOpen] = useState(true)
  const [symbLayers, setSymbLayers] = useState<LayerPropsNonBGlayer[]>()
  const [labelLayers, setLabelLayers] = useState<LayerPropsNonBGlayer[]>()
  const { langFeaturesCached } = state

  // Fetch MB Style doc
  useEffect(() => {
    getMbStyleDocument(
      mbStyleTileConfig.symbStyleUrl,
      dispatch,
      setSymbLayers,
      setLabelLayers
    ).catch((errMsg) => {
      // eslint-disable-next-line no-console
      console.error(
        // TODO: wire up sentry
        `Something went wrong trying to fetch MB style JSON: ${errMsg}`
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Do selected feature stuff on location change
  useEffect((): void => {
    const idFromUrl = getIDfromURLparams(window.location.search)

    if (!langFeaturesCached.length) {
      return
    }

    if (!idFromUrl || idFromUrl === -1) {
      dispatch({
        type: 'SET_SEL_FEAT_ATTRIBS',
        payload: null,
      })

      return
    }

    // TODO: handle scenario where feature exists in cached but not filtered
    // const matchedFeat = state.langFeaturesCached.find(
    //   (feat) => parsed.id === feat.ID.toString()
    // )
    const matchingRecord = langFeaturesCached.find(
      (record) => record.ID === idFromUrl
    )

    if (!matchingRecord) {
      dispatch({
        type: 'SET_SEL_FEAT_ATTRIBS',
        payload: null,
      })

      return
    }

    document.title = `${matchingRecord.Language as string} - NYC Languages`

    dispatch({
      type: 'SET_SEL_FEAT_ATTRIBS',
      payload: matchingRecord,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, state.langFeaturesCached.length])

  useEffect((): void => setPanelOpen(true), [loc]) // TODO: not so willy-nilly?

  return (
    <div className={classes.mapWrapRoot}>
      {symbLayers && labelLayers && (
        <Map
          wrapClassName={classes.mapItselfWrap}
          symbLayers={symbLayers}
          labelLayers={labelLayers}
          baselayer={state.baselayer}
        />
      )}
      <Box
        // Need the `id` in order to find unique element for `map.setPadding`
        id="map-panels-wrap"
        className={classes.mapPanelsWrap}
        style={{
          transform: panelOpen ? transforms.open : transforms.closed,
          opacity: panelOpen ? 1 : 0,
          maxHeight: panelOpen ? '100%' : 0,
        }}
      >
        <Switch>
          {panelsConfig.map((config) => (
            <Route key={config.heading} path={config.path}>
              <MapPanel {...config} active={loc.pathname === config.path} />
            </Route>
          ))}
        </Switch>
        {panelOpen && (
          <IconButton
            aria-label="close"
            title="Hide panel"
            size="small"
            className={classes.closePanel}
            onClick={() => setPanelOpen(false)}
          >
            <MdClose />
          </IconButton>
        )}
      </Box>
    </div>
  )
}
