import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Appointments = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

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
      if (res.ok) {
        setMessage('Rendez-vous ajouté');
        setDate('');
        setNotes('');
        fetchAppointments();
      } else {
        const err = await res.json();
        setMessage(`Erreur: ${err.error}`);
      }
    } catch (error) {
      setMessage('Erreur réseau');
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
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
          {message && (
            <div className={`mt-2 p-2 rounded text-sm ${message.includes('ajouté') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
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
                  <div className="font-medium">{new Date(apt.appointment_date).toLocaleString()}</div>
                  {apt.notes && <div className="text-sm text-gray-500">{apt.notes}</div>}
                  {apt.reminder_sent && (
                    <span className="text-xs text-green-600">Rappel envoyé</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Appointments;