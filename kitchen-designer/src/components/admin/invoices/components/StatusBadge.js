import React from 'react';
import { Clock, Send, AlertCircle, Check } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
    partial: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    paid: { color: 'bg-green-100 text-green-800', icon: Check }
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;