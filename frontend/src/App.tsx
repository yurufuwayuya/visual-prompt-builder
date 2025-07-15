import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/common/Toaster';
import { Home } from './pages/Home';
import { PromptBuilder } from './pages/PromptBuilder';
import { History } from './pages/History';
import { ImageToImage } from './pages/ImageToImage';
import { KeyboardShortcutsHelp } from './components/layout/KeyboardShortcutsHelp';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div
        className="min-h-screen bg-gray-50"
        role="application"
        aria-label="ビジュアルプロンプトビルダー"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<PromptBuilder />} />
          <Route path="/history" element={<History />} />
          <Route path="/i2i" element={<ImageToImage />} />
        </Routes>
        <Toaster />
        <KeyboardShortcutsHelp />
      </div>
    </Router>
  );
}

export default App;
