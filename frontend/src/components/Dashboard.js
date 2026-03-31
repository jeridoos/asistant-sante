import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DailyIntakes from './DailyIntakes';
import Metrics from './Metrics';
import AddConstraint from './AddConstraint';
import AddMedicationGroup from './AddMedicationGroup';
import Appointments from './Appointments';
import { Button } from './ui/button';

const Dashboard = ({ user }) => {
  const [treatments, setTreatments] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Récupérer la liste des traitements (stable)
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

  // Récupérer la prédiction d'observance (stable)
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

  // Effet pour charger les données au montage et quand user change
  useEffect(() => {
    if (user) {
      fetchTreatments();
      fetchPrediction();
    }
  }, [user, fetchTreatments, fetchPrediction]); // toutes les dépendances sont stables

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="text-sm text-gray-600">Utilisateur {user.id}</div>
      </header>

      {prediction !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            Probabilité d'observance : <strong>{(prediction * 100).toFixed(1)}%</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Prises du jour</h2>
            <DailyIntakes patientId={user.id} />
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Métriques</h2>
            <Metrics patientId={user.id} />
          </div>
        </div>

        <div className="space-y-6">
          <Link to="/adherence">
            <Button className="w-full">Ajouter un traitement</Button>
          </Link>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Contraintes de prise</h2>
            <select
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              onChange={e => setSelectedTreatment(parseInt(e.target.value))}
            >
              <option value="">Sélectionner un traitement</option>
              {treatments.map(t => (
                <option key={t.id} value={t.id}>{t.drug_name}</option>
              ))}
            </select>
            {selectedTreatment && <AddConstraint treatmentId={selectedTreatment} onAdded={fetchTreatments} />}
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Multi-médicaments</h2>
            <AddMedicationGroup patientId={user.id} treatments={treatments} onAdded={fetchTreatments} />
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Rendez-vous</h2>
            <Appointments patientId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;