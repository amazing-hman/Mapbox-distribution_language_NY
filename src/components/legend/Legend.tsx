import React, { FC } from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'

import { LegendSwatch } from 'components/legend'
import { langTypeIconsConfig } from 'components/map/config'
import { LegendSwatchComponent } from './types'

type LegendComponent = {
  items: LegendSwatchComponent[]
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    legendRoot: {
      listStyleType: 'none',
      marginBottom: theme.spacing(1),
      marginTop: 0,
      paddingLeft: 4,
      [theme.breakpoints.up('sm')]: {
        paddingLeft: 10,
      },
    },
  })
)

export const Legend: FC<LegendComponent> = ({ items }) => {
  const classes = useStyles()

  return (
    <ul className={classes.legendRoot}>
      {items.map((item) => {
        let matchingConfig

        if (item.iconID) {
          matchingConfig = langTypeIconsConfig.find(
            (icon) => icon.id === item.iconID
          )
        }

        return (
          <LegendSwatch
            key={item.legendLabel}
            {...item}
            icon={matchingConfig && matchingConfig.icon}
          />
        )
      })}
    </ul>
  )
}
