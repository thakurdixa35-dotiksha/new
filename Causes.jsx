import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../Firebase";

export default function Causes() {
  const [load, setLoad] = useState(true);
  const [category, setCategory] = useState([]);
  const [donationAmounts, setDonationAmounts] = useState({});
  const [totalDonations, setTotalDonations] = useState({});

  const causesData = [
    {
      id: "education",
      title: "Children Education",
      description:
        "Support children's education by providing books, uniforms, and tuition aid",
      targetAmount: 20000,
      image: "/assets/images/causes/group-african-kids-paying-attention-class.jpg",
    },
    {
      id: "poverty",
      title: "Poverty Development",
      description:
        "Fund skill development and livelihood programs for underprivileged communities",
      targetAmount: 15000,
      image: "/assets/images/causes/poor-child-landfill-looks-forward-with-hope.jpg",
    },
    {
      id: "water",
      title: "Supply Drinking Water",
      description: "Provide clean and safe drinking water to communities in need",
      targetAmount: 25000,
      image: "/assets/images/causes/african-woman-pouring-water-recipient-outdoors.jpg",
    },
  ];

  useEffect(() => {
    const statsUnsub = onSnapshot(
      collection(db, "causeStats"),
      (snapshot) => {
        const totals = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          totals[doc.id] = Number(data?.totalRaised) || 0;
        });
        setTotalDonations(totals);
      },
      (err) => console.error("causeStats listener error:", err?.message)
    );

    const catUnsub = onSnapshot(query(collection(db, "category")), (categoryData) => {
      setCategory(categoryData.docs.map((el) => ({ id: el.id, ...el.data() })));
      setLoad(false);
    });

    return () => {
      statsUnsub();
      catUnsub();
    };
  }, [db]);

  const handleDonationChange = (causeId, amount) => {
    const newAmount = Math.max(0, parseInt(amount) || 0);
    setDonationAmounts((prev) => ({ ...prev, [causeId]: newAmount }));
  };

  const getRemainingAmount = (causeId, targetAmount) => {
    const raised = totalDonations[causeId] || 0;
    return Math.max(0, targetAmount - raised);
  };

  const getProgressPercentage = (causeId, targetAmount) => {
    const raised = totalDonations[causeId] || 0;
    return Math.min(100, (raised / targetAmount) * 100);
  };

  return (
    <section className="section-padding" id="section_3">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 col-12 text-center mb-4">
            <h2>Our Causes</h2>
          </div>

          {causesData.map((cause) => {
            const raised = totalDonations[cause.id] || 0;
            const remaining = getRemainingAmount(cause.id, cause.targetAmount);
            const progress = getProgressPercentage(cause.id, cause.targetAmount);
            const amountValue = donationAmounts[cause.id] || 0;

            return (
              <div key={cause.id} className="col-lg-4 my-4 col-md-6 col-12 mb-4 mb-lg-0">
                <div className="custom-block-wrap">
                  <img src={cause.image} className="custom-block-image img-fluid" alt={cause.title} />
                  <div className="custom-block">
                    <div className="custom-block-body">
                      <h5 className="mb-3">{cause.title}</h5>
                      <p>{cause.description}</p>

                      <div className="progress mt-3">
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${progress}%` }}
                          aria-valuenow={progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {progress.toFixed(0)}%
                        </div>
                      </div>

                      <div className="d-flex justify-content-between mt-2">
                        <span>Raised: ₹{raised.toLocaleString()}</span>
                        <span>Goal: ₹{cause.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span>Remaining:</span>
                        <span>₹{remaining.toLocaleString()}</span>
                      </div>

                      <div className="input-group mt-3">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={donationAmounts[cause.id] || ""}
                          onChange={(e) => handleDonationChange(cause.id, e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>

                    <Link
                      to="/payment"
                      state={{ causeId: cause.id, amount: amountValue, causeTitle: cause.title }}
                      className={`custom-btn btn ${amountValue > 0 ? "" : "disabled"}`}
                      onClick={(e) => {
                        if (!amountValue || amountValue <= 0) e.preventDefault();
                        setDonationAmounts((prev) => ({ ...prev, [cause.id]: 0 }));
                      }}
                    >
                      Donate Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* {category?.map((el) => (
            <div key={el.id} className="col-lg-4 my-4 col-md-6 col-12 mb-4 mb-lg-0">
              <div className="custom-block-wrap">
                <img src={el?.poster} className="custom-block-image img-fluid" alt="" />
                <div className="custom-block">
                  <div className="custom-block-body">
                    <h5 className="mb-3">{el?.categoryname}</h5>
                  </div>
                  <Link to={`/category/${el?.id}`} className="custom-btn btn">
                    View Campaigns
                  </Link>
                </div>
              </div>
            </div>
          ))} */}

          {load && (
            <div className="col-12 text-center mt-4">
              <small>Loading…</small>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
