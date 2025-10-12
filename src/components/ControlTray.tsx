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
 * Unless required by applicable lawlictations under the License.
 */

import cn from 'classnames';
import * as React from 'react';
import { AudioRecorder } from '../lib/audio-recorder';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useUI } from '../lib/state';

/**
 * The main control tray containing the microphone button.
 * This new version has been rebuilt for stability. It handles audio recording
 * and sends the data to the Gemini API, but its core state (enabled/disabled)
 * is controlled by the parent AstrologyAgent component to prevent race conditions.
 */
function ControlTray() {
  // A ref to a single, stable instance of the AudioRecorder.
  const audioRecorderRef = React.useRef<AudioRecorder | null>(null);
  if (audioRecorderRef.current === null) {
    audioRecorderRef.current = new AudioRecorder();
  }

  const [isMuted, setMuted] = React.useState(false);
  const micButtonRef = React.useRef<HTMLButtonElement>(null);
  const { isConfigReady } = useUI();
  const { client, status, connect } = useLiveAPIContext();

  const isConnected = status === 'connected';

  // Effect to manage the audio recording lifecycle.
  React.useEffect(() => {
    const audioRecorder = audioRecorderRef.current;
    if (!audioRecorder) return;

    const onData = (base64: string) => {
      client.sendRealtimeInput([{
        mimeType: 'audio/pcm;rate=16000',
        data: base64,
      }]);
    };

    if (isConnected && !isMuted) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off('data', onData);
    };
  }, [isConnected, isMuted, client]);

  // Effect to reset mute state when disconnected.
  React.useEffect(() => {
    if (!isConnected) {
      setMuted(false);
    }
  }, [isConnected]);

  // Handles clicks on the microphone button.
  const handleMicClick = () => {
    if (!isConfigReady) return;

    if (isConnected) {
      setMuted(!isMuted);
    } else {
      // The `connect` function is now called with a configuration
      // that is guaranteed to be ready.
      connect();
    }
  };

  const getMicButtonTitle = () => {
    if (!isConfigReady) {
      return 'Initializing Agent...';
    }
    if (isConnected) {
      return isMuted ? 'Unmute microphone' : 'Mute microphone';
    }
    return 'Start Conversation';
  };

  return (
    <section className="control-tray">
      <nav className={cn('actions-nav')}>
        <button
          ref={micButtonRef}
          className={cn('action-button mic-button', {
            connected: isConnected,
            muted: isMuted,
          })}
          onClick={handleMicClick}
          title={getMicButtonTitle()}
          // The button is disabled until the configuration is ready,
          // which is the key fix for the application crash.
          disabled={!isConfigReady}
        >
          {isConnected && !isMuted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
      </nav>
    </section>
  );
}

export default React.memo(ControlTray);
