import React, { useState, useCallback, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import Map from './components/Map';
import DetailsPanel from './components/DetailsPanel';
import AddPointForm from './components/AddPointForm';
import AuthForm from './components/AuthForm';
import * as geminiService from './services/geminiService';
import * as authService from './services/authService';
import { AccessibilityPoint, User, Rating } from './types';
import { PlusIcon, CloseIcon, AccessibilityIcon } from './components/icons/Icons';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [points, setPoints] = useState<AccessibilityPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<AccessibilityPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('Campinas');
  const [liveRegionMessage, setLiveRegionMessage] = useState('');

  // Estados de Acessibilidade
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);
  const accessibilityMenuRef = useRef<HTMLDivElement>(null);

  // State for adding new points
  const [isAddingPoint, setIsAddingPoint] = useState<boolean>(false);
  const [newPointCoords, setNewPointCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', isHighContrast);
    document.body.classList.toggle('large-text', isLargeText);
  }, [isHighContrast, isLargeText]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setLiveRegionMessage("Carregando pontos iniciais...");
      try {
        const initialPoints = await geminiService.getInitialPoints();
        setPoints(initialPoints);
        setLiveRegionMessage("Pontos iniciais carregados com sucesso.");
      } catch (e: any) {
        setError("Falha ao carregar dados iniciais.");
        setLiveRegionMessage("Erro ao carregar dados iniciais.");
        setPoints([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
    setError(null);
    setSelectedPoint(null);
    setLiveRegionMessage(`Buscando pontos de acessibilidade para ${query}...`);
    try {
      const fetchedPoints = await geminiService.fetchAccessibilityPoints(query);
      setPoints(fetchedPoints);
      if (fetchedPoints.length === 0) {
        setError("Nenhum ponto de acessibilidade encontrado para esta localização. Tente outra cidade.");
        setLiveRegionMessage(`Nenhum ponto encontrado para ${query}.`);
      } else {
        setLiveRegionMessage(`${fetchedPoints.length} pontos encontrados para ${query}.`);
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro desconhecido.");
      setLiveRegionMessage(`Erro ao buscar pontos para ${query}.`);
      setPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (username: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(username, pass);
      setCurrentUser(user);
    } catch(e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (username: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.register(username, pass);
      setCurrentUser(user); // Auto-login after register
    } catch(e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handlePointSelect = (point: AccessibilityPoint) => {
    setSelectedPoint(point);
    setIsAddingPoint(false);
    setNewPointCoords(null);
  };

  const handleClosePanel = () => setSelectedPoint(null);
  const handleStartAddingPoint = () => {
    setSelectedPoint(null);
    setIsAddingPoint(true);
  };
  const handleCancelAddPoint = () => {
    setIsAddingPoint(false);
    setNewPointCoords(null);
  };
  const handleMapClick = (coords: { lat: number, lng: number }) => {
    if (!isAddingPoint) return;
    setNewPointCoords(coords);
    setIsAddingPoint(false);
  };

  const handleSaveNewPoint = async (data: Omit<AccessibilityPoint, 'id' | 'position' | 'address' | 'creatorId'>) => {
    if (!newPointCoords || !currentUser) return;
    setIsLoading(true);
    try {
      const newPoint = await geminiService.saveNewAccessibilityPoint(data, newPointCoords, currentQuery, currentUser.id);
      setPoints(prevPoints => [...prevPoints, newPoint]);
      setNewPointCoords(null);
      handlePointSelect(newPoint);
      setLiveRegionMessage(`Novo ponto "${newPoint.name}" adicionado.`);
    } catch (e: any) {
      setError(e.message || "Falha ao salvar o ponto.");
      setLiveRegionMessage("Falha ao salvar o novo ponto.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIcon = async (id: string, iconDataUrl: string) => {
    const pointToUpdate = points.find(p => p.id === id);
    if (!pointToUpdate || !currentUser) return;
    const updatedPointData = { ...pointToUpdate, customIcon: iconDataUrl };
    setPoints(prev => prev.map(p => (p.id === id ? updatedPointData : p)));
    setSelectedPoint(updatedPointData);
    try {
        const finalUpdatedPoint = await geminiService.updateAccessibilityPoint(updatedPointData, currentQuery, currentUser.id);
        setPoints(prev => prev.map(p => (p.id === id ? finalUpdatedPoint : p)));
        setSelectedPoint(finalUpdatedPoint);
    } catch (e: any) {
        setError(e.message || "Falha ao atualizar o ícone.");
        setPoints(prev => prev.map(p => (p.id === id ? pointToUpdate : p)));
        setSelectedPoint(pointToUpdate);
    }
  };
  
  const handleRenamePoint = async (id: string, newName: string) => {
      const pointToUpdate = points.find(p => p.id === id);
      if (!pointToUpdate || pointToUpdate.name === newName || !currentUser) return;
      const updatedPointData = { ...pointToUpdate, name: newName };
      setPoints(prev => prev.map(p => p.id === id ? updatedPointData : p));
      setSelectedPoint(updatedPointData);
      try {
        const finalUpdatedPoint = await geminiService.updateAccessibilityPoint(updatedPointData, currentQuery, currentUser.id);
        setPoints(prev => prev.map(p => p.id === id ? finalUpdatedPoint : p));
        setSelectedPoint(finalUpdatedPoint);
      } catch (e: any) {
        setError(e.message || "Falha ao renomear o ponto.");
        setPoints(prev => prev.map(p => p.id === id ? pointToUpdate : p));
        setSelectedPoint(pointToUpdate);
      }
  };

  const handleRatePoint = async (id: string, value: number) => {
    if (!currentUser) return;
    
    const originalPoints = points;
    const pointToUpdate = points.find(p => p.id === id);
    if (!pointToUpdate) return;
    
    // Optimistic update
    const existingRatingIndex = pointToUpdate.ratings?.findIndex(r => r.userId === currentUser.id) ?? -1;
    let newRatings: Rating[];
    if (pointToUpdate.ratings) {
        newRatings = [...pointToUpdate.ratings];
        if (existingRatingIndex > -1) {
            newRatings[existingRatingIndex] = { userId: currentUser.id, value };
        } else {
            newRatings.push({ userId: currentUser.id, value });
        }
    } else {
        newRatings = [{ userId: currentUser.id, value }];
    }

    const updatedPointData = { ...pointToUpdate, ratings: newRatings };
    
    const newPoints = points.map(p => p.id === id ? updatedPointData : p);
    setPoints(newPoints);
    if (selectedPoint?.id === id) {
        setSelectedPoint(updatedPointData);
    }
    
    try {
        const finalUpdatedPoint = await geminiService.saveRatingForPoint(id, currentUser.id, value, currentQuery);
        setPoints(prev => prev.map(p => p.id === id ? finalUpdatedPoint : p));
        if (selectedPoint?.id === id) {
            setSelectedPoint(finalUpdatedPoint);
        }
    } catch (e: any) {
        setError(e.message || "Falha ao salvar a avaliação.");
        setPoints(originalPoints);
        if (selectedPoint?.id === id) {
            setSelectedPoint(originalPoints.find(p => p.id === id) || null);
        }
    }
  };

  const handleSpeakDetails = (text: string) => {
    window.speechSynthesis.cancel(); // Cancela falas anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accessibilityMenuRef.current && !accessibilityMenuRef.current.contains(event.target as Node)) {
        setIsAccessibilityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <AuthForm 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        isLoading={isLoading} 
        error={error}
        setError={setError}
      />
    );
  }

  return (
    <main className="h-screen w-screen bg-slate-900 text-white font-sans overflow-hidden flex flex-col">
       <div aria-live="polite" className="sr-only">
        {liveRegionMessage}
      </div>

      <header className="relative z-30 flex justify-between items-center p-4 bg-slate-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative" ref={accessibilityMenuRef}>
            <button 
              onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)} 
              className="text-white hover:text-cyan-400 transition-colors"
              aria-label="Opções de acessibilidade"
              aria-haspopup="true"
              aria-expanded={isAccessibilityMenuOpen}
            >
              <AccessibilityIcon />
            </button>
            {isAccessibilityMenuOpen && (
              <div className="absolute top-full mt-2 w-48 bg-slate-700 rounded-lg shadow-lg p-2">
                <label className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                  <input type="checkbox" checked={isHighContrast} onChange={() => setIsHighContrast(!isHighContrast)} className="h-4 w-4" />
                  Alto Contraste
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                  <input type="checkbox" checked={isLargeText} onChange={() => setIsLargeText(!isLargeText)} className="h-4 w-4" />
                  Aumentar Fonte
                </label>
              </div>
            )}
          </div>
           <div className="text-white">
            Logado como: <span className="font-bold text-cyan-400">{currentUser.username}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-full transition-colors text-sm">
          Sair
        </button>
      </header>

      <div id="main-content" className="relative flex-grow">
        <Map
          points={points}
          selectedPoint={selectedPoint}
          onPointSelect={handlePointSelect}
          isAddingPoint={isAddingPoint}
          onMapClick={handleMapClick}
        />
        
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {isAddingPoint && (
          <div className="absolute top-40 sm:top-36 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-slate-800/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg z-20 flex items-center justify-between animate-fade-in">
            <p>Clique no mapa para adicionar o ponto.</p>
            <button onClick={handleCancelAddPoint} className="text-slate-400 hover:text-white" aria-label="Cancelar adição de ponto">
                <CloseIcon />
            </button>
          </div>
        )}

        {!isAddingPoint && !newPointCoords && !selectedPoint && (
          <button
            onClick={handleStartAddingPoint}
            className="absolute bottom-8 right-8 z-20 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 animate-fade-in"
            aria-label="Adicionar novo ponto de acessibilidade"
          >
            <PlusIcon />
          </button>
        )}

        {newPointCoords && (
          <AddPointForm
            onSave={handleSaveNewPoint}
            onCancel={handleCancelAddPoint}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-40" aria-label="Processando sua solicitação">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg font-semibold">Processando...</p>
            </div>
          </div>
        )}
        
        {error && !isLoading && (
             <div role="alert" className="absolute top-40 sm:top-36 left-1/2 -translate-x-1/2 bg-red-500/90 text-white p-4 rounded-lg shadow-lg z-20 animate-fade-in">
                <p>{error}</p>
            </div>
        )}

        <DetailsPanel 
            point={selectedPoint} 
            currentUser={currentUser}
            onClose={handleClosePanel} 
            onUpdateIcon={handleUpdateIcon}
            onRename={handleRenamePoint}
            onRate={handleRatePoint}
            onSpeak={handleSpeakDetails}
        />
      </div>
    </main>
  );
};