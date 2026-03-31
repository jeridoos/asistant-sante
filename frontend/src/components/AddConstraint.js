import React, { useState, useEffect } from 'react';

const AddConstraint = ({ treatmentId, onAdded }) => {
  const [timing, setTiming] = useState('before_meal');
  const [delay, setDelay] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');
  const [constraints, setConstraints] = useState([]);

  const fetchConstraints = async () => {
    if (!treatmentId) return;
    try {
      const res = await fetch(`http://localhost:5000/constraints?treatment_id=${treatmentId}`);
      const data = await res.json();
      setConstraints(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConstraints();
  }, [treatmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatment_id: treatmentId,
          timing_relative_to_meal: timing,
          delay_minutes: delay,
          special_instructions: instructions
        })
      });
      if (res.ok) {
        setMessage('Contrainte ajoutée');
        setTiming('before_meal');
        setDelay(0);
        setInstructions('');
        fetchConstraints();  // recharge la liste
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
      <h4>Contraintes de prise</h4>
      <ul>
        {constraints.map((c, idx) => (
          <li key={idx}>
            {c.timing_relative_to_meal} {c.delay_minutes ? `(délai: ${c.delay_minutes} min)` : ''} - {c.special_instructions}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <select value={timing} onChange={e => setTiming(e.target.value)}>
          <option value="before_meal">Avant repas</option>
          <option value="after_meal">Après repas</option>
          <option value="with_meal">Pendant repas</option>
        </select>
        <input type="number" placeholder="Délai (minutes)" value={delay} onChange={e => setDelay(parseInt(e.target.value))} />
        <input type="text" placeholder="Instructions spéciales" value={instructions} onChange={e => setInstructions(e.target.value)} />
        <button type="submit">Ajouter</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddConstraint;