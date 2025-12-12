import React, { useState } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import Controls from './components/Controls';
import BreakdownView from './components/BreakdownView';
import EstimatorView from './components/EstimatorView';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import HistoryModal from './components/HistoryModal';
import SaveModal from './components/SaveModal';
import { useSettings } from './hooks/useSettings';
import { useGoldPrice } from './hooks/useGoldPrice';
import { useHistory } from './hooks/useHistory';

function App() {
  const { settings, updateSettings } = useSettings();
  const { price, loading, lastUpdated, refresh } = useGoldPrice(settings.currency, settings.karat);
  const { history, saveCalculation, deleteCalculation, clearHistory, renameCalculation } = useHistory();

  const [activeTab, setActiveTab] = useState('breakdown');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [restoredData, setRestoredData] = useState(null);

  // State to trigger price updates in child components
  const [livePriceTrigger, setLivePriceTrigger] = useState(null);

  const handleUseLivePrice = () => {
    if (price > 0 && livePriceTrigger) {
      livePriceTrigger(price.toFixed(2));
    }
  };

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' });
  };

  const handleSave = (type, inputs, results) => {
    setPendingSave({ type, inputs, results });
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = (name) => {
    if (pendingSave) {
      saveCalculation(
        pendingSave.type,
        pendingSave.inputs,
        pendingSave.results,
        settings.currency,
        name
      );
      setPendingSave(null);
    }
  };

  const handleRestore = (item) => {
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
      />

      <Controls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onToggleLanguage={toggleLanguage}
        language={settings.language}
      />

      <div className="glass-panel rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
        {activeTab === 'breakdown' ? (
          <BreakdownView
            settings={settings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
          />
        ) : (
          <EstimatorView
            settings={settings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
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
