import React, { useState, useEffect } from 'react';

const Appointments = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/appointments?patient_id=${patientId}`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    }
  };

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

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);

  return (
    <div>
      <h3>Rendez-vous médicaux</h3>
      <form onSubmit={handleSubmit}>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="text" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <button type="submit">Ajouter</button>
      </form>
      {message && <p>{message}</p>}
      <ul>
        {appointments.map(apt => (
          <li key={apt.id}>
            {apt.appointment_date} - {apt.notes} {apt.reminder_sent ? '(rappel envoyé)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Appointments;