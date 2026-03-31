import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';

const AddConstraint = ({ treatmentId, onAdded }) => {
  const [timing, setTiming] = useState('before_meal');
  const [delay, setDelay] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');
  const [constraints, setConstraints] = useState([]);

  const fetchConstraints = useCallback(async () => {
    if (!treatmentId) return;
    try {
      const res = await fetch(`http://localhost:5000/constraints?treatment_id=${treatmentId}`);
      const data = await res.json();
      setConstraints(data);
    } catch (error) {
      console.error('Erreur chargement contraintes:', error);
    }
  }, [treatmentId]);

  useEffect(() => {
    fetchConstraints();
  }, [fetchConstraints]);

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
        fetchConstraints();
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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select value={timing} onValueChange={setTiming}>
          <SelectTrigger>
            <SelectValue placeholder="Moment par rapport au repas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before_meal">Avant repas</SelectItem>
            <SelectItem value="after_meal">Après repas</SelectItem>
            <SelectItem value="with_meal">Pendant repas</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Délai (minutes)"
          value={delay}
          onChange={e => setDelay(parseInt(e.target.value))}
        />
        <Input
          type="text"
          placeholder="Instructions spéciales"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
        />
        <Button type="submit">Ajouter la contrainte</Button>
      </form>
      {message && (
        <div className={`p-2 rounded text-sm ${message.includes('ajoutée') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
      {constraints.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Contraintes existantes :</h4>
          <div className="space-y-2">
            {constraints.map((c, idx) => (
              <Card key={idx}>
                <CardContent className="p-3">
                  <p className="font-medium">{c.timing_relative_to_meal}</p>
                  {c.delay_minutes > 0 && <p className="text-sm">Délai: {c.delay_minutes} min</p>}
                  {c.special_instructions && <p className="text-sm text-gray-500">{c.special_instructions}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddConstraint;