import React, { useState } from 'react';
import axios from 'axios';
import './QRGenerator.css';

const QRGenerator = () => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        vehicleNumber: "",
        emergencyContact: "",
        bloodType: "",
        medicalConditions: "",
        medications: "",
        allergies: "",
    });
    const [qrCode, setQrCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(
                "http://localhost:5000/api/generate",
                formData
            );
            setQrCode(response.data.qrCode);
            setSuccess(true);
        } catch (error) {
            console.error("Error generating QR code:", error);
            alert("Error generating QR code. Please try again.");
        }
        setLoading(false);
    };

    const downloadQR = () => {
        const link = document.createElement('a');
        link.href = `${qrCode}`;
        link.download = `medical-emergency-qr-${formData.vehicleNumber || 'vehicle'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="qr-generator-content">
            {!success ? (
                <form onSubmit={handleSubmit} className="qr-form">
                    <h2>Enter Your Information</h2>

                    <div className="form-group">
                        <label>Vehicle Number *</label>
                        <input
                            type="text"
                            name="vehicleNumber"
                            value={formData.vehicleNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g., KA01AB1234"
                        />
                    </div>

                    <div className="form-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number (including +91) *</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Address *</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Emergency Contact (including +91)  *</label>
                        <input
                            type="text"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Blood Group *</label>
                        <select
                            name="bloodType"
                            value={formData.bloodType}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            required
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Medical Conditions</label>
                        <textarea
                            name="medicalConditions"
                            value={formData.medicalConditions}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Medications</label>
                        <textarea
                            name="medications"
                            value={formData.medications}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Allergies</label>
                        <textarea
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Generating QR Code..." : "Generate QR Code"}
                    </button>
                </form>
            ) : (
                <div className="qr-result">
                    <h2>Your Medical Emergency QR Code</h2>
                    <p>
                        Print this QR code and place it in your vehicle for emergency
                        situations.
                    </p>

                    <div className="qr-container">
                        <img
                            src={`${qrCode}`}
                            // src={`data:image/png,${qrCode}`}
                            alt="Medical QR Code"
                        />
                    </div>
                    <div className="action-buttons">
                        <button onClick={downloadQR} className="download-button">
                            📥 Download QR Code
                        </button>

                        <button onClick={() => setSuccess(false)} className="secondary-button">
                            ➕ Create Another QR Code
                        </button>
                    </div>
                    <div className="instructions">
                        <h3>Instructions:</h3>
                        <ul>
                            <li>
                                Print this QR code and place it on your vehicle's dashboard or
                                windshield
                            </li>
                            <li>
                                In case of emergency, medical personnel can scan this code
                            </li>
                            <li>
                                Only essential information will be revealed to protect your
                                privacy
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRGenerator;