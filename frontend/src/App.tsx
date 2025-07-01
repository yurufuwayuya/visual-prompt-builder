import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/common/Toaster';
import { Home } from './pages/Home';
import { PromptBuilder } from './pages/PromptBuilder';
import { History } from './pages/History';
import { KeyboardShortcutsHelp } from './components/layout/KeyboardShortcutsHelp';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50" role="application" aria-label="ビジュアルプロンプトビルダー">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<PromptBuilder />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <Toaster />
        <KeyboardShortcutsHelp />
      </div>
    </Router>
  );
}

export default App;