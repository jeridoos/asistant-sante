import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DailyIntakes from './DailyIntakes';
import Metrics from './Metrics';
import AddConstraint from './AddConstraint';
import AddMedicationGroup from './AddMedicationGroup';
import Appointments from './Appointments';

const Dashboard = ({ user }) => {
  // Tous les hooks doivent être appelés avant le retour conditionnel
  const [treatments, setTreatments] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Récupérer la liste des traitements
  const fetchTreatments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/treatments?patient_id=${user.id}`);
      const data = await res.json();
      setTreatments(data);
    } catch (error) {
      console.error('Erreur chargement traitements:', error);
    }
  };

  // Récupérer la prédiction d'observance
  const fetchPrediction = async () => {
    try {
      const res = await fetch(`http://localhost:5000/patients/${user.id}/predict`);
      const data = await res.json();
      setPrediction(data.adherence_probability);
    } catch (error) {
      console.error('Erreur prédiction:', error);
    }
  };

  // Effets
  useEffect(() => {
    if (user) {
      fetchTreatments();
      fetchPrediction();
    }
  }, [user]); // user est une dépendance, pas besoin d'ajouter fetchTreatments car elle est stable

  // Si l'utilisateur n'est pas connecté, on peut retourner un message après les hooks
  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h2>Tableau de bord</h2>
      <p>Bienvenue, utilisateur {user.id} !</p>
      {prediction !== null && (
        <p>Probabilité d'observance (prédiction) : {(prediction * 100).toFixed(1)}%</p>
      )}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Link to="/adherence"><button>Ajouter un traitement</button></Link>
      </div>

      <Metrics patientId={user.id} />
      <DailyIntakes patientId={user.id} />

      <hr />
      <h3>Contraintes de prise</h3>
      <select onChange={e => setSelectedTreatment(parseInt(e.target.value))}>
        <option value="">Sélectionner un traitement</option>
        {treatments.map(t => (
          <option key={t.id} value={t.id}>{t.drug_name}</option>
        ))}
      </select>
      {selectedTreatment && <AddConstraint treatmentId={selectedTreatment} onAdded={fetchTreatments} />}

      <hr />
      <h3>Multi-médicaments</h3>
      <AddMedicationGroup patientId={user.id} treatments={treatments} onAdded={fetchTreatments} />

      <hr />
      <Appointments patientId={user.id} />
    </div>
  );
};

export default Dashboard;