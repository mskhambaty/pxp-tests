import { request as apiRequest, type APIResponse } from '@playwright/test';
import {
  CreateCampaignRequest,
  CreateCampaignResponse,
  TransferCampaignRequest,
} from '../types/campaignTypes';

/**
 * Lightweight wrapper around the PanXpan API.  This class exposes a few
 * endpoints used by the E2E tests.  It authenticates requests via an API
 * key passed in from the environment and defaults the base URL to
 * `https://www.panxpan.com/_functions`.
 */
export class PanXpanApi {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Internal helper to perform fetches against the PanXpan API.  It adds
   * appropriate headers and handles JSON serialization/deserialization.
   */
  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
  ): Promise<T> {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return (await response.json()) as T;
    } finally {
      await request.dispose();
    }
  }

  /**
   * Retrieve all campaigns visible to the authenticated user.
   */
  async getCampaigns(): Promise<unknown> {
    return this.apiRequest('/getCampaigns', 'GET');
  }

  /**
   * Create a new campaign.  Pass in a payload conforming to the
   * `CreateCampaignRequest` interface.  Returns the campaign ID and URL on
   * success.
   */
  async createCampaign(payload: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    return this.apiRequest('/createCampaign', 'POST', payload);
  }

  /**
   * Delete an existing campaign by ID.
   */
  async deleteCampaign({ campaign_id }: { campaign_id: string }): Promise<unknown> {
    return this.apiRequest('/deleteCampaign', 'DELETE', { campaign_id });
  }

  /**
   * Transfer a campaign to another user.  Returns the relative transfer URL.
   */
  async transferCampaign(payload: TransferCampaignRequest): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (await this.apiRequest('/transferCampaign', 'POST', payload)) as any;
    const link: string | undefined = response?.link || response?.transfer_link;
    if (!link) {
      throw new Error(
        `Response does not contain a 'link' or 'transfer_link' property: ${JSON.stringify(
          response,
        )}`,
      );
    }
    const match = link.match(/\/transfer-campaigns\/[\d]+/i)?.[0];
    if (!match) {
      throw new Error(`No match found in response link: ${link}`);
    }
    return match;
  }
}