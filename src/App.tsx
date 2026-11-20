import { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import QuickParamBar from './components/QuickParamBar';
import BreakdownView from './components/BreakdownView';
import EstimatorView from './components/EstimatorView';
import ComparisonMode from './components/ComparisonMode';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import HistoryModal from './components/HistoryModal';
import SaveModal from './components/SaveModal';
import BottomNav from './components/BottomNav';
import OfflineIndicator from './components/OfflineIndicator';
import { useSettings } from './hooks/useSettings';
import { useGoldPrice } from './hooks/useGoldPrice';
import { useHistory, HistoryInput, HistoryResult, HistoryItem } from './hooks/useHistory';
import { useMobileKeyboard } from './hooks/useMobileKeyboard';
import { recordVisitor } from './utils/analytics';
import { triggerSaveAnimation } from './utils/animations';

function App() {
  const { settings, updateSettings } = useSettings();
  const { price, loading, lastUpdated, isCached, refresh } = useGoldPrice(settings.currency, settings.karat);
  const { history, saveCalculation, deleteCalculation, clearHistory, renameCalculation } = useHistory();
  const isKeyboardOpen = useMobileKeyboard();

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

  const [sharedInputs, setSharedInputs] = useState({ goldPrice: 0, itemPrice: 0, weight: 0, makingPerGram: 0, stoneWeight: 0 });
  const lastAutoLivePriceRef = useRef<number>(0);

  // State to trigger price updates in child components
  const [livePriceTrigger, setLivePriceTrigger] = useState<((price: string) => void) | null>(null);

  // Keep shared goldPrice synced automatically whenever livePrice updates (e.g. Karat/Currency change),
  // unless the user manually typed a custom spot price
  useEffect(() => {
    if (price <= 0) return;
    const roundedPrice = Math.ceil(price * 100) / 100;
    setSharedInputs(prev => {
      if (prev.goldPrice === 0 || prev.goldPrice === lastAutoLivePriceRef.current) {
        lastAutoLivePriceRef.current = roundedPrice;
        return { ...prev, goldPrice: roundedPrice };
      }
      return prev;
    });
  }, [price]);

  const handleUseLivePrice = () => {
    if (price > 0) {
      const roundedPrice = Math.ceil(price * 100) / 100;
      lastAutoLivePriceRef.current = roundedPrice;
      setSharedInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
      if (livePriceTrigger) {
        livePriceTrigger(roundedPrice.toFixed(2));
      }
    }
  };

  const handleSyncLivePrice = async () => {
    lastAutoLivePriceRef.current = sharedInputs.goldPrice;
    handleUseLivePrice();
    await refresh();
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

      <QuickParamBar
        settings={settings}
        updateSettings={updateSettings}
        livePrice={price}
        loading={loading}
        lastUpdated={lastUpdated}
        isCached={isCached}
        onSyncLivePrice={handleSyncLivePrice}
      />

      <div className="glass-panel rounded-3xl overflow-hidden flex flex-col animate-fade-in shadow-xl">
        {activeTab === 'breakdown' ? (
          <BreakdownView
            settings={settings}
            updateSettings={updateSettings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
            sharedInputs={sharedInputs}
            setSharedInputs={setSharedInputs}
          />
        ) : activeTab === 'estimator' ? (
          <EstimatorView
            settings={settings}
            updateSettings={updateSettings}
            livePrice={price}
            setLivePriceTrigger={setLivePriceTrigger}
            onSave={handleSave}
            restoredData={restoredData}
            sharedInputs={sharedInputs}
            setSharedInputs={setSharedInputs}
          />
        ) : (
          <ComparisonMode
            settings={settings}
            goldPrice={sharedInputs.goldPrice > 0 ? sharedInputs.goldPrice : price}
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

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        language={settings.language}
        isKeyboardOpen={isKeyboardOpen}
      />

      <OfflineIndicator language={settings.language} />
    </Layout>
  );
}

export default App;
