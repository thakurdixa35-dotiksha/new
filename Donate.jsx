import { doc, setDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

export default function Donate() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amt, setAmt] = useState(0);

  // Load Razorpay script once (no logic change, just ensures window.Razorpay exists)
  useEffect(() => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = () => {
    const options = {
      key: "rzp_test_81R6461VPRt25N", // Razorpay Key ID
      amount: Number(amt) * 100, // Amount in paisa
      currency: "INR",
      name: "SAVIOUR",
      description: "Product or Service",
      handler: async function (response) {
        // Save payment ID to Firebase Firestore
        const ref = doc(db, "payments", response.razorpay_payment_id);
        await setDoc(ref, {
          paymentId: response.razorpay_payment_id,
          status: "success",
          amount: Number(amt),
          userId: sessionStorage.getItem("userId"),
          timestamp: Date.now(),
        });
        toast("Payment successful!");
      },
      prefill: {
        name: name || "Test User",
        email: email || "test@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#5ABFAB",
      },
    };

    if (!window.Razorpay) {
      toast.error("Payment SDK not loaded. Please try again in a moment.");
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const onFormSubmit = (e) => {
    // Prevent page reload that would interrupt Razorpay flow
    e.preventDefault();
    handlePayment();
  };

  return (
    <>
      <section className="donate-section">
        <div className="section-overlay" />
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-12 mx-auto">
              <form
                className="custom-form donate-form"
                action="#"
                method="get"
                role="form"
                onSubmit={onFormSubmit}
              >
                <h3 className="mb-4">Make a donation</h3>
                <div className="row">
                  <div className="col-lg-12 col-12">
                    <h5 className="mt-2 mb-3">Select an amount</h5>
                  </div>

                  <div className="col-lg-12 col-12 form-check-group">
                    <div className="input-group">
                      <span className="input-group-text" id="basic-addon1">
                        ₹
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Custom amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                        value={amt}
                        onChange={(e) => {
                          setAmt(e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-12">
                    <h5 className="mt-1">Personal Info</h5>
                  </div>
                  <div className="col-lg-6 col-12 mt-2">
                    <input
                      type="text"
                      name="donation-name"
                      id="donation-name"
                      className="form-control"
                      placeholder="Full Name"
                      required=""
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-lg-6 col-12 mt-2">
                    <input
                      type="email"
                      name="donation-email"
                      id="donation-email"
                      pattern="[^ @]*@[^ @]*"
                      className="form-control"
                      placeholder="Email"
                      required=""
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                    />
                  </div>

                  <div className="col-lg-12 col-12 mt-2">
                    {/* Keep your button label & flow the same. Submit triggers onFormSubmit */}
                    <button type="submit" className="form-control mt-4">
                      Submit Donation
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
