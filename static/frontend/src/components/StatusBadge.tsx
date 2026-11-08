import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || '').toUpperCase();

  let className = 'badge badge-default';
  let label = norm;
  let dotColor = '#6b778c';

  switch (norm) {
    case 'CANDIDATE':
      className = 'badge badge-blue';
      label = 'CANDIDATE';
      dotColor = '#0052cc';
      break;
    case 'CONFIRMED':
    case 'CONFIRMED_GAP':
    case 'PROSPECTIVE_COVERAGE_GAP':
      className = 'badge badge-orange';
      label = 'PROSPECTIVE GAP';
      dotColor = '#ff991f';
      break;
    case 'CONFIRMED_COVERED':
    case 'COVERED':
      className = 'badge badge-green';
      label = 'COVERED WITHIN SCOPE';
      dotColor = '#00875a';
      break;
    case 'DISMISSED':
    case 'DISMISSED_WITH_REASON':
      className = 'badge badge-grey';
      label = 'DISMISSED (NOT RELATED)';
      dotColor = '#505f79';
      break;
    case 'STALE':
    case 'STALE_ASSESSMENT':
      className = 'badge badge-red';
      label = 'STALE ASSESSMENT';
      dotColor = '#bf2600';
      break;
    case 'UNKNOWN':
      className = 'badge badge-purple';
      label = 'COVERAGE UNKNOWN';
      dotColor = '#5243aa';
      break;
    case 'GAP':
      className = 'badge badge-red';
      label = 'COVERAGE GAP';
      dotColor = '#de350b';
      break;
    default:
      className = 'badge badge-default';
      label = norm || 'UNVERIFIED';
      dotColor = '#6b778c';
  }

  return (
    <span className={className}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
};
