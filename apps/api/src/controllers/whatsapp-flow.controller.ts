/**
 * WhatsApp Flow Data Exchange Controller
 *
 * Handles Meta WhatsApp Flows encrypted data exchange for the
 * business selection flow. Decrypts request, resolves businesses,
 * encrypts response.
 *
 * Actions handled:
 * - INIT: First screen load — return search screen
 * - data_exchange (screen: SEARCH): User submitted search query
 * - ping: Health check from Meta
 */

import { Request, Response } from 'express';
import { getConfig } from '../config';
import {
  decryptFlowRequest,
  encryptFlowResponse,
  parseFlowToken,
} from '../services/whatsapp-flow-crypto.service';
import { sharedBusinessResolver } from '../services/shared-business-resolver.service';
import { logger } from '../utils/logger';

class WhatsAppFlowController {
  async handleDataExchange(req: Request, res: Response): Promise<void> {
    const config = getConfig();

    if (!config.whatsappFlowEndpointEnabled) {
      res.status(503).send('Flow endpoint disabled');
      return;
    }

    try {
      const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptFlowRequest(req.body);
      const { action, data, flow_token } = decryptedBody;

      logger.debug({ action, screen: decryptedBody.screen }, 'Flow data exchange request');

      // Health check from Meta
      if (action === 'ping') {
        const response = { data: { status: 'active' } };
        res.set('Content-Type', 'text/plain');
        res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
        return;
      }

      // INIT — user opens the flow; show search screen
      if (action === 'INIT') {
        const response = {
          screen: 'SEARCH',
          data: {
            search_placeholder: 'Salon name, area, or code',
            search_label: 'Find your salon',
            search_helper: 'Enter salon name, location, or 4-digit code',
          },
        };
        res.set('Content-Type', 'text/plain');
        res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
        return;
      }

      // BACK — user pressed back; return to search
      if (action === 'BACK') {
        const response = {
          screen: 'SEARCH',
          data: {
            search_placeholder: 'Salon name, area, or code',
            search_label: 'Find your salon',
            search_helper: 'Enter salon name, location, or 4-digit code',
          },
        };
        res.set('Content-Type', 'text/plain');
        res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
        return;
      }

      // data_exchange — user submitted a screen
      if (action === 'data_exchange') {
        const screen = decryptedBody.screen;

        // SEARCH screen: user submitted search query
        if (screen === 'SEARCH') {
          const query = (data?.search_query as string) || '';
          const customerPhone = parseFlowToken(flow_token) || undefined;

          const result = await sharedBusinessResolver.resolve({
            query,
            customerPhone,
            limit: 5,
          });

          // No matches
          if (result.noMatch) {
            const response = {
              screen: 'SEARCH',
              data: {
                search_placeholder: 'Salon name, area, or code',
                search_label: 'Find your salon',
                search_helper: 'Enter salon name, location, or 4-digit code',
                error_message: `No salon found for "${query}". Try a different name or code.`,
              },
            };
            res.set('Content-Type', 'text/plain');
            res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
            return;
          }

          // Exact match — complete the flow immediately
          if (result.exactMatch) {
            const biz = result.exactMatch;
            const response = {
              screen: 'SUCCESS',
              data: {
                extension_message_response: {
                  params: {
                    flow_token,
                    business_id: biz.id,
                    business_name: biz.name,
                  },
                },
              },
            };
            res.set('Content-Type', 'text/plain');
            res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
            return;
          }

          // Multiple matches — show results screen
          const salons = result.matches.map(b => ({
            id: b.id,
            title: b.name,
            description: [b.category, b.slug].filter(Boolean).join(' · ') || undefined,
          }));

          const response = {
            screen: 'RESULTS',
            data: {
              salons,
              result_count: salons.length,
              search_query: query,
            },
          };
          res.set('Content-Type', 'text/plain');
          res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
          return;
        }

        // RESULTS screen: user selected a salon
        if (screen === 'RESULTS') {
          const selectedId = data?.selected_salon_id as string;

          if (!selectedId) {
            const response = {
              screen: 'SEARCH',
              data: {
                search_placeholder: 'Salon name, area, or code',
                search_label: 'Find your salon',
                search_helper: 'Enter salon name, location, or 4-digit code',
                error_message: 'Please select a salon.',
              },
            };
            res.set('Content-Type', 'text/plain');
            res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
            return;
          }

          // Complete the flow with selected business
          const selectedName = (data?.selected_salon_name as string) || 'Salon';
          const response = {
            screen: 'SUCCESS',
            data: {
              extension_message_response: {
                params: {
                  flow_token,
                  business_id: selectedId,
                  business_name: selectedName,
                },
              },
            },
          };
          res.set('Content-Type', 'text/plain');
          res.send(encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer));
          return;
        }
      }

      // Unknown action/screen — return error
      logger.warn({ action, screen: decryptedBody.screen }, 'Unknown Flow action');
      const fallback = {
        screen: 'SEARCH',
        data: {
          search_placeholder: 'Salon name, area, or code',
          search_label: 'Find your salon',
          search_helper: 'Enter salon name, location, or 4-digit code',
        },
      };
      res.set('Content-Type', 'text/plain');
      res.send(encryptFlowResponse(fallback, aesKeyBuffer, initialVectorBuffer));
    } catch (error) {
      logger.error({ error }, 'Flow data exchange failed');
      // Return 421 if decryption failed (signals client to re-download public key)
      if ((error as Error).message?.includes('decrypt') || (error as Error).message?.includes('PRIVATE_KEY')) {
        res.sendStatus(421);
        return;
      }
      res.sendStatus(500);
    }
  }
}

export const whatsappFlowController = new WhatsAppFlowController();
