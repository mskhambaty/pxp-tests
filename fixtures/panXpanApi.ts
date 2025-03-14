import { request as apiRequest, APIResponse } from '@playwright/test';
import {
  CreateCampaignRequest,
  CreateCampaignResponse,
  TransferCampaignRequest,
} from '../types/campaignTypes';

export class PanXpanApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
  ): Promise<unknown> {
    const request = await apiRequest.newContext();
    try {
      const response: APIResponse = await request.fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        data: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok() && response.status() !== 403) {
        throw new Error(
          `Failed to fetch ${endpoint}: ${response.status()} ${response.statusText()}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    } finally {
      await request.dispose();
    }
  }

  async getCampaigns(): Promise<unknown> {
    return this.apiRequest('/getCampaigns', 'GET');
  }

  async createCampaign(payload: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    return this.apiRequest('/createCampaign', 'POST', payload) as Promise<CreateCampaignResponse>;
  }

  async deleteCampaign({ campaign_id }: { campaign_id: string }): Promise<unknown> {
    return this.apiRequest('/deleteCampaign', 'DELETE', { campaign_id });
  }

  async transferCampaign(payload: TransferCampaignRequest): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (await this.apiRequest('/transferCampaign', 'POST', payload)) as any;
    return (response.link.match(/\/transfer-campaigns\/\d+/)?.[0] || 'No match found') as string;
  }
}
