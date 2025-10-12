/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useUI } from '../lib/state';

export default function Header() {
  const { status } = useLiveAPIContext();
  const { toggleSidebar } = useUI();

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return { text: 'Connected', className: 'connected' };
      case 'connecting':
        return { text: 'Connecting...', className: 'connecting' };
      case 'error':
        return { text: 'Error', className: 'error' };
      case 'disconnected':
      default:
        return { text: 'Disconnected', className: 'disconnected' };
    }
  };

  const { text: statusText, className: statusClass } = getStatusInfo();

  return (
    <header className="site-header">
      <span className="site-header-text">The Soul Weaver</span>
      <div className="status-container">
        <button
          className="settings-button"
          onClick={toggleSidebar}
          title="Settings"
        >
          <span className="icon">settings</span>
        </button>
        <div className={`status-indicator ${statusClass}`}></div>
        <div className="status-text">{statusText}</div>
      </div>
    </header>
  );
}