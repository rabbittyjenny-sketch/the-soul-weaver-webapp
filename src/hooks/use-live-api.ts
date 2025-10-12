/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { GenAILiveClient } from '../lib/genai-live-client';
import { LiveConnectConfig, Modality, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../lib/audio-streamer';
import { audioContext } from '../lib/utils';
import VolMeterWorklet from '../lib/worklets/vol-meter';
import { useLogStore, useSettings } from '../lib/state';
import { astrologyData } from '../lib/astrology-data';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  status: ConnectionStatus;

  volume: number;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model } = useSettings();
  const client = React.useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);

  const audioStreamerRef = React.useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = React.useState(0);
  const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');
  const [config, setConfig] = React.useState<LiveConnectConfig>({});

  // register audio for streaming server -> speakers
  React.useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorklet, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  React.useEffect(() => {
    const onOpen = () => setStatus('connected');
    const onClose = () => setStatus('disconnected');
    const onError = () => setStatus('error');

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    const onToolCall = (toolCall: LiveServerToolCall) => {
      const { addTurn, updateLastTurn } = useLogStore.getState();
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last?.role === 'agent' && !last.isFinal) {
        updateLastTurn({ toolUseRequest: toolCall });
      } else {
        addTurn({
          role: 'agent',
          text: '',
          isFinal: false,
          toolUseRequest: toolCall,
        });
      }

      const functionResponses: any[] = [];

      for (const fc of toolCall.functionCalls) {
        if (fc.name === 'get_daily_prediction') {
          const sign = fc.args.sign as string;
          const signData = astrologyData.get(sign.toLowerCase());
          let resultText = "I couldn't find data for that sign.";

          if (signData) {
            const today = new Date();
            const dayOfMonth = today.getDate();
            const luckyColor = signData.lucky_sign.color.split(', ')[0]; // Get first color

            let luckyNumberInfo = `Your lucky numbers are ${signData.lucky_sign.lucky_number}.`;
            if (dayOfMonth === 1 || dayOfMonth === 16) {
              luckyNumberInfo =
                'As for lucky numbers, remember that all investments carry risk! Instead of testing fate, perhaps invest in some new clothes or a nice meal. We do not endorse any form of gambling.';
            }

            resultText = `Your lucky color for today is ${luckyColor}. ${luckyNumberInfo}`;
          }

          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { result: resultText },
          });
        }
      }

      client.sendToolResponse({ functionResponses: functionResponses });
    };

    client.on('toolcall', onToolCall);
    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('error', onError);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('error', onError);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const connect = React.useCallback(async () => {
    if (status === 'connecting' || status === 'connected') {
      return;
    }
    if (!config) {
      throw new Error('config has not been set');
    }
    setStatus('connecting');
    client.disconnect();
    await client.connect(config);
  }, [client, config, status]);

  const disconnect = React.useCallback(() => {
    client.disconnect();
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connect,
    status,
    disconnect,
    volume,
  };
}