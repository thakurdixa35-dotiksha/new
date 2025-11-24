import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../Firebase";
import { RingLoader } from "react-spinners";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentMethod = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [donationAmount, setDonationAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });
  const [causeInfo, setCauseInfo] = useState(null);

  useEffect(() => {
    if (location.state) {
      setCauseInfo(location.state);
      setDonationAmount(location.state.amount || '');
    }
  }, [location]);

  const paymentMethods = [
    { id: 'razorpay', name: 'Razorpay', description: 'Secure payment gateway with credit/debit cards, UPI, and wallets', icon: 'https://razorpay.com/favicon.ico', fields: ['upiId'] },
    { id: 'bank-transfer', name: 'Direct Bank Transfer', description: 'Transfer directly to our bank account', icon: 'https://cdn-icons-png.flaticon.com/512/2489/2489138.png', fields: ['accountNumber', 'ifscCode', 'accountHolderName'] },
    { id: 'paypal', name: 'PayPal', description: 'International donations via PayPal', icon: 'https://www.paypalobjects.com/webstatic/icon/pp32.png', fields: [] },
    { id: 'upi', name: 'UPI Payment', description: 'Instant payment via any UPI app', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png', fields: ['upiId'] },
    { id: 'card', name: 'Credit/Debit Card', description: 'Pay with Visa, Mastercard, or other cards', icon: 'https://cdn-icons-png.flaticon.com/512/196/196578.png', fields: ['cardNumber', 'cardExpiry', 'cardCvv', 'cardName'] }
  ];

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setDonationAmount(value);
  };

  const handleMethodSelect = (methodId) => setSelectedMethod(methodId);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const amountNum = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid donation amount greater than 0");
      return false;
    }
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return false;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required personal information");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (method) {
      for (const field of method.fields) {
        if (!formData[field]) {
          toast.error(`Please fill in all required ${method.name} details`);
          return false;
        }
      }
    }
    return true;
  };

  const savePaymentData = async () => {
    try {
      const amountNum = parseFloat(donationAmount);
      const normalizedCauseId = (causeInfo?.causeId || "").trim();
      const normalizedCauseTitle = (causeInfo?.causeTitle || "").trim();

      const paymentData = {
        amount: amountNum,
        currency: 'INR',
        method: selectedMethod,
        donorName: formData.name,
        donorEmail: formData.email,
        donorPhone: formData.phone,
        status: 'completed',
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString(),
        ...(normalizedCauseId && { causeId: normalizedCauseId }),
        ...(normalizedCauseTitle && { causeTitle: normalizedCauseTitle })
      };

      const donationRef = await addDoc(collection(db, "donations"), paymentData);

      if (normalizedCauseId && !Number.isNaN(amountNum) && amountNum > 0) {
        const statRef = doc(db, "causeStats", normalizedCauseId);
        try {
          await setDoc(
            statRef,
            {
              totalRaised: increment(amountNum),
              updatedAt: serverTimestamp(),
              causeTitle: normalizedCauseTitle || null,
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("causeStats write skipped:", e?.message);
        }
      }

      try {
        await addDoc(collection(db, "donationRecords"), {
          ...paymentData,
          donationId: donationRef.id,
          processedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Optional donationRecords write skipped:", err?.message);
      }

      toast.success("Donation submitted successfully!");
      return true;
    } catch (err) {
      console.error("Error adding donation: ", err);
      toast.error("Failed to save donation: " + err.message);
      return false;
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const success = await savePaymentData();
      if (success) {
        setDonationAmount('');
        setSelectedMethod(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          upiId: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          cardNumber: '',
          cardExpiry: '',
          cardCvv: '',
          cardName: ''
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Donation processing error:", error);
      toast.error("Donation failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMethodFields = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return null;
    return (
      <div style={styles.methodFieldsContainer}>
        <h4 style={styles.methodFieldsTitle}>{method.name} Details</h4>

        {method.fields.includes('upiId') && (
          <div style={styles.inputGroup}>
            <label htmlFor="upiId" style={styles.label}>UPI ID</label>
            <input
              type="text"
              id="upiId"
              name="upiId"
              value={formData.upiId}
              onChange={handleInputChange}
              placeholder="yourname@upi"
              style={styles.input}
              required
            />
          </div>
        )}

        {method.fields.includes('accountNumber') && (
          <>
            <div style={styles.inputGroup}>
              <label htmlFor="accountNumber" style={styles.label}>Account Number</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="1234567890"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="ifscCode" style={styles.label}>IFSC Code</label>
              <input
                type="text"
                id="ifscCode"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="ABCD0123456"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="accountHolderName" style={styles.label}>Account Holder Name</label>
              <input
                type="text"
                id="accountHolderName"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="As per bank records"
                style={styles.input}
                required
              />
            </div>
          </>
        )}

        {method.fields.includes('cardNumber') && (
          <>
            <div style={styles.inputGroup}>
              <label htmlFor="cardNumber" style={styles.label}>Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="4242 4242 4242 4242"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.cardDetails}>
              <div style={{ ...styles.inputGroup, flex: 2 }}>
                <label htmlFor="cardExpiry" style={styles.label}>Expiry Date</label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1, marginLeft: '1rem' }}>
                <label htmlFor="cardCvv" style={styles.label}>CVV</label>
                <input
                  type="text"
                  id="cardCvv"
                  name="cardCvv"
                  value={formData.cardCvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="cardName" style={styles.label}>Name on Card</label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                placeholder="As on card"
                style={styles.input}
                required
              />
            </div>
          </>
        )}

        {method.id === 'paypal' && (
          <div style={styles.paypalNote}>
            <p>You will be redirected to PayPal to complete your donation</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Make a Donation</h2>
      <p style={styles.subHeading}>Your contribution makes a difference</p>

      {causeInfo && (
        <div style={styles.causeInfo}>
          <h3>{causeInfo.causeTitle}</h3>
          <p>Donation Amount: ₹{donationAmount}</p>
        </div>
      )}

      {isProcessing ? (
        <div style={styles.loaderContainer}>
          <RingLoader color="#4CAF50" size={60} />
          <p style={styles.loadingText}>Processing your donation...</p>
        </div>
      ) : (
        <form onSubmit={handleDonationSubmit} style={styles.form}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Your Information</h3>
            <div style={styles.inputGroup}>
              <label htmlFor="name" style={styles.label}>Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="phone" style={styles.label}>Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" style={styles.input} required />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Donation Amount</h3>
            <div style={styles.inputGroup}>
              <label htmlFor="amount" style={styles.label}>Amount (₹)</label>
              <input type="text" id="amount" value={donationAmount} onChange={handleAmountChange} placeholder="Enter amount" style={styles.input} required />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Select Payment Method</h3>
            <div style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  style={{
                    ...styles.methodCard,
                    borderColor: selectedMethod === method.id ? "#4CAF50" : "#e0e0e0",
                    backgroundColor: selectedMethod === method.id ? "#f0fff0" : "white",
                  }}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <img src={method.icon} alt={method.name} style={styles.methodIcon} />
                  <div style={styles.methodInfo}>
                    <h4 style={styles.methodName}>{method.name}</h4>
                    <p style={styles.methodDesc}>{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div style={styles.selectedBadge}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedMethod && renderMethodFields()}

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              backgroundColor: !donationAmount || !selectedMethod ? "#cccccc" : "#4CAF50",
              cursor: !donationAmount || !selectedMethod ? "not-allowed" : "pointer",
            }}
            disabled={!donationAmount || !selectedMethod || isProcessing}
          >
            {`Donate ₹${donationAmount || "0"}`}
          </button>
        </form>
      )}

      <div style={styles.securityNote}>
        <div style={styles.lockIcon}>🔒</div>
        <p>All transactions are secure and encrypted</p>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "800px", margin: "2rem auto", padding: "2rem", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: "#ffffff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
  heading: { color: "#2c3e50", textAlign: "center", marginBottom: "0.5rem", fontSize: "1.8rem" },
  subHeading: { color: "#7f8c8d", textAlign: "center", marginTop: "0", marginBottom: "2rem", fontSize: "1.1rem" },
  causeInfo: { backgroundColor: "#f0f7f0", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "2rem" },
  section: { backgroundColor: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)" },
  sectionTitle: { color: "#2c3e50", marginTop: "0", marginBottom: "1rem", fontSize: "1.2rem" },
  inputGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#34495e", fontSize: "0.9rem" },
  input: { width: "100%", padding: "12px", fontSize: "16px", border: "1px solid #ddd", borderRadius: "6px", outline: "none", transition: "border 0.3s", boxSizing: "border-box" },
  methodsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" },
  methodCard: { display: "flex", alignItems: "center", padding: "1rem", border: "2px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease", position: "relative" },
  methodIcon: { width: "40px", height: "40px", objectFit: "contain", marginRight: "1rem" },
  methodInfo: { flex: 1 },
  methodName: { margin: "0", color: "#2c3e50", fontSize: "16px" },
  methodDesc: { margin: "0.25rem 0 0", color: "#7f8c8d", fontSize: "14px" },
  selectedBadge: { position: "absolute", top: "-10px", right: "-10px", backgroundColor: "#4CAF50", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" },
  methodFieldsContainer: { backgroundColor: "#f0f7ff", padding: "1.5rem", borderRadius: "8px", marginTop: "-1rem" },
  methodFieldsTitle: { color: "#2c3e50", marginTop: "0", marginBottom: "1rem" },
  cardDetails: { display: "flex", gap: "1rem" },
  paypalNote: { backgroundColor: "#fff9e6", padding: "1rem", borderRadius: "6px", textAlign: "center", color: "#8e6c00" },
  submitButton: { padding: "14px", fontSize: "16px", fontWeight: "600", color: "white", border: "none", borderRadius: "6px" },
  securityNote: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem", color: "#7f8c8d", fontSize: "14px" },
  lockIcon: { fontSize: "16px" },
  loaderContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" },
  loadingText: { marginTop: "1rem", color: "#4CAF50", fontSize: "1.1rem" },
};

export default PaymentMethod;
