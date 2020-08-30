import React, { FC, useContext } from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

import { GlobalContext } from 'components'
import { LegendSwatch } from 'components/legend'
import { RecordDescription } from 'components/results'
import { isURL, correctDropboxURL, prettyTruncateList } from '../../utils'
// TODO: cell strength bars for Size
// import { COMM_SIZE_COL_MAP } from 'components/results/config'

type EndoImageComponent = {
  url: string
  alt: string
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    intro: {
      padding: '1em 0',
      textAlign: 'center',
      borderBottom: `solid 1px ${theme.palette.divider}`,
    },
    // Gross but it makes `Anashinaabemowin` fit
    detailsPanelHeading: {
      fontSize: '2.4rem',
      [theme.breakpoints.up('sm')]: {
        fontSize: '3rem',
      },
    },
    endoImage: {
      height: 120,
      maxWidth: '95%',
    },
    neighborhoods: {
      fontSize: '0.8rem',
      fontStyle: 'italic',
    },
    description: {
      fontSize: theme.typography.caption.fontSize,
      padding: '0 0.25rem',
      marginBottom: '2.4rem',
    },
    prettyFlex: {
      display: 'flex',
      justifyContent: 'center',
    },
  })
)

// Mongolian, ASL, etc. have URLs to images
const EndoImageWrap: FC<EndoImageComponent> = (props) => {
  const classes = useStyles()
  const { url: origUrl, alt } = props
  const url = correctDropboxURL(origUrl)

  return <img src={url} alt={alt} className={classes.endoImage} />
}

const NoFeatSel: FC = () => {
  return (
    <small>
      No community selected. Click a point in the map or a row in the data table
      to see detailed information.
    </small>
  )
}

export const DetailsPanel: FC = () => {
  const { state } = useContext(GlobalContext)
  const classes = useStyles()

  // Shaky check to see if features have loaded and are stored globally
  // TODO: use MB's loading events to set this instead
  if (!state.langFeaturesCached.length) return null

  const { selFeatAttribs } = state

  // No sel feat details
  if (!selFeatAttribs) return <NoFeatSel />

  const {
    Endonym,
    Language,
    Neighborhoods,
    Description,
    // Size, // TODO: cell strength bars for Size
    Town,
    'World Region': WorldRegion,
  } = selFeatAttribs
  const { detailsPanelHeading, intro, description, neighborhoods } = classes
  const isImage = isURL(Endonym)
  const regionSwatchColor =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state.legendSymbols[WorldRegion].paint['circle-color']

  // TODO: deal with `id` present in URL but no match found
  // const parsed = queryString.parse(window.location.search)
  // const matchingRecord = state.langFeatures.find(
  //   (feature) => feature.ID === parsed.id
  // )

  return (
    <>
      <div className={intro}>
        {(isImage && <EndoImageWrap url={Endonym} alt={Language} />) || (
          <Typography variant="h3" className={detailsPanelHeading}>
            {Endonym}
          </Typography>
        )}
        {Endonym !== Language && (
          <Typography variant="caption" component="p">
            {Language}
          </Typography>
        )}
        <Typography className={neighborhoods}>
          {Neighborhoods ? prettyTruncateList(Neighborhoods) : Town}
        </Typography>
        <div className={classes.prettyFlex}>
          <LegendSwatch
            legendLabel={WorldRegion}
            component="div"
            backgroundColor={regionSwatchColor}
            type="circle"
          />
          {/* TODO: cell strength bars for Size */}
        </div>
      </div>
      <Typography variant="body2" className={description}>
        <RecordDescription text={Description} />
      </Typography>
    </>
  )
}
