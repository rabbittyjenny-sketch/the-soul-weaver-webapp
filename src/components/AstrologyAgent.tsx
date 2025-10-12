/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import { LiveConnectConfig, Modality } from '@google/genai';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import {
  useSettings,
  useLogStore,
  useTools,
  useUI,
} from '../lib/state';

export interface UserData {
  email: string;
  name: string;
  dob: string;
  birthTime?: string;
  birthPlace?: string;
  _repeat?: boolean; // เพิ่ม property สำหรับกรณีอีเมลซ้ำ
}

interface AstrologyAgentProps {
  userData: UserData;
  onReset: () => void;
}

// Helper to format timestamps for the conversation log.
const formatTimestamp = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Helper to render text content, handling bold text and code blocks.
const renderTranscriptionContent = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`{3}json\n[\s\S]*?\n`{3})/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('```json')) {
      const jsonContent = part.replace(/^`{3}json\n|`{3}$/g, '');
      return <pre key={index}><code>{jsonContent}</code></pre>;
    }
    return part;
  });
};

/**
 * The main agent interface, rebuilt from scratch for stability.
 * This component is responsible for preparing the Gemini API configuration,
 * displaying the conversation, and ensuring that the microphone cannot be
 * activated until the system is fully ready.
 */
export default function AstrologyAgent({ userData, onReset }: AstrologyAgentProps) {
  const { setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { setConfigReady } = useUI();
  const turns = useLogStore(state => state.turns);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll the conversation view to the latest message.
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  // CRITICAL: This effect prepares the configuration for the Gemini API.
  // It runs once when the component mounts.
  React.useEffect(() => {
    // 1. Prepare enabled tools for the API.
    const enabledTools = tools
      .filter(tool => tool.isEnabled)
      .map(tool => ({
        functionDeclarations: [{
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        }],
      }));

    // 2. Personalize the system prompt with the user's data and greet with details.
    // Extract date parts for Thai greeting
    let dobText = '';
    if (userData.dob) {
      const [year, month, day] = userData.dob.split('-');
      dobText = `เกิดวันที่ ${day} เดือน ${month} ปี ค.ศ. ${year}`;
    }
    const greeting = `สวัสดีค่ะคุณ${userData.name} สบายดีนะคะ? จากข้อมูลคุณ${userData.name} ${dobText} เวลาเกิดคือ ${userData.birthTime || '-'} และสถานที่เกิดคือ ${userData.birthPlace || '-'} กรุณาตรวจสอบข้อมูลวันเดือนปีเกิดและรายละเอียดอีกครั้ง หากถูกต้องโปรดตอบ "ถูกต้อง" หรือแจ้งข้อมูลที่ต้องการแก้ไขค่ะ\n`;
    const personalizedPrompt = `${greeting}\n${systemPrompt}`;

    // 3. Assemble the final configuration object.
    const config: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: { parts: [{ text: personalizedPrompt }] },
      tools: enabledTools,
    };

    // 4. Set the configuration in the LiveAPI context.
    setConfig(config);

    // 5. IMPORTANT: Signal that the configuration is ready. This will enable
    //    the microphone button in the ControlTray component.
    setConfigReady(true);

    // Cleanup function: When the component unmounts, signal that the
    // config is no longer ready.
    return () => {
      setConfigReady(false);
    };
  }, [setConfig, systemPrompt, tools, voice, userData, setConfigReady]);

  const hasSessionStarted = turns.length > 0;

  return (
    <div className={`astrology-agent ${hasSessionStarted ? 'in-session' : ''}`}>
      <div className="astrology-orb">
        <span className="icon">sparkle</span>
      </div>
      {!hasSessionStarted ? (
        <>
          <div className="agent-text-display">
            {userData._repeat
              ? `สวัสดี คุณ${userData.name} อีกครั้งนะคะ ดีใจที่ได้พบกันอีกค่ะ วันนี้มีอะไรให้ดูแลดีคะ`
              : `Welcome, ${userData.name}! Press the microphone when you're ready to begin.`}
          </div>
          <button className="start-over-button" onClick={onReset}>
            Start Over
          </button>
        </>
      ) : (
        <div className="transcription-view" ref={scrollRef}>
          {turns.map((t, i) => (
            <div
              key={`${t.role}-${i}`}
              className={`transcription-entry ${t.role} ${!t.isFinal ? 'interim' : ''}`}
            >
              <div className="transcription-header">
                <div className="transcription-source">
                  {t.role === 'user' ? 'You' : 'SENA'}
                </div>
                <div className="transcription-timestamp">
                  {formatTimestamp(t.timestamp)}
                </div>
              </div>
              {t.text && (
                <div className="transcription-text-content">
                  {renderTranscriptionContent(t.text)}
                </div>
              )}
              {t.toolUseRequest && t.toolUseRequest.functionCalls?.length > 0 && (
                <div className="tool-call-display">
                  {t.toolUseRequest.functionCalls.map((fc, fcIndex) => (
                    <div key={fcIndex} className="tool-call-details">
                      <div className="tool-call-header"><span className="icon">build</span>Tool Call: {fc.name}</div>
                      <pre><code>{JSON.stringify(fc.args, null, 2)}</code></pre>
                    </div>
                  ))}
                </div>
              )}
              {t.groundingChunks && t.groundingChunks.length > 0 && (
                <div className="grounding-chunks">
                  <strong>Sources:</strong>
                  <ul>
                    {t.groundingChunks
                      .filter(chunk => chunk.web?.uri)
                      .map((chunk, index) => (
                        <li key={index}>
                          <a href={chunk.web!.uri} target="_blank" rel="noopener noreferrer">
                            {chunk.web!.title || chunk.web!.uri}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
