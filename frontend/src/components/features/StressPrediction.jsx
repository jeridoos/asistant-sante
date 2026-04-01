import React from 'react';
import ModernCard from '../ui/ModernCard';

const StressPrediction = ({ userId }) => {
  return (
    <ModernCard title="Stress Level Prediction">
      <p className="card__content">
        Prédiction de votre niveau de stress
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default StressPrediction;