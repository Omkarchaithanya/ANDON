import React from 'react';
import { SourceQuoteData } from '../types';

interface SourceQuoteProps {
  title: string;
  data: SourceQuoteData;
}

export const SourceQuote: React.FC<SourceQuoteProps> = ({ title, data }) => {
  return (
    <div className="source-quote-box">
      <div className="source-quote-header">
        <h4 className="source-quote-title">{title}</h4>
        <span className="source-badge">Version {data.version}</span>
      </div>
      <blockquote className="source-quote-body">
        “{data.text}”
      </blockquote>
      <div className="source-quote-footer">
        <span className="source-ref">Source: {data.sourceRef}</span>
        {data.isStale && <span className="source-stale-tag">⚠️ Stale Source</span>}
      </div>
    </div>
  );
};

