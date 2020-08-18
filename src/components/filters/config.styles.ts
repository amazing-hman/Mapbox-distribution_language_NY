import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    resultsModalRoot: {
      '& .MuiDialog-paper': {
        overflowY: 'hidden',
      },
      '& .MuiPaper-root': {
        overflowY: 'hidden',
      },
      // Don't even know what this is, some kind of spacer or something to do
      // with grouping perhaps (even though it's set to `false` in the table
      // options), but either way itseems useless.
      '& > div.MuiDialog-container.MuiDialog-scrollPaper > div > div > div:nth-child(2) > div:nth-child(1)': {
        display: 'none',
      },
      // Gross way to get the table footer, which has no unique classes
      '& .MuiPaper-root > .MuiTable-root': {
        bottom: 0,
        position: 'sticky',
      },
      '& .MuiTableBody-root': {
        fontSize: '0.8rem',
      },
      // e.g. the Filter icon at beginning of column filters
      '& .MuiInputAdornment-root': {
        color: theme.palette.grey[500],
      },
      // All column headings
      '& .MuiTableCell-head': {
        color: theme.palette.primary.main,
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Actions heading
      '& .MuiTableCell-head:first-of-type': {
        textAlign: 'left !important', // sick of trying to fight the plugin
        width: '75px !important', // sick of trying to fight the plugin
      },
      // Default cushion of non-dense table cell is 16px
      '& .MuiTableCell-root': {
        padding: '12px 10px',
      },
      // Pagination
      '& .MuiTableCell-footer': {
        padding: 0, // may have no impact when height is set
        // height: 50, // but height is needed in order to establish a minHeight
        // CRED: https://stackoverflow.com/a/25329017/1048518
      },
      // The table footer
      '& .MuiTableFooter-root': {
        background: theme.palette.common.white,
        borderTop: `solid 1px ${theme.palette.grey[400]}`,
        justifyContent: 'center',
      },
      '& .MuiTablePagination-spacer': {
        display: 'none',
      },
      '& .MuiTablePagination-select': {
        paddingLeft: 0,
      },
      // All icons in and out of table. Icons inherit color and size from it.
      '& .MuiIconButton-root': {
        fontSize: '1.4rem',
        padding: 6,
      },
      // ...otherwise it overrides the `disabled` Action buttons
      '& .MuiIconButton-root:not([disabled])': {
        color: theme.palette.primary.main,
      },
      [theme.breakpoints.down('sm')]: {
        '& .MuiTableFooter-root .MuiIconButton-root': {
          padding: 4, // waaaaayy too much default padding, can't see on mobile
        },
      },
      '& .MuiTableSortLabel-icon': {
        flexShrink: 0, // prevents tiny arrows on columns w/wrapped headings
      },
      // Handy reference for potentially useful selectors
      // '& .MuiTableCell-head:not(:first-of-type)': {}, // non-actions headings
      // '& .MuiTableCell-root:first-child': {}, // actions column cells
      // '& .MuiTableCell-root:nth-child(2)': {}, // first non-actions column
      // '& .MuiToolbar-root': {}, // top bar title, free actions; footer pag.
    },
    closeBtn: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      zIndex: 1,
    },
    // Squeeze a bit more room out of the dialog
    resultsModalPaper: {
      marginBottom: 0,
      marginTop: 0,
      maxHeight: `calc(100% - ${theme.spacing(4)}px)`,
    },
  })
)
