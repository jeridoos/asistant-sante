import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Metrics = ({ patientId }) => {
  const [streak, setStreak] = useState(0);
  const [rate, setRate] = useState(0);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/patients/${patientId}/metrics`);
      const data = await res.json();
      setStreak(data.streak);
      setRate(data.rate);
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
    }
  }, [patientId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{streak}</div>
          <p className="text-xs text-gray-500">jours consécutifs</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Taux d'observance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(rate * 100).toFixed(1)}%</div>
          <p className="text-xs text-gray-500">sur les 7 derniers jours</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;