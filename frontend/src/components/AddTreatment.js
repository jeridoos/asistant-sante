import React, { useState } from 'react';
import { Button } from './ui/button';

const AddTreatment = ({ patientId }) => {
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState(5);
  const [frequency, setFrequency] = useState('1x/jour');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [times, setTimes] = useState(['08:00']);
  const [message, setMessage] = useState('');

  const addTime = () => setTimes([...times, '12:00']);
  const removeTime = (index) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      scheduled_time: times.join(','),
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
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Ajouter un traitement</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom du médicament</label>
          <input
            type="text"
            value={drugName}
            onChange={e => setDrugName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Ex: Amlocor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dosage : {dosage} mg</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={dosage}
            onChange={e => setDosage(parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fréquence</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="1x/jour">1 fois par jour</option>
            <option value="2x/jour">2 fois par jour</option>
            <option value="3x/jour">3 fois par jour</option>
            <option value="1x/2jours">1 fois tous les 2 jours</option>
            <option value="1x/semaine">1 fois par semaine</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date de début</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date de fin (optionnelle)</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Heures de prise</label>
          {times.map((time, idx) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              <input
                type="time"
                value={time}
                onChange={e => updateTime(idx, e.target.value)}
                required
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTime(idx)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTime}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Ajouter un horaire
          </button>
        </div>

        <Button type="submit" className="w-full">Ajouter le traitement</Button>
      </form>
      {message && (
        <div className={`mt-4 p-2 rounded ${message.includes('ajouté') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddTreatment;