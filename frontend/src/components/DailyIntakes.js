import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import ConfirmationFlip from './ConfirmationFlip';

const DailyIntakes = ({ patientId }) => {
  const { showNotification } = useNotification();
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  const fetchIntakes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/intakes?patient_id=${patientId}`);
      const data = await res.json();
      setIntakes(data);
    } catch (error) {
      console.error('Erreur chargement prises:', error);
      showNotification('Erreur', 'Impossible de charger les prises', 'error');
    } finally {
      setLoading(false);
    }
  }, [patientId, showNotification]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]);

  const confirmIntake = async (intakeId) => {
    setConfirming(intakeId);
    try {
      const res = await fetch(`http://localhost:5000/intakes/${intakeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_datetime: new Date().toISOString() })
      });
      
      if (res.ok) {
        const data = await res.json();
        const delay = data.delay;
        const delayMessage = delay > 0 ? ` (${Math.round(delay)} min de retard)` : '';
        showNotification(
          'Prise confirmée', 
          `Médicament pris avec succès${delayMessage}`,
          delay > 0 ? 'warning' : 'success'
        );
        await fetchIntakes();
      } else {
        const err = await res.json();
        showNotification('Erreur', err.error || 'Impossible de confirmer la prise', 'error');
      }
    } catch (error) {
      console.error('Erreur confirmation:', error);
      showNotification('Erreur réseau', 'Impossible de confirmer la prise', 'error');
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
                {new Date(intake.scheduled_datetime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {' '}
                <span className="text-sm text-gray-500 ml-2">
                  {intake.status === 'scheduled' ? 'En attente' : intake.status}
                </span>
              </span>
              {intake.status === 'scheduled' && (
                <ConfirmationFlip
                  checked={false}
                  onChange={(isChecked) => {
                    if (isChecked) confirmIntake(intake.id);
                  }}
                  disabled={confirming === intake.id}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyIntakes;