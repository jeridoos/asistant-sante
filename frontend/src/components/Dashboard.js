import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DailyIntakes from './DailyIntakes';
import Metrics from './Metrics';
import AddConstraint from './AddConstraint';
import AddMedicationGroup from './AddMedicationGroup';
import Appointments from './Appointments';

const Dashboard = ({ user }) => {
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  useEffect(() => {
    fetchTreatments();
  }, [user]);

  const fetchTreatments = async () => {
    const res = await fetch(`http://localhost:5000/treatments?patient_id=${user.id}`);
    const data = await res.json();
    setTreatments(data);
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Tableau de bord</h2>
      <p>Bienvenue, utilisateur {user.id} !</p>
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