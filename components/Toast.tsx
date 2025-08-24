import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, Trophy } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircle className="w-6 h-6 text-green-300" />,
    bg: 'bg-green-800/90 border-green-600',
  },
  error: {
    icon: <XCircle className="w-6 h-6 text-red-300" />,
    bg: 'bg-red-800/90 border-red-600',
  },
  info: {
    icon: <Info className="w-6 h-6 text-blue-300" />,
    bg: 'bg-blue-800/90 border-blue-600',
  },
  achievement: {
    icon: <Trophy className="w-6 h-6 text-yellow-300" />,
    bg: 'bg-yellow-800/90 border-yellow-600',
  }
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 2700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const config = toastConfig[type];

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg shadow-lg border text-white transition-all duration-300 backdrop-blur-sm ${config.bg} ${exiting ? 'opacity-0 translate-x-12' : 'opacity-100 translate-x-0'}`}
    >
      {config.icon}
      <p>{message}</p>
    </div>
  );
};

export default Toast;