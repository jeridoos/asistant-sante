import React, { useState, useEffect } from 'react';

const Metrics = ({ patientId }) => {
  const [streak, setStreak] = useState(0);
  const [rate, setRate] = useState(0);

  const fetchMetrics = async () => {
    try {
      // Vous pouvez créer une route dédiée, ou lire depuis les données du patient
      const res = await fetch(`http://localhost:5000/patients/${patientId}/metrics`);
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak);
        setRate(data.rate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [patientId]);

  return (
    <div>
      <h3>Observance</h3>
      <p>Streak : {streak} jours consécutifs</p>
      <p>Taux d'observance (7 jours) : {(rate * 100).toFixed(1)}%</p>
    </div>
  );
};

export default Metrics;