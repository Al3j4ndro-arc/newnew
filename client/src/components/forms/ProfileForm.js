import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import FeedbackCard from "../FeedbackCard.js";

// const history = useHistory();

export default function ProfileForm(userid) {
  const [isLoading, setIsLoading] = useState(true);
  const [pnmData, setPNMData] = useState([]);
  const [application, setApp] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [appsubmitted, setAppSubmitted] = useState(false);
  const [decided, setDecided] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`api/admin/candidate-info/${userid.userid}`).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          setIsLoading(false);
          if (data.candidate.userData.application) {
            setApp(data.candidate.userData.application);
            setFeedback(data.candidate.userData.feedback);
            setPNMData(data.candidate);
            setAppSubmitted(true);
            console.log("success2");
          } else {
            console.log("no application");
            setFeedback(data.candidate.userData.feedback);
          }
        });
      } else {
        console.log("user not found");
      }
    });
  }, []);

  const setDecision = (decision) => {
    const data = {
      decision: decision,
      email: pnmData.email,
    };

    fetch("/api/admin/set-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          setDecided(true);
        } else {
          res.json().then((result) => {
            setError(result.message);
          });
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return isLoading ? (
    <div></div>
  ) : appsubmitted ? (
    <div className="">
      <div className="flex">
        <div className="w-sixty bg-white border border-gray-200 rounded-lg shadow flex relative">
          <div className="flex items-center relative">
            <img
              className="p-2 h-48 w-full shrink-0 object-cover"
              src={application.profileImg}
            />
          </div>

          <div className="p-3">
            <h1 className="text-center text-3xl font-bold tracking-wide">
              {application.firstname} {application.lastname}
            </h1>
            <p className="text-center font-bold">
              Year: {application.classYear}
            </p>
            <p className="w-168">{application.opt1}</p>
          </div>
        </div>
        <div className="absolute left-sixty translate-x-025 p-2">
          <object
            data={application.resume}
            type="application/pdf"
            width="500"
            height="678"
          >
            <iframe src={application.resume} width="500" f height="678">
              <p>This browser does not support PDF!</p>
            </iframe>
          </object>
        </div>
      </div>

      <div className="w-sixty bg-white border border-gray-200 rounded-lg shadow relative mt-4">
        <FeedbackCard feedback={feedback} />
      </div>
      <div className="w-sixty p-4">
        <div
          class="btn-group w-100 border border-gray-300"
          role="group"
          style={{ height: "30px" }}
        >
          <input
            onChange={(e) => setDecision("accepted")}
            type="radio"
            class="btn-check"
            name="decision"
            id="yes"
          />
          <label class="btn btn-outline-success" for="yes">
            Yes
          </label>

          <input
            onChange={(e) => setDecision("revisit")}
            type="radio"
            class="btn-check"
            name="decision"
            id="maybe"
          />
          <label class="btn btn-outline-warning" for="maybe">
            Maybe
          </label>

          <input
            onChange={(e) => setDecision("rejected")}
            type="radio"
            class="btn-check"
            name="decision"
            id="no"
          />
          <label class="btn btn-outline-danger" for="no">
            No
          </label>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <FeedbackCard feedback={feedback} />
    </div>
  );
}
