import { CreateCampaignRequest } from '../types/campaignTypes';

/**
 * Default payload used when creating a test campaign via the PanXpan API.
 * This payload marks the campaign as a test (`is_test: true`) and defines a
 * single paid tier.  Individual tests may spread this payload and override
 * certain fields (like fundraiser_name) to generate unique names.
 */
export const createCampaignPayload: CreateCampaignRequest = {
  tiers: [
    {
      tier_type: 'paid',
      rewards: ['Test reward'],
      tier_name: 'Test Supporter',
      price: 100,
      nft_image: {
        description: 'An example image representing a test collectible.',
        artistic_style: 'Realistic',
      },
    },
  ],
  fundraiser_name: 'test fundraiser',
  organizer_name: 'Test Organizer',
  organizer_email: 'test@example.com',
  hero_image: {
    description: 'A placeholder hero image description.',
    artistic_style: 'Realistic',
  },
  description: 'Test description',
  is_test: true,
};