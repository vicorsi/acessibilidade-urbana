import React, { useRef, useState, useEffect } from 'react';
import { AccessibilityPoint, PointType, User } from '../types';
import { CloseIcon, PointIcon, EditIcon, StarIcon, VolumeUpIcon, HandIcon } from './icons/Icons';

interface DetailsPanelProps {
  point: AccessibilityPoint | null;
  currentUser: User | null;
  onClose: () => void;
  onUpdateIcon: (id: string, iconDataUrl: string) => void;
  onRename: (id: string, newName: string) => void;
  onRate: (id: string, value: number) => void;
  onSpeak: (text: string) => void;
}

const pointTypeTranslations: Record<PointType, string> = {
  [PointType.RAMP]: 'Rampa de Acesso',
  [PointType.ELEVATOR]: 'Elevador',
  [PointType.RESTROOM]: 'Banheiro Acessível',
  [PointType.PARKING]: 'Vaga de Estacionamento',
  [PointType.ENTRANCE]: 'Entrada Acessível',
  [PointType.UNKNOWN]: 'Ponto de Acessibilidade',
};

const pointTypeColors: Record<PointType, string> = {
    [PointType.RAMP]: 'text-green-400',
    [PointType.ELEVATOR]: 'text-blue-400',
    [PointType.RESTROOM]: 'text-yellow-400',
    [PointType.PARKING]: 'text-indigo-400',
    [PointType.ENTRANCE]: 'text-purple-400',
    [PointType.UNKNOWN]: 'text-gray-400',
};

const DetailsPanel: React.FC<DetailsPanelProps> = ({ point, currentUser, onClose, onUpdateIcon, onRename, onRate, onSpeak }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const canModify = !!currentUser && (!point?.creatorId || point?.creatorId === currentUser.id);
  const canRate = !!currentUser && point?.creatorId !== currentUser?.id;

  const averageRating = point?.ratings?.length
    ? point.ratings.reduce((acc, r) => acc + r.value, 0) / point.ratings.length
    : 0;
  const totalRatings = point?.ratings?.length || 0;
  const userRating = point?.ratings?.find(r => r.userId === currentUser?.id)?.value || 0;

  useEffect(() => {
    if (point) {
      setEditingNameValue(point.name);
      // Focar no título para leitores de tela quando o painel abrir
      headingRef.current?.focus();
    }
    setIsEditingName(false);
  }, [point]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && point) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  onUpdateIcon(point.id, reader.result);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleStartEditingName = () => {
    if (!point || !canModify) return;
    setEditingNameValue(point.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (point && editingNameValue.trim() && editingNameValue !== point.name) {
      onRename(point.id, editingNameValue.trim());
    }
    setIsEditingName(false);
  };
  
  const handleSpeakClick = () => {
    if (!point) return;
    const textToSpeak = `
      ${point.name}.
      Tipo: ${pointTypeTranslations[point.type]}.
      Endereço: ${point.address}.
      Descrição: ${point.description}.
      Avaliação média: ${averageRating.toFixed(1)} de 5 estrelas, com ${totalRatings} avaliações.
    `;
    onSpeak(textToSpeak);
  };

  const handleNameInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditingNameValue(point?.name || '');
    }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-panel-heading"
      className={`absolute bottom-0 left-0 right-0 z-30 bg-slate-800/90 backdrop-blur-sm text-white p-4 rounded-t-2xl shadow-2xl transition-transform duration-500 ease-in-out ${
        point ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!point}
    >
      {point && (
        <div className="w-full max-w-4xl mx-auto pb-4">
          <div className="flex justify-between items-start">
            <h2 id="details-panel-heading" ref={headingRef} tabIndex={-1} className="sr-only">{point.name}</h2>
            <div>{/* Placeholder para manter o espaçamento */}</div>
            <div className="flex gap-2">
                <button onClick={handleSpeakClick} className="text-slate-400 hover:text-white transition-colors" aria-label="Ler detalhes em voz alta">
                    <VolumeUpIcon />
                </button>
                <button className="text-slate-400 hover:text-white transition-colors" aria-label="Ver em Libras (Língua Brasileira de Sinais)">
                    <HandIcon />
                </button>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Fechar painel de detalhes">
                    <CloseIcon />
                </button>
            </div>
          </div>

          <div className="flex items-start space-x-4 mt-2">
             <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-700 ${pointTypeColors[point.type]}`}>
                   {point.customIcon ? (
                        <img src={point.customIcon} alt={point.name} className="w-full h-full object-cover rounded-lg" />
                   ) : (
                        <PointIcon type={point.type}/>
                   )}
                </div>
                {canModify && (
                    <button 
                        onClick={triggerFileSelect} 
                        className="absolute -bottom-2 -right-2 bg-slate-600 hover:bg-slate-500 text-white rounded-full p-1.5 border-2 border-slate-800 transition-transform hover:scale-110"
                        aria-label="Alterar ícone do ponto"
                    >
                        <EditIcon />
                    </button>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleIconChange}
                    className="hidden"
                    accept="image/*"
                    disabled={!canModify}
                />
             </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName && canModify ? (
                    <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={handleNameInputKey}
                        className="text-xl font-bold bg-slate-700 text-white rounded px-2 py-1 -ml-2 w-full"
                        autoFocus
                        aria-label="Editar nome do ponto"
                    />
                ) : (
                    <>
                        <h3 className="text-xl font-bold">{point.name}</h3>
                        {canModify && (
                          <button onClick={handleStartEditingName} className="text-slate-400 hover:text-white transition-colors flex-shrink-0" aria-label={`Editar nome de ${point.name}`}>
                              <EditIcon />
                          </button>
                        )}
                    </>
                )}
              </div>
              <p className={`text-sm font-semibold ${pointTypeColors[point.type]}`}>{pointTypeTranslations[point.type]}</p>
              <p className="text-slate-400 text-sm mt-1">{point.address}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-300">{point.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Avaliações</h3>
            {totalRatings > 0 ? (
              <div className="flex items-center gap-2 mb-2" aria-label={`Avaliação média de ${averageRating.toFixed(1)} de 5 estrelas, com ${totalRatings} avaliações.`}>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div key={i}>
                      <StarIcon filled={i < Math.round(averageRating)} />
                    </div>
                  ))}
                </div>
                <span className="text-slate-400" aria-hidden="true">{averageRating.toFixed(1)} de 5</span>
                <span className="text-slate-500" aria-hidden="true">({totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'})</span>
              </div>
            ) : (
              <p className="text-slate-400 mb-2">Este ponto ainda não foi avaliado.</p>
            )}

            {canRate && (
              <div>
                <p className="text-slate-300 font-semibold mb-1" id="rating-label">Sua avaliação:</p>
                <div 
                  className="flex"
                  onMouseLeave={() => setHoverRating(0)}
                  role="group"
                  aria-labelledby="rating-label"
                >
                  {[...Array(5)].map((_, i) => {
                    const ratingValue = i + 1;
                    return (
                      <button
                        key={i}
                        aria-label={`Avaliar com ${ratingValue} estrelas`}
                        onMouseEnter={() => setHoverRating(ratingValue)}
                        onClick={() => onRate(point.id, ratingValue)}
                        className="focus:outline-none appearance-none bg-transparent border-none p-0"
                      >
                        <StarIcon filled={ratingValue <= (hoverRating || userRating)} interactive />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default DetailsPanel;