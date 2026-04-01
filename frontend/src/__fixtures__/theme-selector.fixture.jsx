import { useState } from 'react';
import { Button } from '../components/ui/button';

const ThemeSelector = () => {
  const [theme, setTheme] = useState('#3b82f6');
  
  const applyTheme = (color) => {
    setTheme(color);
    document.documentElement.style.setProperty('--primary-color', color);
  };
  
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Sélecteur de thème</h2>
      <div className="flex gap-2">
        <button onClick={() => applyTheme('#3b82f6')} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-gray-300" />
        <button onClick={() => applyTheme('#10b981')} className="w-8 h-8 rounded-full bg-green-500 border-2 border-gray-300" />
        <button onClick={() => applyTheme('#f59e0b')} className="w-8 h-8 rounded-full bg-amber-500 border-2 border-gray-300" />
        <button onClick={() => applyTheme('#ef4444')} className="w-8 h-8 rounded-full bg-red-500 border-2 border-gray-300" />
        <button onClick={() => applyTheme('#8b5cf6')} className="w-8 h-8 rounded-full bg-purple-500 border-2 border-gray-300" />
        <button onClick={() => applyTheme('#ec489a')} className="w-8 h-8 rounded-full bg-pink-500 border-2 border-gray-300" />
      </div>
      <div className="mt-4">
        <Button style={{ backgroundColor: 'var(--primary-color)' }}>Bouton test</Button>
      </div>
    </div>
  );
};

export default {
  default: <ThemeSelector />
};