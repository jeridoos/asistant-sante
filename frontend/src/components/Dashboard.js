import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import lowAdherenceImg from '../assets/images/war9a 7amra.jpg';
import mediumAdherenceImg from '../assets/images/bin l binin.jpg';
import highAdherenceImg from '../assets/images/selka.jpg';
import ProfileCompletionCard from './ProfileCompletionCard';
import Header from './Header';
import ModernCard from './ui/ModernCard';

// Import des fonctionnalités des autres membres
import PhysicalActivity from './features/PhysicalActivity';
import CardiacAnomaly from './features/CardiacAnomaly';
import SleepCycle from './features/SleepCycle';
import FoodRecognition from './features/FoodRecognition';
import StressPrediction from './features/StressPrediction';
import AsthmaPrediction from './features/AsthmaPrediction';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

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

  const fetchUpcomingMedications = useCallback(async () => {
    if (!user) return;
    setLoadingUpcoming(true);
    try {
      const res = await fetch(`http://localhost:5000/intakes?patient_id=${user.id}`);
      const data = await res.json();
      const now = new Date();
      const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      const upcoming = data.filter(intake => {
        const intakeDate = new Date(intake.scheduled_datetime);
        return intake.status === 'scheduled' && intakeDate > now && intakeDate <= sixHoursLater;
      });
      setUpcomingMedications(upcoming);
    } catch (error) {
      console.error('Erreur chargement prises à venir:', error);
    } finally {
      setLoadingUpcoming(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPrediction();
      fetchUpcomingMedications();
    }
  }, [user, fetchPrediction, fetchUpcomingMedications]);

  if (!user) return <div>Chargement...</div>;

  const hasUpcoming = upcomingMedications.length > 0;
  const upcomingMessage = hasUpcoming
    ? `À prendre dans les 6h : ${upcomingMedications.length} médicament(s)`
    : "Aucune prise à venir dans les 6h";

  let adherenceImage = null;
  if (prediction !== null) {
    const percent = prediction * 100;
    if (percent < 40) adherenceImage = lowAdherenceImg;
    else if (percent > 70) adherenceImage = highAdherenceImg;
    else adherenceImage = mediumAdherenceImg;
  }

  const predictionDisplay = prediction !== null ? `${(prediction * 100).toFixed(0)}%` : "Nouveau";

  const mainCardContent = (
    <>
      <div className="flex justify-between items-start">
        <h2 className="card__title">Medication Adherence Prediction</h2>
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-3 py-1 rounded-full">
          {predictionDisplay}
        </div>
      </div>
      <p className="card__content">Prédiction d'observance basée sur votre historique</p>
      <div className="flex items-center gap-4 mt-2">
        {adherenceImage && (
          <img src={adherenceImage} alt="Niveau d'observance" className="w-12 h-12 object-contain" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {hasUpcoming ? (
              <span className="text-green-500 text-xl">✅</span>
            ) : (
              <span className="text-yellow-500 text-xl">⚠️</span>
            )}
            <span className="text-gray-600 dark:text-gray-300 text-sm">{upcomingMessage}</span>
          </div>
          {loadingUpcoming && <p className="text-xs text-gray-400 mt-2">Chargement...</p>}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/old-dashboard')}
          className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium transition"
        >
          Voir mon tableau de bord détaillé
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <ProfileCompletionCard userId={user.id} />
      <div className="max-w-7xl mx-auto">
        <Header user={user} title="Assistant Santé" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte Medication Adherence Prediction (moderne) */}
          <ModernCard onClick={() => navigate('/old-dashboard')}>
            {mainCardContent}
          </ModernCard>

          {/* Cartes des autres fonctionnalités */}
          <PhysicalActivity userId={user.id} />
          <CardiacAnomaly userId={user.id} />
          <SleepCycle userId={user.id} />
          <FoodRecognition userId={user.id} />
          <StressPrediction userId={user.id} />
          <AsthmaPrediction userId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;