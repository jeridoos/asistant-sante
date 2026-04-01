import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import ProfileMenu from './ProfileMenu';

const AddTreatment = ({ patientId }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState(5);
  const [frequency, setFrequency] = useState('1x/jour');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [times, setTimes] = useState(['08:00']);
  const [loading, setLoading] = useState(false);

  const addTime = () => setTimes([...times, '12:00']);
  const removeTime = (index) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const incrementDosage = () => setDosage(prev => Math.min(prev + 5, 100));
  const decrementDosage = () => setDosage(prev => Math.max(prev - 5, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (endDate && endDate < startDate) {
      showNotification('Erreur de date', 'La date de fin doit être après la date de début', 'warning');
      return;
    }
    if (times.length === 0 || times.some(t => !t)) {
      showNotification('Heures manquantes', 'Veuillez saisir au moins une heure de prise', 'warning');
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

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treatmentData)
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(
          'Traitement ajouté',
          `${drugName} ${dosage} mg - ${frequency}${endDate ? ` jusqu'au ${endDate}` : ''}`,
          'success'
        );
        setDrugName('');
        setDosage(5);
        setFrequency('1x/jour');
        setStartDate('');
        setEndDate('');
        setTimes(['08:00']);
      } else {
        showNotification('Erreur', data.error || 'Impossible d\'ajouter le traitement', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout traitement:', error);
      showNotification('Erreur réseau', 'Impossible de contacter le serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* En‑tête avec flèche de retour et menu profil */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition"
              aria-label="Retour"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Ajouter un traitement
            </h1>
          </div>
          <ProfileMenu userId={patientId} />
        </div>

        {/* Formulaire */}
        <div className="max-w-md mx-auto">
          <div className="card cart">
            <div className="title">Nouveau traitement</div>
            <div className="products">
              {/* Nom du médicament */}
              <div className="product">
                <svg fill="none" viewBox="0 0 60 60" height="60" width="60" xmlns="http://www.w3.org/2000/svg">
                  <rect fill="#FFF6EE" rx="8.25" height="60" width="60" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.25" stroke="#FF8413" fill="#FFB672" d="M34.2812 18H25.7189C21.9755 18 18.7931 20.5252 17.6294 24.0434C17.2463 25.2017 17.0547 25.7808 17.536 26.3904C18.0172 27 18.8007 27 20.3675 27H39.6325C41.1993 27 41.9827 27 42.4639 26.3904C42.9453 25.7808 42.7538 25.2017 42.3707 24.0434C41.207 20.5252 38.0246 18 34.2812 18Z" />
                  <path fill="#FFB672" d="M18 36H17.25C16.0074 36 15 34.9926 15 33.75C15 32.5074 16.0074 31.5 17.25 31.5H29.0916C29.6839 31.5 30.263 31.6754 30.7557 32.0039L33.668 33.9453C34.1718 34.2812 34.8282 34.2812 35.332 33.9453L38.2443 32.0039C38.7371 31.6754 39.3161 31.5 39.9084 31.5H42.75C43.9926 31.5 45 32.5074 45 33.75C45 34.9926 43.9926 36 42.75 36H42M18 36L18.6479 38.5914C19.1487 40.5947 20.9486 42 23.0135 42H36.9865C39.0514 42 40.8513 40.5947 41.3521 38.5914L42 36M18 36H28.5ZM42 36H39.75Z" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.25" stroke="#FF8413" d="M18 36H17.25C16.0074 36 15 34.9926 15 33.75C15 32.5074 16.0074 31.5 17.25 31.5H29.0916C29.6839 31.5 30.263 31.6754 30.7557 32.0039L33.668 33.9453C34.1718 34.2812 34.8282 34.2812 35.332 33.9453L38.2443 32.0039C38.7371 31.6754 39.3161 31.5 39.9084 31.5H42.75C43.9926 31.5 45 32.5074 45 33.75C45 34.9926 43.9926 36 42.75 36H42M18 36L18.6479 38.5914C19.1487 40.5947 20.9486 42 23.0135 42H36.9865C39.0514 42 40.8513 40.5947 41.3521 38.5914L42 36M18 36H28.5M42 36H39.75" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3" stroke="#FF8413" d="M34.512 22.5H34.4982" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.25" stroke="#FF8413" d="M27.75 21.75L26.25 23.25" />
                </svg>
                <div className="flex-1">
                  <span>Nom du médicament</span>
                  <input
                    type="text"
                    value={drugName}
                    onChange={e => setDrugName(e.target.value)}
                    placeholder="Ex: Amlocor"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Dosage */}
              <div className="product">
                <div className="flex-1">
                  <span>Dosage (mg)</span>
                  <div className="quantity mt-1">
                    <button type="button" onClick={decrementDosage} disabled={loading}>
                      <svg fill="none" viewBox="0 0 24 24" height="14" width="14">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M20 12L4 12" />
                      </svg>
                    </button>
                    <label>{dosage}</label>
                    <button type="button" onClick={incrementDosage} disabled={loading}>
                      <svg fill="none" viewBox="0 0 24 24" height="14" width="14">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12 4V20M20 12H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fréquence */}
              <div className="product">
                <div className="flex-1">
                  <span>Fréquence</span>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="1x/jour">1 fois par jour</option>
                    <option value="2x/jour">2 fois par jour</option>
                    <option value="3x/jour">3 fois par jour</option>
                    <option value="1x/2jours">1 fois tous les 2 jours</option>
                    <option value="1x/semaine">1 fois par semaine</option>
                  </select>
                </div>
              </div>

              {/* Date de début */}
              <div className="product">
                <div className="flex-1">
                  <span>Date de début</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Date de fin (optionnelle) */}
              <div className="product">
                <div className="flex-1">
                  <span>Date de fin (optionnelle)</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Heures de prise */}
              <div className="product">
                <div className="flex-1">
                  <span>Heures de prise</span>
                  {times.map((time, idx) => (
                    <div key={idx} className="flex gap-2 items-center mt-2">
                      <input
                        type="time"
                        value={time}
                        onChange={e => updateTime(idx, e.target.value)}
                        required
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Ajouter un horaire
                  </button>
                </div>
              </div>

              {/* Bouton d'ajout */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le traitement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTreatment;