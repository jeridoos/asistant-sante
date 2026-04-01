import React from 'react';
import ModernCard from '../ui/ModernCard';

const CardiacAnomaly = ({ userId }) => {
  return (
    <ModernCard title="Cardiac Anomaly Detection">
      <p className="card__content">
        Détection des anomalies cardiaques
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default CardiacAnomaly;