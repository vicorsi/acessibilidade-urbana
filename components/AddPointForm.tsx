
import React, { useState, useRef } from 'react';
import { AccessibilityPoint, PointType } from '../types';

interface AddPointFormProps {
  onSave: (data: Omit<AccessibilityPoint, 'id' | 'position' | 'address' | 'creatorId'>) => void;
  onCancel: () => void;
}

const pointTypeTranslations: Record<string, string> = {
  [PointType.RAMP]: 'Rampa de Acesso',
  [PointType.ELEVATOR]: 'Elevador',
  [PointType.RESTROOM]: 'Banheiro Acessível',
  [PointType.PARKING]: 'Vaga de Estacionamento',
  [PointType.ENTRANCE]: 'Entrada Acessível',
  [PointType.UNKNOWN]: 'Outro',
};

const AddPointForm: React.FC<AddPointFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PointType>(PointType.RAMP);
  const [description, setDescription] = useState('');
  const [customIcon, setCustomIcon] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setCustomIcon(reader.result);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    onSave({ name, type, description, customIcon });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">Adicionar Ponto de Acessibilidade</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="name" className="block text-slate-300 text-sm font-bold mb-2">Nome do Local</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Ex: Rampa do Museu"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="type" className="block text-slate-300 text-sm font-bold mb-2">Tipo de Ponto</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as PointType)}
              className="w-full bg-slate-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {Object.values(PointType).filter(t => t !== PointType.UNKNOWN).map(t => (
                <option key={t} value={t}>{pointTypeTranslations[t]}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
             <label className="block text-slate-300 text-sm font-bold mb-2">Foto do Ponto (Opcional)</label>
             <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
                >
                    Enviar Foto
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                {customIcon && (
                    <img src={customIcon} alt="Pré-visualização" className="w-16 h-16 rounded-lg object-cover border-2 border-slate-600" />
                )}
             </div>
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-slate-300 text-sm font-bold mb-2">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md py-2 px-3 h-24 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Descreva detalhes como localização exata, condição, etc."
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
              Salvar Ponto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPointForm;
