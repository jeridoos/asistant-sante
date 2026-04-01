import React, { useEffect, useState } from 'react';

const NotificationItem = ({ id, type = 'error', title, message, duration = 5000, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 16);
    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      );
    }
    // error / warning
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    );
  };

  const getColors = () => {
    if (type === 'success') {
      return {
        text: 'text-[#2b9875]',
        iconBg: 'bg-white/5',
        progress: 'bg-[#2b9875]'
      };
    }
    // error
    return {
      text: 'text-[#d65563]',
      iconBg: 'bg-white/5',
      progress: 'bg-[#d65563]'
    };
  };

  const colors = getColors();

  return (
    <div
      className={`flex flex-col gap-1 w-72 sm:w-80 text-xs sm:text-sm rounded-lg bg-[#232531] backdrop-blur-sm shadow-lg transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}
    >
      <div className="flex items-center justify-between w-full p-3">
        <div className="flex gap-3">
          <div className={`p-1 rounded-lg ${colors.iconBg} ${colors.text}`}>
            {getIcon()}
          </div>
          <div>
            <p className={`font-medium ${colors.text}`}>{title}</p>
            <p className="text-gray-300 text-xs">{message}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:bg-white/10 p-1 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default NotificationItem;