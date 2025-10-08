import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
const ClientManagement = ({
  clients,
  loading,
  setActiveView,
  setEditingClient,
  setShowEditClientModal,
  deleteClient
}) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">{t('clientManagement.title')}</h2>
        <button
          onClick={() => setActiveView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm sm:text-base"
        >
          {t('clientManagement.backToInvoices')}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientManagement.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientManagement.email')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientManagement.phone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientManagement.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientManagement.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    client.is_business 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {client.is_business ? 'Business' : 'Individual'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingClient({...client});
                        setShowEditClientModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit client"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}? This action cannot be undone.`)) {
                          deleteClient(client.id);
                        }
                      }}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      title="Delete client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  {client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}
                </div>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  client.is_business 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {client.is_business ? 'Business' : 'Individual'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingClient({...client});
                    setShowEditClientModal(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-900 p-1"
                  title="Edit client"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}? This action cannot be undone.`)) {
                      deleteClient(client.id);
                    }
                  }}
                  disabled={loading}
                  className="text-red-600 hover:text-red-900 disabled:text-gray-400 p-1"
                  title="Delete client"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{client.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 text-gray-900">{client.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientManagement;