import { useState } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import BreakdownView from './components/BreakdownView';
import EstimatorView from './components/EstimatorView';
import ComparisonMode from './components/ComparisonMode';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import HistoryModal from './components/HistoryModal';
import SaveModal from './components/SaveModal';
import { useSettings } from './hooks/useSettings';
import { useGoldPrice } from './hooks/useGoldPrice';
import { useHistory } from './hooks/useHistory';
import { recordVisitor } from './utils/analytics';

import { triggerSaveAnimation } from './utils/animations';

import { HistoryInput, HistoryResult, HistoryItem } from './hooks/useHistory';
import { useEffect } from 'react';

function App() {
  const { settings, updateSettings } = useSettings();
  const { price, loading, lastUpdated } = useGoldPrice(settings.currency, settings.karat);
  const { history, saveCalculation, deleteCalculation, clearHistory, renameCalculation } = useHistory();

  useEffect(() => {
    recordVisitor();
  }, []);

  const [activeTab, setActiveTab] = useState('breakdown');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  interface PendingSave {
    type: 'breakdown' | 'estimator';
    inputs: HistoryInput;
    results: HistoryResult;
  }

  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [restoredData, setRestoredData] = useState<HistoryItem | null>(null);

  // State to trigger price updates in child components
  const [livePriceTrigger, setLivePriceTrigger] = useState<((price: string) => void) | null>(null);

  const handleUseLivePrice = () => {
    if (price > 0 && livePriceTrigger) {
      livePriceTrigger(price.toFixed(2));
    }
  };

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' });
  };

  const handleSave = (type: 'breakdown' | 'estimator', inputs: HistoryInput, results: HistoryResult) => {
    setPendingSave({ type, inputs, results });
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = (name: string) => {
    if (pendingSave) {
      saveCalculation(
        pendingSave.type,
        pendingSave.inputs,
        pendingSave.results,
        settings.currency,
        name
      );
      setPendingSave(null);

      // Trigger the "flying to history" animation
      // Find the confirm button position or use center of screen
      const confirmBtn = document.querySelector('[data-save-confirm]');
      if (confirmBtn) {
        const rect = confirmBtn.getBoundingClientRect();
        triggerSaveAnimation(rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else {
        triggerSaveAnimation(window.innerWidth / 2, window.innerHeight / 2);
      }
    }
  };

  const handleRestore = (item: HistoryItem) => {
    setActiveTab(item.type);
    setRestoredData(item);
  };

  return (
    <Layout>
      <Header
        settings={settings}
        livePrice={price}
        lastUpdated={lastUpdated}
        onUseLivePrice={handleUseLivePrice}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onToggleLanguage={toggleLanguage}
        updateSettings={updateSettings}
        historyCount={history.length}
      />

      <div className="glass-panel rounded-3xl overflow-hidden min-h-[520px] lg:min-h-[500px] flex flex-col animate-fade-in shadow-xl">
        {activeTab === 'breakdown' ? (
          <BreakdownView
            settings={settings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
          />
        ) : activeTab === 'estimator' ? (
          <EstimatorView
            settings={settings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
          />
        ) : (
          <ComparisonMode
            settings={settings}
            goldPrice={price}
          />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        language={settings.language}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDelete={deleteCalculation}
        onClear={clearHistory}
        onRestore={handleRestore}
        onRename={renameCalculation}
        language={settings.language}
      />

      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleConfirmSave}
        language={settings.language}
      />
    </Layout>
  );
}

export default App;
