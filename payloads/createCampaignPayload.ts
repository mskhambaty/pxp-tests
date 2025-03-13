import { CreateCampaignRequest } from '../types/campaignTypes';

export const createCampaignPayload: CreateCampaignRequest = {
  tiers: [
    {
      tier_type: 'paid',
      rewards: ['Test rewards'],
      tier_name: 'Gold Supporter',
      price: 100,
      nft_image: {
        description: 'A gold badge representing premium support.',
        artistic_style: 'Realistic',
      },
    },
  ],
  fundraiser_name: 'test foo',
  organizer_name: 'test organizer name',
  organizer_email: 'test@test.com',
  hero_image: {
    description: 'A vibrant image of a clean ocean.',
    artistic_style: 'Realistic',
  },
  description: '<p>Test description</p>',
};
