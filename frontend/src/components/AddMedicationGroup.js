import React, { useState } from 'react';

const AddMedicationGroup = ({ patientId, treatments, onAdded }) => {
  const [groupId, setGroupId] = useState(1);
  const [treatmentId, setTreatmentId] = useState('');
  const [isGrouped, setIsGrouped] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!treatmentId) {
      setMessage('Veuillez sélectionner un traitement');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/medication_groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          patient_id: patientId,
          treatment_id: parseInt(treatmentId),
          is_grouped: isGrouped ? 1 : 0,
          interval_minutes: isGrouped ? null : intervalMinutes
        })
      });
      if (res.ok) {
        setMessage('Groupe ajouté');
        setTreatmentId('');
        if (onAdded) onAdded();
      } else {
        const err = await res.json();
        setMessage(`Erreur: ${err.error}`);
      }
    } catch (error) {
      setMessage('Erreur réseau');
    }
  };

  return (
    <div>
      <h4>Ajouter un groupe de médicaments</h4>
      <form onSubmit={handleSubmit}>
        <input type="number" placeholder="ID du groupe" value={groupId} onChange={e => setGroupId(parseInt(e.target.value))} />
        <select value={treatmentId} onChange={e => setTreatmentId(e.target.value)}>
          <option value="">Sélectionner un traitement</option>
          {treatments.map(t => (
            <option key={t.id} value={t.id}>{t.drug_name} ({t.dosage})</option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={isGrouped} onChange={e => setIsGrouped(e.target.checked)} />
          Prises groupées
        </label>
        {!isGrouped && (
          <input type="number" placeholder="Intervalle (minutes)" value={intervalMinutes} onChange={e => setIntervalMinutes(parseInt(e.target.value))} />
        )}
        <button type="submit">Ajouter</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddMedicationGroup;