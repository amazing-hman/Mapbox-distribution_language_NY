import React, { FC } from 'react'
import { Switch, Route } from 'react-router-dom'
import { Typography } from '@material-ui/core'

import { RecordDescription } from 'components/results'
import { DetailedIntro } from 'components/details'
import { usePanelRootStyles } from 'components/panels/PanelContent'
import { NoFeatSel } from './NoFeatSel'
import { useDetailsNew } from './hooks'

const Loading: FC = () => {
  const panelRootClasses = usePanelRootStyles()

  return (
    <div className={panelRootClasses.root}>
      <p>Loading communities...</p>
    </div>
  )
}

const DetailsWrap: FC = () => {
  const { isLoading, error, data, id } = useDetailsNew()

  if (isLoading) return <Loading />
  if (error) return <p>Something went wrong looking for this community.</p>
  // if (notFound || !data) // TODO
  if (!data)
    return <NoFeatSel reason={`No community found with an id of ${id}.`} />

  const { Description, 'Language Description': langDescrip = '' } = data

  document.title = `${data.Language} - NYC Languages`

  return (
    <>
      {/* TODO: something that works */}
      {/* {state.panelState === 'default' && ( <ScrollToTopOnMount elemID={elemID} trigger={loc.pathname} /> )} */}
      <DetailedIntro data={data} isInstance />
      <Typography variant="body2" component="div" align="left">
        <RecordDescription text={Description || langDescrip} />
      </Typography>
    </>
  )
}

export const DetailsPanel: FC = () => {
  const panelRootClasses = usePanelRootStyles()

  return (
    <div className={panelRootClasses.root} id="details">
      <Switch>
        <Route path="/details/:id">
          <DetailsWrap />
        </Route>
        <Route path="/details" exact>
          <NoFeatSel />
        </Route>
      </Switch>
    </div>
  )
}
