import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';

const ProfileCompletionCard = ({ userId }) => {
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ignoredFields, setIgnoredFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tempGender, setTempGender] = useState('');
  const [tempBirthdate, setTempBirthdate] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/patients/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const missing = [];
        if (!data.gender) missing.push('gender');
        if (!data.birthdate || data.birthdate === '1970-01-01') missing.push('birthdate');
        setMissingFields(missing);
        setTempGender(data.gender || '');
        setTempBirthdate(data.birthdate && data.birthdate !== '1970-01-01' ? data.birthdate : '');
      }
    } catch (error) {
      console.error('Erreur chargement profil', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveField = async (field, value) => {
    setLoading(true);
    try {
      const payload = {};
      payload[field] = value;
      const res = await fetch(`http://localhost:5000/patients/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const fieldName = field === 'gender' ? 'genre' : 'date de naissance';
        showNotification('Merci !', `Votre ${fieldName} a bien été enregistré(e).`, 'success');
        await fetchProfile();
        setCurrentIndex(prev => prev + 1);
      } else {
        const err = await res.json();
        showNotification('Erreur', err.error, 'error');
      }
    } catch (error) {
      showNotification('Erreur réseau', 'Impossible de mettre à jour le profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const field = missingFields[currentIndex];
    if (!field) return;

    let value = null;
    if (field === 'gender') {
      value = tempGender;
    } else if (field === 'birthdate') {
      value = tempBirthdate;
    }

    if (value && value.trim() !== '') {
      saveField(field, value);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleIgnore = () => {
    const field = missingFields[currentIndex];
    setIgnoredFields(prev => [...prev, field]);
    setCurrentIndex(prev => prev + 1);
  };

  const currentMissing = missingFields.filter(f => !ignoredFields.includes(f))[currentIndex];

  if (!currentMissing) return null;

  const fieldNames = {
    gender: 'genre',
    birthdate: 'date de naissance',
  };

  const renderInput = () => {
    const field = currentMissing;
    if (field === 'gender') {
      return (
        <select
          className="w-full border border-gray-300 rounded-md p-2 mt-2"
          value={tempGender}
          onChange={(e) => setTempGender(e.target.value)}
          disabled={loading}
        >
          <option value="">Sélectionnez</option>
          <option value="M">Homme</option>
          <option value="F">Femme</option>
        </select>
      );
    } else if (field === 'birthdate') {
      return (
        <input
          type="date"
          className="w-full border border-gray-300 rounded-md p-2 mt-2"
          value={tempBirthdate}
          onChange={(e) => setTempBirthdate(e.target.value)}
          disabled={loading}
        />
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6 relative">
        <button
          onClick={handleIgnore}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          aria-label="Ignorer"
        >
          ✕
        </button>
        <button
          onClick={handleNext}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Suivant"
        >
          →
        </button>
        <div className="text-center mt-4">
          <h3 className="text-xl font-semibold mb-2">Complétez votre profil</h3>
          <p className="text-gray-600 mb-4">
            Pour mieux vous accompagner, nous aimerions connaître votre {fieldNames[currentMissing]}.
          </p>
          {renderInput()}
          <div className="mt-4 text-xs text-gray-400">
            Choisissez une option, puis cliquez sur → pour continuer.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;