import { describe, expect, it, vi } from 'vitest'
import { restoreModalTriggerFocus } from '../../app/utils/modalFocus'

const createFakeElement = () => {
  return {
    focus: vi.fn()
  } as unknown as HTMLElement
}

describe('modalFocus', () => {
  describe('restoreModalTriggerFocus', () => {
    it('returns false when not running on the client', () => {
      const triggerElement = createFakeElement()

      const didRestoreFocus = restoreModalTriggerFocus({
        triggerElement,
        isClient: false,
        containsElement: () => true
      })

      expect(didRestoreFocus).toBe(false)
      expect(triggerElement.focus).not.toHaveBeenCalled()
    })

    it('returns false when no trigger element exists', () => {
      const didRestoreFocus = restoreModalTriggerFocus({
        triggerElement: null,
        isClient: true,
        containsElement: () => true
      })

      expect(didRestoreFocus).toBe(false)
    })

    it('returns false when the trigger element is no longer in the document', () => {
      const triggerElement = createFakeElement()

      const didRestoreFocus = restoreModalTriggerFocus({
        triggerElement,
        isClient: true,
        containsElement: () => false
      })

      expect(didRestoreFocus).toBe(false)
      expect(triggerElement.focus).not.toHaveBeenCalled()
    })

    it('focuses the trigger element when it exists in the document', () => {
      const triggerElement = createFakeElement()

      const didRestoreFocus = restoreModalTriggerFocus({
        triggerElement,
        isClient: true,
        containsElement: () => true
      })

      expect(didRestoreFocus).toBe(true)
      expect(triggerElement.focus).toHaveBeenCalled()
    })
  })
})
