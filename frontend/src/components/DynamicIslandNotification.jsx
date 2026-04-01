import React, { useState, useEffect, useRef } from 'react';

const DynamicIslandNotification = ({ 
  title, 
  message, 
  type = 'success', 
  duration = 3000,
  onClose,
  onConfirm,
  onCancel,
  showActions = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    // Auto-expand when notification appears
    setIsExpanded(true);
    setProgress(0);

    // Progress bar animation
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(progressRef.current);
      }
    }, 16);

    // Auto-close after duration
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExpanded(false);
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠️';
      case 'loading': return '⏳';
      default: return '✓';
    }
  };

  const getStatusText = () => {
    switch (type) {
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'warning': return 'Attention';
      case 'loading': return 'Chargement';
      default: return 'Info';
    }
  };

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 cursor-pointer
        ${isExpanded ? 'w-80 min-h-[80px]' : 'w-24 h-9'}`}
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: '40px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '0.5px solid rgba(255, 255, 255, 0.2)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {!isExpanded ? (
        // Compact mode
        <div className="flex items-center justify-between h-full px-3">
          <span className="text-white text-sm">{getIcon()}</span>
          <span className="text-white text-xs font-medium">{getStatusText()}</span>
          <span className="text-white/70 text-xs">▼</span>
        </div>
      ) : (
        // Expanded mode
        <div className="p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h4 className="text-white text-sm font-semibold">{title}</h4>
              <p className="text-white/70 text-xs">{message}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          {showActions && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 rounded-full bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition"
              >
                Confirmer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicIslandNotification;