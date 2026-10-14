import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Packages from './pages/Packages.jsx';
import TourPage from './pages/TourPage.jsx';
import Register from './pages/Register.jsx';
import { BlogList, BlogPost } from './pages/Blog.jsx';
import Admin from './pages/admin/Admin.jsx';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/package" element={<Packages />} />
          <Route path="/tour/:slug" element={<TourPage />} />
          <Route path="/register/:slug" element={<Register />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}
