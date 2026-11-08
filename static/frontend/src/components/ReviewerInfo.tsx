import React from 'react';
import { ReviewerData } from '../types';

interface ReviewerInfoProps {
  reviewer: ReviewerData;
}

export const ReviewerInfo: React.FC<ReviewerInfoProps> = ({ reviewer }) => {
  return (
    <div className="reviewer-box">
      <div className="avatar-circle">
        {reviewer.name.split(' ').map((n) => n[0]).join('')}
      </div>
      <div className="reviewer-meta">
        <h4 className="reviewer-name">{reviewer.name}</h4>
        <span className="reviewer-role">{reviewer.role}</span>
        <span className="reviewer-assignment">
          Deployment: <strong>{reviewer.deployment}</strong> | Zone: <strong>{reviewer.zone}</strong>
        </span>
      </div>
    </div>
  );
};

