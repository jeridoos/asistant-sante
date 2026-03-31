import React, { useState, useEffect } from 'react';

const DailyIntakes = ({ patientId }) => {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    fetchIntakes();
  }, [patientId]);

  const fetchIntakes = async () => {
    try {
      const res = await fetch(`http://localhost:5000/intakes?patient_id=${patientId}`);
      const data = await res.json();
      setIntakes(data);
    } catch (error) {
      console.error('Erreur chargement prises:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmIntake = async (intakeId) => {
    setConfirming(intakeId);
    try {
      const res = await fetch(`http://localhost:5000/intakes/${intakeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_datetime: new Date().toISOString() })
      });
      if (res.ok) {
        await fetchIntakes();
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error}`);
      }
    } catch (error) {
      console.error('Erreur confirmation:', error);
    } finally {
      setConfirming(null);
    }
  };

  if (loading) return <div>Chargement des prises...</div>;

  return (
    <div>
      <h3>Prises du jour</h3>
      {intakes.length === 0 ? (
        <p>Aucune prise programmée aujourd'hui.</p>
      ) : (
        <ul>
          {intakes.map(intake => (
            <li key={intake.id}>
              {intake.scheduled_datetime} - {intake.status}
              {intake.status === 'scheduled' && (
                <button
                  onClick={() => confirmIntake(intake.id)}
                  disabled={confirming === intake.id}
                >
                  {confirming === intake.id ? 'Confirmation...' : 'Confirmer'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyIntakes;