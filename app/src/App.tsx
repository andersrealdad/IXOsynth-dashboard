import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Library from '@/pages/Library';
import ThreeDView from '@/pages/ThreeDView';
import VantagePro from '@/pages/VantagePro';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/3d" element={<ThreeDView />} />
          <Route path="/vantage" element={<VantagePro />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
