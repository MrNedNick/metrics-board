import { beforeEach, describe, expect, it } from 'vitest'
import { clearDroppedParams, droppedParams, isFiltered, toQuery, validateSearch } from './search'

beforeEach(() => clearDroppedParams())

describe('validateSearch', () => {
  it('keeps everything the dashboard understands', () => {
    const search = validateSearch({
      from: '2026-08-01',
      to: '2026-08-31',
      segments: 'enterprise,new',
      channels: 'email',
      q: 'mobile',
      sort: 'revenue',
      dir: 'asc',
    })

    expect(search).toMatchObject({
      from: '2026-08-01',
      segments: ['enterprise', 'new'],
      channels: ['email'],
      q: 'mobile',
      sort: 'revenue',
      dir: 'asc',
    })
  })

  it('drops a broken value instead of throwing, and says which', () => {
    const search = validateSearch({ from: 'yesterday', segments: 'enterprise' })

    expect(search.from).toBeUndefined()
    expect(search.segments).toEqual(['enterprise'])
    expect(search._dropped).toEqual(['from'])
    expect(droppedParams()).toEqual(['from'])
  })

  it('sets a dropped key to undefined, so a merge cannot bring it back', () => {
    const search = validateSearch({ dir: 'sideways' })
    expect('dir' in search).toBe(true)
    expect(search.dir).toBeUndefined()
  })

  it('ignores unknown values inside a list without dropping the list', () => {
    expect(validateSearch({ segments: 'aliens' }).segments).toBeUndefined()
    expect(validateSearch({ segments: 'aliens,new' }).segments).toEqual(['new'])
  })

  it('keeps presentation-only keys out of the API query', () => {
    const query = toQuery(validateSearch({ sort: 'revenue', dir: 'desc', q: 'email' }))
    expect(query).toEqual({ q: 'email' })
  })

  it('knows whether anything is filtered', () => {
    expect(isFiltered(validateSearch({}))).toBe(false)
    expect(isFiltered(validateSearch({ sort: 'revenue' }))).toBe(false)
    expect(isFiltered(validateSearch({ q: 'email' }))).toBe(true)
    expect(isFiltered(validateSearch({ day: '2026-08-01' }))).toBe(true)
  })
})
