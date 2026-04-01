import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

const ProfileMenu = ({ userId }) => {
  const { showNotification } = useNotification();
  const [missingFields, setMissingFields] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/patients/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        const missing = [];
        if (!data.gender) missing.push('gender');
        if (!data.birthdate || data.birthdate === '1970-01-01') missing.push('birthdate');
        setMissingFields(missing);
      } catch (error) {
        console.error('Erreur chargement profil', error);
        showNotification('Erreur', 'Impossible de charger votre profil', 'error');
      }
    };
    fetchProfile();
  }, [userId, showNotification]);

  const handleEditProfile = () => {
    alert('Édition de profil à implémenter');
    setIsOpen(false);
  };

  const handleCompleteMissing = () => {
    alert('Complétion de profil – ouvrir la carte existante');
    setIsOpen(false);
  };

  const hasMissing = missingFields.length > 0;

  return (
    <label className="profile-menu-main">
      <span className="menu-label">Profil</span>
      <input
        type="checkbox"
        className="profile-inp"
        checked={isOpen}
        onChange={() => setIsOpen(!isOpen)}
      />
      <div className="profile-bar">
        <span className="top bar-list"></span>
        <span className="middle bar-list"></span>
        <span className="bottom bar-list"></span>
      </div>
      <section className="profile-menu-container">
        <div className="menu-list" onClick={handleEditProfile}>
          Modifier mon profil
        </div>
        {hasMissing && (
          <div className="menu-list" onClick={handleCompleteMissing}>
            Compléter les informations manquantes
            <span className="missing-badge">{missingFields.length}</span>
          </div>
        )}
        <div className="menu-list" onClick={() => { /* déconnexion ? */ }}>
          Déconnexion
        </div>
      </section>
    </label>
  );
};

export default ProfileMenu;