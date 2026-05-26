export const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) {
    return []
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
  )
}

export const shouldCloseReviewModal = (
  event: Pick<KeyboardEvent, 'key'>
) => {
  return event.key === 'Escape'
}

export const shouldSubmitReviewModal = (
  event: Pick<KeyboardEvent, 'key'>
) => {
  return event.key === 'Enter'
}

export const shouldTrapReviewModalFocus = (
  event: Pick<KeyboardEvent, 'key'>
) => {
  return event.key === 'Tab'
}

type TrapReviewModalFocusOptions = {
  event: KeyboardEvent
  modalElement: HTMLElement | null
  focusableElements: HTMLElement[]
  activeElement: Element | null
}

export const trapReviewModalFocus = ({
  event,
  modalElement,
  focusableElements,
  activeElement
}: TrapReviewModalFocusOptions) => {
  if (!modalElement) {
    return
  }

  if (focusableElements.length === 0) {
    event.preventDefault()
    modalElement.focus()
    return
  }

  const firstFocusableElement = focusableElements[0]
  const lastFocusableElement = focusableElements[focusableElements.length - 1]

  if (!modalElement.contains(activeElement)) {
    event.preventDefault()
    firstFocusableElement?.focus()
    return
  }

  if (event.shiftKey && activeElement === firstFocusableElement) {
    event.preventDefault()
    lastFocusableElement?.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastFocusableElement) {
    event.preventDefault()
    firstFocusableElement?.focus()
  }
}