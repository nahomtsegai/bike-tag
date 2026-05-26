type RestoreModalTriggerFocusOptions = {
  triggerElement: HTMLElement | null
  isClient: boolean
  containsElement: (element: HTMLElement) => boolean
}

export const restoreModalTriggerFocus = ({
  triggerElement,
  isClient,
  containsElement
}: RestoreModalTriggerFocusOptions) => {
  if (!isClient || !triggerElement || !containsElement(triggerElement)) {
    return false
  }

  triggerElement.focus()
  return true
}