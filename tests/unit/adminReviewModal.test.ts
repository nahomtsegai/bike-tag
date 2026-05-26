import { describe, expect, it, vi } from 'vitest'
import {
  getFocusableElements,
  shouldCloseReviewModal,
  shouldSubmitReviewModal,
  shouldTrapReviewModalFocus,
  trapReviewModalFocus
} from '../../app/utils/adminReviewModal'

type FakeKeyboardEvent = KeyboardEvent & {
  key: string
  shiftKey: boolean
  preventDefault: () => void
}

type FakeElement = HTMLElement & {
  focus: () => void
  contains: (element: Element | null) => boolean
  querySelectorAll: () => HTMLElement[]
}

const createFakeKeyboardEvent = ({
  key,
  shiftKey = false
}: {
  key: string
  shiftKey?: boolean
}) => {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn()
  } as unknown as FakeKeyboardEvent
}

const createFakeElement = ({
  focus = vi.fn(),
  contains = () => true,
  focusableElements = []
}: {
  focus?: () => void
  contains?: (element: Element | null) => boolean
  focusableElements?: HTMLElement[]
} = {}) => {
  return {
    focus,
    contains,
    querySelectorAll: vi.fn(() => {
      return focusableElements
    })
  } as unknown as FakeElement
}

describe('adminReviewModal', () => {
  describe('getFocusableElements', () => {
    it('returns an empty array when no container is provided', () => {
      expect(getFocusableElements(null)).toEqual([])
    })

    it('returns focusable elements from the container', () => {
      const firstButton = createFakeElement()
      const secondButton = createFakeElement()

      const container = createFakeElement({
        focusableElements: [firstButton, secondButton]
      })

      expect(getFocusableElements(container)).toEqual([
        firstButton,
        secondButton
      ])
    })
  })

  describe('keyboard checks', () => {
    it('detects Escape as a close modal event', () => {
      expect(shouldCloseReviewModal({ key: 'Escape' })).toBe(true)
      expect(shouldCloseReviewModal({ key: 'Enter' })).toBe(false)
    })

    it('detects Enter as a submit modal event', () => {
      expect(shouldSubmitReviewModal({ key: 'Enter' })).toBe(true)
      expect(shouldSubmitReviewModal({ key: 'Escape' })).toBe(false)
    })

    it('detects Tab as a focus trap event', () => {
      expect(shouldTrapReviewModalFocus({ key: 'Tab' })).toBe(true)
      expect(shouldTrapReviewModalFocus({ key: 'Enter' })).toBe(false)
    })
  })

  describe('trapReviewModalFocus', () => {
    it('does nothing when no modal element exists', () => {
      const event = createFakeKeyboardEvent({ key: 'Tab' })

      trapReviewModalFocus({
        event,
        modalElement: null,
        focusableElements: [],
        activeElement: null
      })

      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('focuses the modal when no focusable elements exist', () => {
      const event = createFakeKeyboardEvent({ key: 'Tab' })
      const modalFocus = vi.fn()
      const modalElement = createFakeElement({
        focus: modalFocus
      })

      trapReviewModalFocus({
        event,
        modalElement,
        focusableElements: [],
        activeElement: null
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(modalFocus).toHaveBeenCalled()
    })

    it('moves focus to the first focusable element when focus is outside the modal', () => {
      const event = createFakeKeyboardEvent({ key: 'Tab' })
      const firstFocus = vi.fn()
      const firstButton = createFakeElement({
        focus: firstFocus
      })
      const lastButton = createFakeElement()

      const modalElement = createFakeElement({
        contains: () => false
      })

      trapReviewModalFocus({
        event,
        modalElement,
        focusableElements: [firstButton, lastButton],
        activeElement: createFakeElement()
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(firstFocus).toHaveBeenCalled()
    })

    it('moves focus to the last focusable element when shift tabbing from the first element', () => {
      const event = createFakeKeyboardEvent({
        key: 'Tab',
        shiftKey: true
      })
      const firstButton = createFakeElement()
      const lastFocus = vi.fn()
      const lastButton = createFakeElement({
        focus: lastFocus
      })
      const modalElement = createFakeElement()

      trapReviewModalFocus({
        event,
        modalElement,
        focusableElements: [firstButton, lastButton],
        activeElement: firstButton
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(lastFocus).toHaveBeenCalled()
    })

    it('moves focus to the first focusable element when tabbing from the last element', () => {
      const event = createFakeKeyboardEvent({ key: 'Tab' })
      const firstFocus = vi.fn()
      const firstButton = createFakeElement({
        focus: firstFocus
      })
      const lastButton = createFakeElement()
      const modalElement = createFakeElement()

      trapReviewModalFocus({
        event,
        modalElement,
        focusableElements: [firstButton, lastButton],
        activeElement: lastButton
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(firstFocus).toHaveBeenCalled()
    })

    it('does nothing when focus is already safely inside the modal', () => {
      const event = createFakeKeyboardEvent({ key: 'Tab' })
      const firstButton = createFakeElement()
      const middleButton = createFakeElement()
      const lastButton = createFakeElement()
      const modalElement = createFakeElement()

      trapReviewModalFocus({
        event,
        modalElement,
        focusableElements: [firstButton, middleButton, lastButton],
        activeElement: middleButton
      })

      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })
})