/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import cn from 'classnames';
import { useUI, useSettings, useTools, FunctionCall } from '../lib/state';
import { AVAILABLE_VOICES } from '../lib/constants';
import ToolEditorModal from './ToolEditorModal';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const { voice, setVoice, systemPrompt } = useSettings();
  const { tools, toggleTool } = useTools();
  const [editingTool, setEditingTool] = React.useState<FunctionCall | null>(
    null
  );
  const { status } = useLiveAPIContext();
  const isConnected = status === 'connected';

  return (
    <>
      <div
        className={cn('sidebar-scrim', { 'is-open': isSidebarOpen })}
        onClick={toggleSidebar}
      />
      <aside className={cn('sidebar', { 'is-open': isSidebarOpen })}>
        <header className="sidebar-header">
          <h2>Settings</h2>
          <button onClick={toggleSidebar} className="modalClose">
            <span className="icon">close</span>
          </button>
        </header>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>Configuration</h3>
            <div className="setting-item">
              <label htmlFor="voice-select">Agent Voice</label>
              <select
                id="voice-select"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                disabled={isConnected}
                title={
                  isConnected
                    ? 'Disconnect to change agent voice'
                    : 'Select agent voice'
                }
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>System Prompt</h3>
            <div className="setting-item">
              <textarea
                className="system-prompt-display"
                value={systemPrompt}
                readOnly
              />
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Tools (Function Calling)</h3>
            <ul className="tool-list">
              {tools.map((tool) => (
                <li key={tool.name} className="tool-item">
                  <div className="tool-info">
                    <span className="tool-name">{tool.name}</span>
                    <p
                      className="tool-description"
                      title={tool.description}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <div className="tool-controls">
                    <button
                      className="edit-tool-button"
                      onClick={() => setEditingTool(tool)}
                      title={`View ${tool.name} details`}
                    >
                      <span className="icon">edit</span>
                    </button>
                    <label
                      className="switch"
                      title={
                        isConnected
                          ? 'Disconnect to enable or disable tools'
                          : `Toggle ${tool.name}`
                      }
                    >
                      <input
                        type="checkbox"
                        checked={!!tool.isEnabled}
                        onChange={() => toggleTool(tool.name)}
                        disabled={isConnected}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      {editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
        />
      )}
    </>
  );
}
