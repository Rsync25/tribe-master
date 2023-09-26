
import Header from './Header'
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import './Layout.css'

const Layout = () => {

  return (
    <div className='layout'>
      <Header />
      <Outlet className='outlet'/>
      <Footer />
    </div>
  )
};

export default Layout;
