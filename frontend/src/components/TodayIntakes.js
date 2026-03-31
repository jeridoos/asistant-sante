import React, { useState, useEffect } from 'react';

const TodayIntakes = ({ patientId }) => {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIntakes = async () => {
    try {
      const res = await fetch(`http://localhost:5000/intakes/today/${patientId}`);
      const data = await res.json();
      setIntakes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmIntake = async (intakeId) => {
    try {
      const res = await fetch(`http://localhost:5000/intakes/${intakeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        // Recharger la liste
        fetchIntakes();
      } else {
        const error = await res.json();
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIntakes();
  }, [patientId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h3>Prise du jour</h3>
      {intakes.length === 0 ? (
        <p>Aucune prise programmée aujourd'hui.</p>
      ) : (
        <ul>
          {intakes.map(intake => (
            <li key={intake.id}>
              {new Date(intake.scheduled_datetime).toLocaleTimeString()} - 
              Traitement #{intake.treatment_id} - 
              Statut: {intake.status}
              <button onClick={() => confirmIntake(intake.id)}>Confirmer</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodayIntakes;