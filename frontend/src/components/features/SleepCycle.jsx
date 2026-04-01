import React from 'react';
import ModernCard from '../ui/ModernCard';

const SleepCycle = ({ userId }) => {
  return (
    <ModernCard title="Sleep Cycle Analysis">
      <p className="card__content">
        Analyse de votre cycle de sommeil
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default SleepCycle;