import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Plus, Trash2, Key, Clock, Cpu, Hash } from 'lucide-react';
import { SystemConfig } from '../../types';
import { systemConfigAPI } from '../../utils/supabase';

interface SystemConfigManagerProps {
  onUpdate?: () => void;
}

export const SystemConfigManager: React.FC<SystemConfigManagerProps> = ({ onUpdate }) => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { configs: loadedConfigs, error } = await systemConfigAPI.getAllConfigs();
      if (!error) {
        setConfigs(loadedConfigs);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (config: SystemConfig) => {
    if (!config.key || !config.value) return;

    setSaving(config.key);
    try {
      const { error } = await systemConfigAPI.setConfig(
        config.key,
        config.value,
        config.description,
        config.is_sensitive
      );

      if (!error) {
        await loadConfigs();
        setEditingConfig(null);
        setShowAddForm(false);
        onUpdate?.();
      } else {
        alert('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteConfig = async (key: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) {
      return;
    }

    try {
      const { error } = await systemConfigAPI.deleteConfig(key);
      if (!error) {
        await loadConfigs();
        onUpdate?.();
      } else {
        alert('Erro ao excluir configuração');
      }
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      alert('Erro ao excluir configuração');
    }
  };

  const toggleShowSensitive = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('api_key')) return <Key className="w-4 h-4" />;
    if (key.includes('expiry') || key.includes('time')) return <Clock className="w-4 h-4" />;
    if (key.includes('model')) return <Cpu className="w-4 h-4" />;
    if (key.includes('token') || key.includes('limit')) return <Hash className="w-4 h-4" />;
    return <Settings className="w-4 h-4" />;
  };

  const ConfigForm: React.FC<{ config?: SystemConfig; onSave: (config: SystemConfig) => void; onCancel: () => void }> = ({
    config,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState<SystemConfig>(
      config || {
        key: '',
        value: '',
        description: '',
        is_sensitive: false
      }
    );

    return (
      <div className="bg-gray-700/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {config ? 'Editar Configuração' : 'Nova Configuração'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chave *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Ex: openai_api_key"
              disabled={!!config} // Não permite editar chave existente
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor *
            </label>
            <div className="relative">
              <input
                type={formData.is_sensitive && !showSensitive[formData.key] ? 'password' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                placeholder="Valor da configuração"
                required
              />
              {formData.is_sensitive && (
                <button
                  type="button"
                  onClick={() => toggleShowSensitive(formData.key)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showSensitive[formData.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={2}
              placeholder="Descrição da configuração"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_sensitive"
              checked={formData.is_sensitive}
              onChange={(e) => setFormData({ ...formData, is_sensitive: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_sensitive" className="text-sm text-gray-300">
              Configuração sensível (será ocultada por padrão)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.key || !formData.value || saving === formData.key}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-lg transition-all"
          >
            {saving === formData.key ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Salvar</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">
              Configurações do Sistema ({configs.length})
            </h2>
            <p className="text-sm text-gray-400">
              Gerencie parâmetros sensíveis e variáveis do sistema
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Configuração</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <ConfigForm
          onSave={handleSaveConfig}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingConfig && (
        <ConfigForm
          config={editingConfig}
          onSave={handleSaveConfig}
          onCancel={() => setEditingConfig(null)}
        />
      )}

      {/* Configs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma configuração cadastrada</p>
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config.key}
              className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      {getConfigIcon(config.key)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {config.key}
                      </h3>
                      {config.description && (
                        <p className="text-sm text-gray-400">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 font-mono bg-gray-900/50 px-3 py-2 rounded-lg">
                          {config.is_sensitive && !showSensitive[config.key]
                            ? '••••••••••••••••'
                            : config.value
                          }
                        </p>
                      </div>
                      {config.is_sensitive && (
                        <button
                          onClick={() => toggleShowSensitive(config.key)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                        >
                          {showSensitive[config.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full ${
                        config.is_sensitive
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {config.is_sensitive ? 'Sensível' : 'Público'}
                      </span>
                      {config.updated_at && (
                        <span>
                          Atualizado: {new Date(config.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingConfig(config)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(config.key)}
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