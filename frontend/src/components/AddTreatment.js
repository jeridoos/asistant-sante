import React, { useState } from 'react';

const AddTreatment = ({ patientId }) => {
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState(5);
  const [frequency, setFrequency] = useState('1x/jour');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [times, setTimes] = useState(['08:00']); // tableau d'heures
  const [message, setMessage] = useState('');

  // Ajouter un horaire
  const addTime = () => setTimes([...times, '12:00']);
  const removeTime = (index) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation simple
    if (endDate && endDate < startDate) {
      setMessage('La date de fin doit être après la date de début');
      return;
    }

    const treatmentData = {
      patient_id: patientId,
      drug_name: drugName,
      dosage: `${dosage} mg`,
      frequency: frequency,
      start_date: startDate,
      end_date: endDate || null,
      scheduled_time: times.join(','), // ex. "08:00,20:00"
      units_per_intake: 1
    };

    try {
      const response = await fetch('http://localhost:5000/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treatmentData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Traitement ajouté !');
        // Réinitialiser le formulaire
        setDrugName('');
        setDosage(5);
        setFrequency('1x/jour');
        setStartDate('');
        setEndDate('');
        setTimes(['08:00']);
      } else {
        setMessage(`Erreur : ${data.error}`);
      }
    } catch (error) {
      setMessage('Erreur réseau');
    }
  };

  return (
    <div>
      <h2>Ajouter un traitement</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nom du médicament" value={drugName} onChange={e => setDrugName(e.target.value)} required />

        <div>
          <label>Dosage (mg) : {dosage}</label>
          <input type="range" min="0" max="100" step="5" value={dosage} onChange={e => setDosage(parseInt(e.target.value))} />
        </div>

        <select value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="1x/jour">1 fois par jour</option>
          <option value="2x/jour">2 fois par jour</option>
          <option value="3x/jour">3 fois par jour</option>
          <option value="1x/2jours">1 fois tous les 2 jours</option>
          <option value="1x/semaine">1 fois par semaine</option>
          {/* Ajoutez d'autres options selon vos besoins */}
        </select>

        <div>
          <label>Date de début</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>

        <div>
          <label>Date de fin (optionnelle)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div>
          <label>Heures de prise</label>
          {times.map((time, idx) => (
            <div key={idx}>
              <input
                type="time"
                value={time}
                onChange={e => updateTime(idx, e.target.value)}
                required
              />
              {times.length > 1 && (
                <button type="button" onClick={() => removeTime(idx)}>Supprimer</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addTime}>+ Ajouter un horaire</button>
        </div>

        <button type="submit">Ajouter le traitement</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddTreatment;