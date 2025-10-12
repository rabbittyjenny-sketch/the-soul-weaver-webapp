/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import './ApiKeyErrorScreen.css';

interface ApiKeyErrorScreenProps {
    message: string;
}

export default function ApiKeyErrorScreen({ message }: ApiKeyErrorScreenProps) {
    return (
        <div className="api-key-error-screen">
            <div className="error-icon">
                <span className="icon">vpn_key_off</span>
            </div>
            <h1 className="error-title">Configuration Error</h1>
            <p className="error-message">
                The application cannot start because the Gemini API key is missing.
            </p>
            <code className="error-details">
                {message}
            </code>
        </div>
    );
}
