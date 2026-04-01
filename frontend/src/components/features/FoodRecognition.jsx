import React from 'react';
import ModernCard from '../ui/ModernCard';

const FoodRecognition = ({ userId }) => {
  return (
    <ModernCard title="Food Recognition & Caloric Estimation">
      <p className="card__content">
        Estimation calorique à partir de vos repas
      </p>
      <div className="card__date">Fonctionnalité à venir</div>
    </ModernCard>
  );
};

export default FoodRecognition;