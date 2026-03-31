import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';

const DailyIntakes = ({ patientId }) => {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  // Utiliser useCallback pour mémoriser la fonction et éviter des appels infinis
  const fetchIntakes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/intakes?patient_id=${patientId}`);
      const data = await res.json();
      setIntakes(data);
    } catch (error) {
      console.error('Erreur chargement prises:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]); // fetchIntakes est stable grâce à useCallback

  const confirmIntake = async (intakeId) => {
    setConfirming(intakeId);
    try {
      const res = await fetch(`http://localhost:5000/intakes/${intakeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_datetime: new Date().toISOString() })
      });
      if (res.ok) {
        await fetchIntakes(); // recharger la liste après confirmation
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

  if (loading) {
    return <div className="flex justify-center py-4">Chargement des prises...</div>;
  }

  return (
    <div>
      {intakes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Aucune prise programmée aujourd'hui.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {intakes.map(intake => (
            <li key={intake.id} className="py-3 flex justify-between items-center">
              <span className="text-gray-800">
                {new Date(intake.scheduled_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' '}
                <span className="text-sm text-gray-500 ml-2">
                  {intake.status === 'scheduled' ? 'En attente' : intake.status}
                </span>
              </span>
              {intake.status === 'scheduled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmIntake(intake.id)}
                  disabled={confirming === intake.id}
                >
                  {confirming === intake.id ? 'Confirmation...' : 'Confirmer'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyIntakes;