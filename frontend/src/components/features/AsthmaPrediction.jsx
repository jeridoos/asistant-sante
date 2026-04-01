import React from 'react';
import ModernCard from '../ui/ModernCard';

const AsthmaPrediction = ({ userId }) => {
  return (
    <ModernCard title="ASTHMA PREDICTION">
      <p className="card__content">
        Prédiction des risques liés à l'asthme
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default AsthmaPrediction;