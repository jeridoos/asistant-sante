import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNotification } from '../context/NotificationContext';

const Appointments = ({ patientId }) => {
  const { showNotification } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/appointments?patient_id=${patientId}`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      showNotification('Champ manquant', 'Veuillez sélectionner une date', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          appointment_date: date,
          notes: notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          'Rendez-vous ajouté', 
          `Le ${new Date(date).toLocaleString()}${notes ? ` - ${notes}` : ''}`,
          'success'
        );
        setDate('');
        setNotes('');
        fetchAppointments();
      } else {
        showNotification('Erreur', data.error || 'Impossible d\'ajouter le rendez-vous', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout rendez-vous:', error);
      showNotification('Erreur réseau', 'Impossible de contacter le serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Notes (optionnelles)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rendez-vous à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {appointments.map(apt => (
                <li key={apt.id} className="border-b pb-2 last:border-0">
                  <div className="font-medium">
                    {new Date(apt.appointment_date).toLocaleString()}
                  </div>
                  {apt.notes && (
                    <div className="text-sm text-gray-500">{apt.notes}</div>
                  )}
                  {apt.reminder_sent ? (
                    <span className="text-xs text-green-600">Rappel envoyé</span>
                  ) : (
                    <span className="text-xs text-gray-400">Rappel non encore envoyé</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center text-gray-500">
            Aucun rendez-vous programmé
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Appointments;