export interface Monitor {
  id: string
  name: string
  resWidth: number
  resHeight: number
  diagonal: number
  visible: boolean
  colorSlot: number
}

export type Alignment =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** The editable fields of a monitor — everything the form collects. */
export type MonitorInput = Pick<Monitor, 'name' | 'resWidth' | 'resHeight' | 'diagonal'>
