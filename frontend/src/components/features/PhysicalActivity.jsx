import React from 'react';
import ModernCard from '../ui/ModernCard';

const PhysicalActivity = ({ userId }) => {
  return (
    <ModernCard title="Physical Activity Recognition">
      <p className="card__content">
        Suivi et analyse de votre activité physique
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default PhysicalActivity;