import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import DarkModeToggle from './ui/DarkModeToggle';

const VerifyEmail = () => {
  const { showNotification } = useNotification();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showNotification('Code manquant', 'Veuillez entrer le code de vérification', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Vérification réussie', 'Votre email a été vérifié. Vous pouvez maintenant vous connecter.', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de vérification', data.error || 'Code invalide', 'error');
      }
    } catch (err) {
      showNotification('Erreur réseau', 'Impossible de contacter le serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vérification</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Un code de vérification a été envoyé à<br />
            <span className="font-medium text-gray-700 dark:text-gray-300">{email || 'votre email'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code de vérification</label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: a1b2c3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vérification en cours...' : 'Vérifier'}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          Vous n'avez pas reçu le code ?{' '}
          <Link to="/register" className="text-purple-600 font-medium hover:underline">
            Renvoyer
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;