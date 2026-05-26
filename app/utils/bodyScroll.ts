type BodyScrollState = {
  previousOverflow: string | null
}

type LockBodyScrollOptions = {
  bodyStyle: CSSStyleDeclaration
  state: BodyScrollState
}

type UnlockBodyScrollOptions = {
  bodyStyle: CSSStyleDeclaration
  state: BodyScrollState
}

export const lockBodyScroll = ({
  bodyStyle,
  state
}: LockBodyScrollOptions) => {
  if (state.previousOverflow !== null) {
    return state
  }

  state.previousOverflow = bodyStyle.overflow
  bodyStyle.overflow = 'hidden'

  return state
}

export const unlockBodyScroll = ({
  bodyStyle,
  state
}: UnlockBodyScrollOptions) => {
  if (state.previousOverflow === null) {
    return state
  }

  bodyStyle.overflow = state.previousOverflow
  state.previousOverflow = null

  return state
}