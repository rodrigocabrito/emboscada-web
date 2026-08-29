import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

// Shell for the staff portal (the authenticated app). The Navbar lives here so
// it only ever appears on app routes — the public marketing site never shows
// staff navigation, even for a logged-in admin browsing the public pages.
const AppLayout = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Outlet />
    </>
  );
};

export default AppLayout;
