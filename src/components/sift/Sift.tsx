import React, { FC, useContext } from 'react'
import { useRouteMatch, useParams } from 'react-router-dom'

import { GlobalContext, useSymbAndLabelState } from 'components'
import { Category, CategoriesWrap } from 'components/sift'
import { LegendSwatch } from 'components/legend'
import { getCodeByCountry } from 'components/results'
import { PanelContent } from '../panels/PanelContent'
import { LangRecordSchema } from '../../context/types'
import * as utils from './utils'
import * as config from './config'

export const Field: FC = () => {
  // The <Route> that rendered this component has a path of `/topics/:topicId`.
  // The `:topicId` portion of the URL indicates a placeholder that we can get
  // from `useParams()`.
  const { field, value } = useParams() as {
    field: keyof LangRecordSchema
    value: string
  }
  const { url } = useRouteMatch()
  const { state } = useContext(GlobalContext)
  const symbLabelState = useSymbAndLabelState()
  const uniqueInstances = utils.getUniqueInstances(
    field,
    state.langFeatures, // but what if filtered? may need global cache again...
    true // mmmmmmmmmm
  )
  let icon

  if (field === 'World Region' && value) {
    const regionSwatchColor =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      symbLabelState.legendSymbols[value].paint['icon-color'] as string

    icon = (
      <LegendSwatch
        legendLabel="World Region"
        labelStyleOverride={{
          fontSize: 'inherit',
          fontFamily: 'inherit',
          lineHeight: 'inherit',
        }}
        component="div"
        iconID="_circle"
        backgroundColor={regionSwatchColor || 'transparent'}
      />
    )
  } else {
    icon = config.categories.find(({ name }) => name === field)?.icon
  }

  return (
    <PanelContent
      title={field}
      icon={icon}
      intro={`will check to see if ${field.toUpperCase()} has a spesh intro, or just show some totals and/or a blurb about filters and a link to clear them.`}
    >
      <CategoriesWrap>
        {uniqueInstances.map((instance) => {
          const asString = instance as string

          return (
            <Category
              key={asString}
              intro="Total w/filts"
              title={asString}
              url={`${url}/${asString}`}
              subtitle={asString}
              uniqueInstances={[]}
            />
          )
        })}
      </CategoriesWrap>
    </PanelContent>
  )
}

// TODO: duuuuude just make a route for this and FlagWithTitle
export const SimpleSwatch: FC<{ label: string }> = (props) => {
  const { label } = props
  const symbLabelState = useSymbAndLabelState()

  const regionSwatchColor =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    symbLabelState.legendSymbols[label].paint['icon-color'] as string

  return (
    <LegendSwatch
      legendLabel={label}
      labelStyleOverride={{
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
      }}
      component="div"
      iconID="_circle"
      backgroundColor={regionSwatchColor || 'transparent'}
    />
  )
}

export const FlagWithTitle: FC<{ countryName: string }> = (props) => {
  const { countryName } = props

  return (
    <>
      <img
        style={{
          height: '0.8em',
          marginRight: '0.25em',
          // Ensure outer white shapes are seen
          // outline: `solid 1px ${theme.palette.divider}`, // TODO
        }}
        className="country-flag"
        alt={`${countryName} flag`}
        src={`/img/country-flags/${getCodeByCountry(
          countryName
        ).toLowerCase()}.svg`}
      />{' '}
      {countryName}
    </>
  )
}

export const FieldValue: FC = () => {
  // The <Route> that rendered this component has a path of `/topics/:topicId`.
  // The `:topicId` portion of the URL indicates a placeholder that we can get
  // from `useParams()`.
  const { field, value } = useParams() as {
    field: keyof LangRecordSchema
    value: string
  }
  const { state } = useContext(GlobalContext)
  const { langFeatures, langFeatsLenCache } = state

  if (!langFeatsLenCache) return <p>Loading communities...</p>

  const matchedComms = langFeatures.filter((feat) =>
    feat[field]?.toString().includes(value as string)
  )

  let icon

  if (field === 'World Region' && value) {
    icon = <SimpleSwatch label={value as string} />
  } else if (field === 'Countries') {
    icon = <FlagWithTitle countryName={value} />
  } else {
    icon = config.categories.find(({ name }) => name === field)?.icon
  }

  if (!matchedComms.length)
    return (
      <PanelContent title={!icon ? value.toString() : ''} icon={icon}>
        No communities available.
      </PanelContent>
    )

  return (
    <PanelContent
      title={!icon ? value.toString() : ''}
      icon={icon}
      intro={`will check to see if ${value
        .toString()
        .toUpperCase()} has a spesh intro, or just show some totals and/or a blurb about filters and a link to clear them.`}
    >
      <CategoriesWrap>
        {matchedComms.map((comm) => {
          let title = comm.Endonym
          let intro = ''

          if (comm.Glottocode) intro = `Glotto: ${comm.Glottocode}`
          if (comm['ISO 639-3']) intro += ` ISO: ${comm['ISO 639-3']}`

          if (field === 'Language') {
            title = comm.Neighborhoods?.split(', ')[0] || comm.Town
          }

          return (
            <Category
              key={comm.ID}
              intro={intro}
              title={title}
              url={`/details/${comm.ID}`}
              subtitle={comm.Language}
              uniqueInstances={[]}
            />
          )
        })}
      </CategoriesWrap>
    </PanelContent>
  )
}
