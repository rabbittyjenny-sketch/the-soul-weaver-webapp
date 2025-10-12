/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from '../state';

export const astrologyTools: FunctionCall[] = [
  {
    name: 'get_daily_prediction',
    description: 'Provides the lucky color and number for the day.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sign: {
          type: 'STRING',
          description: 'The zodiac sign of the user (e.g., "Aries", "Taurus").',
        },
      },
      required: ['sign'],
    },
    isEnabled: true,
  },
];