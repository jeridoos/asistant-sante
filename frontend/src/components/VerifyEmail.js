import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Email vérifié ! Vous pouvez vous connecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Erreur réseau');
    }
  };

  return (
    <div>
      <h2>Vérification</h2>
      <p>Un code a été envoyé à {email}</p>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Code de vérification" value={code} onChange={e => setCode(e.target.value)} required />
        <button type="submit">Vérifier</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};
export default VerifyEmail;