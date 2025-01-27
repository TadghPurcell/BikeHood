import React from 'react';
import Header from '../components/Header'; 
import Twin from '../components/Twin'; 

const TwinPage = () => {
  return (
    <>
      {/* Header Component */}
      <Header />

      {/* Twin Component */}
      <div style={{ height: 'calc(100vh - 60px)' }}>
        <Twin />
      </div>
    </>
  );
};

export default TwinPage;
