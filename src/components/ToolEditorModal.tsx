/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import Modal from './Modal';
import { FunctionCall } from '../lib/state';

type ToolEditorModalProps = {
  tool: FunctionCall;
  onClose: () => void;
};

export default function ToolEditorModal({ tool, onClose }: ToolEditorModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="tool-editor">
        <h2>Tool: {tool.name}</h2>
        <div className="tool-editor-field">
          <label htmlFor="tool-description">Description</label>
          <textarea
            id="tool-description"
            value={tool.description}
            readOnly
          />
        </div>
        <div className="tool-editor-field">
          <label htmlFor="tool-parameters">Parameters (JSON Schema)</label>
          <pre id="tool-parameters">
            <code>{JSON.stringify(tool.parameters, null, 2)}</code>
          </pre>
        </div>
      </div>
    </Modal>
  );
}