import React, { FC, useContext } from 'react'
import { Grid } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'

import { GlobalContext } from 'components'
import { LayerSymbSelect, LayerLabelSelect, Legend } from 'components/legend'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    layersPanelRoot: {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  })
)

export const LegendPanel: FC = () => {
  const classes = useStyles()
  const { state } = useContext(GlobalContext)

  return (
    <>
      <Grid container className={classes.layersPanelRoot} spacing={2}>
        <Grid item>
          <LayerSymbSelect />
        </Grid>
        <Grid item>
          <LayerLabelSelect />
        </Grid>
      </Grid>
      <Legend items={state.langLegend} />
    </>
  )
}
