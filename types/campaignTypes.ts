// types/campaignTypes.ts

export interface CreateCampaignRequest {
  tiers: {
    tier_type: 'paid' | 'free';
    rewards: string[];
    tier_name: string;
    price?: number;
    nft_image: {
      description: string;
      artistic_style: string;
    };
  }[];
  fundraiser_name: string;
  organizer_name: string;
  organizer_email: string;
  goal_amount?: number;
  duration_days?: number;
  meta_description?: string;
  hero_image: {
    description: string;
    artistic_style: string;
  };
  description: string;
  is_test?: boolean;
  community_site_link?: string;
  live_date?: string;
}

export interface CreateCampaignResponse {
  campaign_id: number;
  campaign_url: string;
  message: string;
  tiers: unknown[];
}

export interface TransferCampaignRequest {
  campaign_id: string;
  transfer_to_email: string;
  first_name?: string;
  last_name?: string;
}
