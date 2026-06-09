import React, { useState, useRef } from "react";
import axios from "axios";
import jsQR from "jsqr";
import "./Scanner.css";

const Scanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");

  const handleSendEmergencyMessage = async () => {
    if (!scannedData || !scannedData.vehicleNumber) {
      alert("Vehicle information not available");
      return;
    }

    setSendingMessage(true);
    setMessageStatus("");

    try {
      // Get auth token from localStorage (assuming you store it there)
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please log in to send emergency messages");
        setSendingMessage(false);
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/emergency-message/${scannedData.vehicleNumber}`,
        {}, // empty body since we get data from URL params and auth
        {
          // headers: {
          //   Authorization: `Bearer ${token}`,
          // },
        }
      );

      if (response.data.success) {
        setMessageStatus("success");
        alert(
          "✅ Emergency message sent successfully! The emergency contact has been notified with your details."
        );

        // Reset status after 5 seconds
        setTimeout(() => setMessageStatus(""), 5000);
      } else {
        setMessageStatus("error");
        alert("❌ Failed to send emergency message: " + response.data.error);
      }
    } catch (error) {
      console.error("Emergency message error:", error);
      setMessageStatus("error");

      if (error.response && error.response.status === 401) {
        alert("🔐 Please log in to send emergency messages");
      } else if (error.response && error.response.data) {
        alert("❌ " + error.response.data.error);
      } else {
        alert("❌ Network error. Please check your connection and try again.");
      }
    }

    setSendingMessage(false);
  };

  //old part
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      analyzeQRCode(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeQRCode = (imageSrc) => {
    setLoading(true);
    setError("");

    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw image on canvas
      ctx.drawImage(image, 0, 0, image.width, image.height);

      // Get image data for QR code scanning
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height);


      if (code) {
        try {
          const qrData = JSON.parse(code.data);
          console.log("Scanned QR Data:", qrData);
          if (qrData.type === "medical-emergency" && qrData.id) {
            // If QR contains vehicleNumber, use it for search, otherwise use ID
            if (qrData.vehicleNumber) {
              fetchUserByVehicle(qrData.vehicleNumber);
            } else {
              fetchUserData(qrData.id);
            }
          } else {
            setError("Invalid QR code format.");
            setLoading(false);
          }
        } catch (parseError) {
          setError("Failed to read QR code data.");
          setLoading(false);
        }
      } else {
        setError("No QR code found in the image.");
        setLoading(false);
      }
    };

    image.onerror = () => {
      setError("Failed to load image. Please try again.");
      setLoading(false);
    };

    image.src = imageSrc;
  };

  const fetchUserData = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/user/${userId}`
      );
      setScannedData(response.data);
      setError("");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("User not found. This QR code may be expired or invalid.");
      } else {
        setError(
          "Failed to fetch user data. Please check your connection and try again."
        );
      }
      console.error("Error fetching user data:", err);
    }
    setLoading(false);
  };

  const fetchUserByVehicle = async (vehicleNumber) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/vehicle/${vehicleNumber}`
      );
      setScannedData(response.data);
      setError("");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("Vehicle not found. This QR code may be expired or invalid.");
      } else {
        setError("Failed to fetch vehicle data. Please check your connection.");
      }
      console.error("Error fetching vehicle data:", err);
    }
    setLoading(false);
  };


  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const searchTerm = e.target.manualId.value.trim();
    console.log("Manual search term:", searchTerm);

    if (!searchTerm) {
      setError("Please enter a User ID or Vehicle Number");
      return;
    }

    setLoading(true);

    // Check if search term looks like a vehicle number (contains letters and numbers)
    if (/[a-zA-Z]/.test(searchTerm) && /\d/.test(searchTerm)) {
      // Likely a vehicle number
      await fetchUserByVehicle(searchTerm);
    } else {
      // Assume it's a user ID
      await fetchUserData(searchTerm);
    }
  };


  const resetScanner = () => {
    setScannedData(null);
    setImagePreview("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <h1>Medical Emergency QR Code Scanner</h1>
        <p>Scan a QR code to access emergency medical information</p>
      </header>

      <div className="scanner-content">
        {!scannedData ? (
          <div className="scan-section">
            <div className="upload-section">
              <h2>Upload QR Code Image</h2>
              <p>Take a picture of the QR code or select an image file</p>

              <div className="file-upload-area" onClick={triggerFileInput}>
                <div className="upload-placeholder">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="QR Code Preview"
                      className="image-preview"
                    />
                  ) : (
                    <>
                      <div className="upload-icon">📷</div>
                      <p>Click to select QR code image</p>
                      <small>Supported formats: JPG, PNG, GIF</small>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>

              <button
                type="button"
                onClick={triggerFileInput}
                className="upload-button"
              >
                Choose Different Image
              </button>
            </div>

            <div className="manual-section">
              <h3>Or Enter ID Manually</h3>
              <form onSubmit={handleManualSubmit} className="id-form">
                <input
                  type="text"
                  name="manualId"
                  placeholder="Enter user ID manually"
                  className="manual-input"
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Get Information"}
                </button>
              </form>
            </div>

            {loading && (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Analyzing QR code...</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="info-section">
            <div className="info-header">
              <h2>Emergency Medical Information</h2>
              <p>Accessed via QR Code Scan</p>
            </div>

            <div className="info-group">
              <label>Vehicle Number:</label>
              <span className="info-value">{scannedData.vehicleNumber}</span>
            </div>

            <div className="info-card">
              <div className="info-group">
                <label>Name:</label>
                <span className="info-value">{scannedData.name}</span>
              </div>

              <div className="info-group">
                <label>Phone:</label>
                <span className="info-value masked">{scannedData.phone}</span>
                {/* <small className="privacy-note">(Privacy Protected)</small> */}
              </div>

              <div className="info-group">
                <label>City:</label>
                <span className="info-value">{scannedData.city}</span>
              </div>

              <div className="info-group">
                <label>Emergency Contact:</label>
                <span className="info-value masked">
                  {scannedData.emergencyContact}
                </span>
              </div>

              {scannedData.bloodType && (
                <div className="info-group">
                  <label>Blood Group:</label>
                  <span className="info-value medical-info">
                    {scannedData.bloodType}
                  </span>
                </div>
              )}

              {scannedData.medicalConditions && (
                <div className="info-group">
                  <label>Medical Conditions:</label>
                  <span className="info-value medical-info">
                    {scannedData.medicalConditions}
                  </span>
                </div>
              )}

              {scannedData.medications && (
                <div className="info-group">
                  <label>Medications:</label>
                  <span className="info-value medical-info">
                    {scannedData.medications}
                  </span>
                </div>
              )}

              {scannedData.allergies && (
                <div className="info-group">
                  <label>Allergies:</label>
                  <span className="info-value medical-info">
                    {scannedData.allergies}
                  </span>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                onClick={handleSendEmergencyMessage}
                disabled={sendingMessage || !scannedData}
                className="message-button"
              >
                {sendingMessage ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Sending Emergency Alert...
                  </>
                ) : (
                  "🚨 Send Emergency Alert"
                )}
              </button>

              <button onClick={resetScanner} className="secondary-button">
                🔄 Scan Another Code
              </button>
            </div>

            <div className="privacy-notice">
              <h4>Privacy Notice</h4>
              <p>
                Personal information is protected. Phone numbers are masked and
                only essential medical information is displayed to protect the
                individual's privacy.
              </p>
            </div>
          </div>
        )}

        {messageStatus === "success" && (
          <div className="message-success">
            ✅ Emergency alert sent successfully! The contact has been notified.
          </div>
        )}

        {messageStatus === "error" && (
          <div className="message-error">
            ❌ Failed to send emergency alert. Please try again.
          </div>
        )}
        {/* Hidden canvas for QR code analysis */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default Scanner;
