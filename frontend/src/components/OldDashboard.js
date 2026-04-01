import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DailyIntakes from './DailyIntakes';
import Metrics from './Metrics';
import AddConstraint from './AddConstraint';
import AddMedicationGroup from './AddMedicationGroup';
import Appointments from './Appointments';
import { Button } from './ui/button';
import ModernCard from './ui/ModernCard';
import ProfileMenu from './ProfileMenu';

const OldDashboard = ({ user }) => {
  const [treatments, setTreatments] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const fetchTreatments = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/treatments?patient_id=${user.id}`);
      const data = await res.json();
      setTreatments(data);
    } catch (error) {
      console.error('Erreur chargement traitements:', error);
    }
  }, [user]);

  const fetchPrediction = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/patients/${user.id}/predict`);
      const data = await res.json();
      setPrediction(data.adherence_probability);
    } catch (error) {
      console.error('Erreur prédiction:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTreatments();
      fetchPrediction();
    }
  }, [user, fetchTreatments, fetchPrediction]);

  if (!user) return <div>Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* En‑tête avec flèche de retour et menu profil */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition"
              aria-label="Retour au tableau de bord principal"
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
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Tableau de bord détaillé
            </h1>
          </div>
          <ProfileMenu userId={user.id} />
        </div>

        {prediction !== null && (
          <ModernCard className="mb-6">
            <p className="card__content text-blue-800 dark:text-blue-200">
              Probabilité d'observance : <strong>{(prediction * 100).toFixed(1)}%</strong>
            </p>
          </ModernCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <ModernCard title="Prises du jour">
              <DailyIntakes patientId={user.id} />
            </ModernCard>
            <ModernCard title="Métriques">
              <Metrics patientId={user.id} />
            </ModernCard>
          </div>

          <div className="space-y-6">
          <Link to="/adherence">
  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition">
    Ajouter un traitement
  </button>
</Link>
            <ModernCard title="Contraintes de prise">
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onChange={e => setSelectedTreatment(parseInt(e.target.value))}
              >
                <option value="">Sélectionner un traitement</option>
                {treatments.map(t => (
                  <option key={t.id} value={t.id}>{t.drug_name}</option>
                ))}
              </select>
              {selectedTreatment && <AddConstraint treatmentId={selectedTreatment} onAdded={fetchTreatments} />}
            </ModernCard>

            <ModernCard title="Multi-médicaments">
              <AddMedicationGroup patientId={user.id} treatments={treatments} onAdded={fetchTreatments} />
            </ModernCard>

            <ModernCard title="Rendez-vous">
              <Appointments patientId={user.id} />
            </ModernCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldDashboard;