import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/my-qrcodes');
      if (response.data.success) {
        setQrCodes(response.data.qrCodes);
      }
    } catch (error) {
      console.error('Failed to fetch QR codes:', error);
    }
    setLoading(false);
  };

//   const downloadQR = (qrCode, vehicleNumber) => {
//     const link = document.createElement('a');
//     link.href = qrCode;
//     link.download = `medical-emergency-${vehicleNumber}.png`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };


const downloadQR = (qrCodeData, vehicleNumber) => {
  const link = document.createElement('a');
  
  // Handle both data URL and base64 formats
  let downloadUrl = qrCodeData;
  if (!qrCodeData.startsWith('data:image')) {
    downloadUrl = `data:image/png;base64,${qrCodeData}`;
  }
  
  link.href = downloadUrl;
  link.download = `medical-emergency-${vehicleNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const deleteQR = async (qrId) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      try {
        console.log('Deleting QR code with ID:', qrId);
        await axios.delete(`http://localhost:5000/api/qrcode/${qrId}`);
        setQrCodes(qrCodes.filter(qr => qr._id !== qrId));
      } catch (error) {
        console.error('Failed to delete QR code:', error);
        alert('Failed to delete QR code');
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your QR codes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your medical emergency QR codes</p>
        </div>
        <div className="header-actions">
          {/* <Link to="/generate" className="btn-primary">
            + Create New QR Code
          </Link> */}
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="qr-codes-section">
          <h2>Your QR Codes ({qrCodes.length})</h2>
          
          {qrCodes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <h3>No QR Codes Yet</h3>
              <p>Create your first medical emergency QR code to get started</p>
              <Link to="/generate" className="btn-primary">
                Create Your First QR Code
              </Link>
            </div>
          ) : (
            <div className="qr-codes-grid">
              {qrCodes.map((qr) => (
                <div key={qr._id} className="qr-card">
                  <div className="qr-image">
                    {/* <img src={qr.qrCode} alt={`QR Code for ${qr.vehicleNumber}`} /> */}
                    <img src={`${qr.QRID}`} alt={`QR Code for ${qr.vehicleNumber}`} />
                  </div>
                  <div className="qr-details">
                    <h4>{qr.vehicleNumber}</h4>
                    <p><strong>Name:</strong> {qr.name}</p>
                    <p><strong>Emergency Contact:</strong> {qr.emergencyContact}</p>
                    <p><strong>Blood Type:</strong> {qr.bloodType || 'Not specified'}</p>
                    <p><strong>Created:</strong> {new Date(qr.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="qr-actions">
                    <button 
                      onClick={() => downloadQR(qr.QRID, qr.vehicleNumber)}
                      className="btn-download"
                    >
                      📥 Download
                    </button>
                    <button 
                      onClick={() => deleteQR(qr._id)}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-cards">
            <Link to="/generate" className="action-card">
              <div className="action-icon">➕</div>
              <h4>Create New QR</h4>
              <p>Generate a new medical emergency QR code</p>
            </Link>
            <Link to="/scanner" className="action-card">
              <div className="action-icon">📷</div>
              <h4>Scan QR Code</h4>
              <p>Scan existing medical QR codes</p>
            </Link>
            <div className="action-card">
              <div className="action-icon">👤</div>
              <h4>Profile</h4>
              <p>Manage your account settings</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;