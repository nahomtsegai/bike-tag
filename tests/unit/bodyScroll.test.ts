import { describe, expect, it } from 'vitest'
import {
  lockBodyScroll,
  unlockBodyScroll
} from '../../app/utils/bodyScroll'

const createBodyStyle = (overflow = '') => {
  return {
    overflow
  } as CSSStyleDeclaration
}

describe('bodyScroll', () => {
  describe('lockBodyScroll', () => {
    it('stores the current body overflow and sets overflow to hidden', () => {
      const bodyStyle = createBodyStyle('auto')
      const state = {
        previousOverflow: null
      }

      lockBodyScroll({
        bodyStyle,
        state
      })

      expect(state.previousOverflow).toBe('auto')
      expect(bodyStyle.overflow).toBe('hidden')
    })

    it('does nothing when body scroll is already locked', () => {
      const bodyStyle = createBodyStyle('hidden')
      const state = {
        previousOverflow: 'auto'
      }

      lockBodyScroll({
        bodyStyle,
        state
      })

      expect(state.previousOverflow).toBe('auto')
      expect(bodyStyle.overflow).toBe('hidden')
    })
  })

  describe('unlockBodyScroll', () => {
    it('restores the previous body overflow value', () => {
      const bodyStyle = createBodyStyle('hidden')
      const state = {
        previousOverflow: 'auto'
      }

      unlockBodyScroll({
        bodyStyle,
        state
      })

      expect(bodyStyle.overflow).toBe('auto')
      expect(state.previousOverflow).toBeNull()
    })

    it('does nothing when body scroll is not locked', () => {
      const bodyStyle = createBodyStyle('auto')
      const state = {
        previousOverflow: null
      }

      unlockBodyScroll({
        bodyStyle,
        state
      })

      expect(bodyStyle.overflow).toBe('auto')
      expect(state.previousOverflow).toBeNull()
    })
  })
})