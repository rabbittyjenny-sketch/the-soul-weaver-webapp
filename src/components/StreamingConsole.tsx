/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import AstrologyAgent, { UserData } from './AstrologyAgent';
import { LiveServerContent } from '@google/genai';

import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import {
  useLogStore,
  ConversationTurn,
} from '../lib/state';
import OnboardingWizard from './OnboardingWizard';

/**
 * Orchestrator component.
 * Manages the top-level state of the UI, switching between the onboarding
 * screen and the main astrology agent interface. It also persists user data
 * to local storage and handles the application reset logic.
 */
export default function StreamingConsole() {
  const { client } = useLiveAPIContext();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // On initial load, check local storage for existing user data.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('soulWeaverUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[StreamingConsole] Loaded userData from localStorage:', parsed);
        setUserData(parsed);
      } else {
        console.log('[StreamingConsole] No userData in localStorage');
      }
    } catch (e) {
      console.error("Failed to load user data from localStorage", e);
      // Clear corrupted data if parsing fails
      localStorage.removeItem('soulWeaverUser');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // This effect sets up listeners for real-time events from the Gemini API
  // and updates the central conversation log (Zustand store).
  React.useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleTranscription = (
      source: 'user' | 'agent',
      text: string,
      isFinal: boolean
    ) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      // If the last turn is from the same source and is not final, update it.
      if (last && last.role === source && !last.isFinal) {
        updateLastTurn({
          text: text, // Replace text instead of appending
          isFinal,
        });
      } else {
        // Otherwise, create a new turn.
        addTurn({ role: source, text, isFinal });
      }
    };

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      handleTranscription('user', text, isFinal);
    }
    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      handleTranscription('agent', text, isFinal);
    }

    const handleContent = (serverContent: LiveServerContent) => {
      const text =
        serverContent.modelTurn?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(' ') ?? '';
      const groundingChunks = serverContent.groundingMetadata?.groundingChunks;

      if (!text && !groundingChunks) return;

      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];

      if (last?.role === 'agent' && !last.isFinal) {
        const updatedTurn: Partial<ConversationTurn> = {
          text: last.text + text,
        };
        if (groundingChunks) {
          updatedTurn.groundingChunks = [
            ...(last.groundingChunks || []),
            ...groundingChunks,
          ];
        }
        updateLastTurn(updatedTurn);
      } else {
        addTurn({ role: 'agent', text, isFinal: false, groundingChunks });
      }
    };

    // Mark the last turn as final when the model indicates the turn is complete.
    const handleTurnComplete = () => {
      const turns = useLogStore.getState().turns;
      const last = turns.length > 0 ? turns[turns.length - 1] : undefined;
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
      }
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client]);

  // Callback for when the onboarding form is successfully completed.
  const handleOnboardingComplete = (data: UserData) => {
    try {
      localStorage.setItem('soulWeaverUser', JSON.stringify(data));
      setUserData(data);
    } catch (e) {
      console.error("Failed to save user data to localStorage", e);
    }
  };

  // Resets the application to its initial state.
  const handleReset = () => {
    localStorage.removeItem('soulWeaverUser');
    setUserData(null);
    useLogStore.getState().clearTurns();
  };

  // Don't render anything until we've checked localStorage.
  if (!isInitialized) {
    return null;
  }

  // ถ้า userData ไม่ครบ ให้เตือนใน console แต่ยังให้ใช้งานต่อได้
  if (userData && (!userData.name || !userData.dob || !userData.zodiac)) {
    console.warn('[StreamingConsole] userData incomplete, but allowing AI usage:', userData);
    // ไม่ลบ localStorage และไม่วนกลับ onboarding
  }

  console.log('[StreamingConsole] Render, userData:', userData);
  return (
    <div className="transcription-container">
      {!userData ? (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      ) : (
        <AstrologyAgent userData={userData} onReset={handleReset} />
      )}
    </div>
  );
}