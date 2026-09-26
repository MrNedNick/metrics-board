import type { Channel, Segment } from '../../data/types'

/** One vocabulary for the whole screen, so a term means the same thing everywhere. */
export const METRIC_DEFINITIONS = {
  Sessions: 'One visit to the Tidewell website — a landing page, the pricing page or the blog.',
  Signups: 'A visit that ended with a new trial account.',
  Conversion: 'Signups divided by sessions: the share of visits that turn into a trial.',
  Revenue:
    'The first monthly payment from accounts that signed up, in euros, credited to the day and channel of the signup visit.',
} as const

export const SEGMENT_DEFINITIONS: Record<Segment, string> = {
  new: 'first visit to the site.',
  returning: 'has been on the site before.',
  enterprise: 'a company on the sales team’s list — teams of 50 seats and more, on the Enterprise plan.',
}

export const CHANNEL_DEFINITIONS: Record<Channel, string> = {
  search: 'Google, both organic results and ads.',
  social: 'links from social networks.',
  email: 'the newsletter and emails to trial users.',
  direct: 'typed the address or opened a bookmark.',
  referral: 'links from partner and review sites.',
}
