import React from 'react';

const NeumorphicCard = ({ children, className = '' }) => {
  return (
    <div className={`card-neumorph ${className}`}>
      {children}
    </div>
  );
};

export default NeumorphicCard;