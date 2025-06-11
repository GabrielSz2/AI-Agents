import React, { useState } from 'react';
import { Plus, Trash2, Key, Users, Calendar, Check, X } from 'lucide-react';
import { AccessKey } from '../../types';
import { accessKeysAPI } from '../../utils/supabase';

interface AccessKeyManagerProps {
  accessKeys: AccessKey[];
  onUpdate: (keys: AccessKey[]) => void;
}

export const AccessKeyManager: React.FC<AccessKeyManagerProps> = ({ accessKeys, onUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRandomKey = () => {
    const prefix = 'KEY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyValue.trim()) {
      setError('Digite uma chave válida.');
      return;
    }

    // Verifica se a chave já existe
    if (accessKeys.some(key => key.key_value === newKeyValue.trim())) {
      setError('Esta chave já existe.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { accessKey, error } = await accessKeysAPI.createAccessKey(newKeyValue.trim());
      
      if (error || !accessKey) {
        setError('Erro ao criar chave. Tente novamente.');
      } else {
        onUpdate([accessKey, ...accessKeys]);
        setNewKeyValue('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Erro ao criar chave:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta chave?')) {
      return;
    }

    try {
      const { error } = await accessKeysAPI.deleteAccessKey(id);
      if (!error) {
        onUpdate(accessKeys.filter(key => key.id !== id));
      } else {
        alert('Erro ao excluir chave');
      }
    } catch (error) {
      console.error('Erro ao excluir chave:', error);
      alert('Erro ao excluir chave');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const usedKeys = accessKeys.filter(key => key.is_used);
  const availableKeys = accessKeys.filter(key => !key.is_used);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Key className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">
              Chaves de Acesso ({accessKeys.length})
            </h2>
            <p className="text-sm text-gray-400">
              {availableKeys.length} disponíveis • {usedKeys.length} usadas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Chave</span>
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Criar Nova Chave</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyValue('');
                setError('');
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Digite a chave ou clique em 'Gerar'"
                  required
                />
                <button
                  type="button"
                  onClick={() => setNewKeyValue(generateRandomKey())}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                >
                  Gerar
                </button>
              </div>
              <p className="text-xs text-gray-500">
                A chave deve ser única e será usada pelos usuários para criar contas
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyValue('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-lg transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Criar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{availableKeys.length}</p>
              <p className="text-sm text-green-400">Chaves Disponíveis</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{usedKeys.length}</p>
              <p className="text-sm text-blue-400">Chaves Utilizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {accessKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl">
            <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma chave cadastrada</p>
          </div>
        ) : (
          accessKeys.map((key) => (
            <div
              key={key.id}
              className={`border rounded-xl p-4 ${
                key.is_used
                  ? 'bg-gray-800/20 border-gray-700/30'
                  : 'bg-gray-800/30 border-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      key.is_used
                        ? 'bg-gray-600/30 text-gray-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {key.is_used ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-mono text-white font-medium">
                        {key.key_value}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Criada: {formatDate(key.created_at!)}</span>
                        </span>
                        {key.is_used && key.used_at && (
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>Usada: {formatDate(key.used_at)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {key.is_used && key.used_by && (
                    <div className="ml-11">
                      <p className="text-sm text-gray-400">
                        Utilizada por: <span className="text-purple-400">{key.used_by}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    key.is_used
                      ? 'bg-gray-600/30 text-gray-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {key.is_used ? 'Usada' : 'Disponível'}
                  </span>
                  <button
                    onClick={() => handleDeleteKey(key.id!)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};