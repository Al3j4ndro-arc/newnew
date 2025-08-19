import React from "react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export default function FeedbackForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [event, setEvent] = useState("");
  const [searchedApplicant, setSearchedApplicant] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [pnmEmail, setPNMEmail] = useState("");
  const [error, setError] = useState("");

  const [ratingState, setRatingState] = useState({
    commitment: 0,
    socialfit: 0,
    challenge: 0,
    tact: 0,
  });

  const [commentState, setCommentState] = useState({
    commitment: "",
    socialfit: "",
    challenge: "",
    tact: "",
  });

  const [selectState, setSelectState] = useState({
    commitment: false,
    socialfit: false,
    challenge: false,
    tact: false,
  });

  const [applicants, setApplicants] = useState([]);
  const [filteredApp, setFilteredApp] = useState([]);

  const history = useHistory();

  useEffect(() => {
    fetch("/api/feedback/all-candidates")
      .then((res) => {
        if (res.ok) {
          res
            .json()
            .then((result) => {
              if (result.candidates) {
                setApplicants(result.candidates);
                setIsLoading(false);
              }
            })
            .catch((err) => {
              history.push('/login');
            });
        } else {
          history.push('/login');
        }
      })
      .catch((err) => {
        history.push('/login');
      });
  }, []);

  const submitFeedback = () => {
    const data = {
      candidate: applicantEmail,
      email: pnmEmail,
      event: event,
      scores: ratingState,
      comments: commentState,
      comment: comment,
    };
    fetch("/api/feedback/submit-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          setSubmitted(true);
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

  const values = [
    {
      id: "commitment",
      name: "Commitment",
      group: "1",
    },
    {
      id: "socialfit",
      name: "Social Fit",
      group: "2",
    },
    {
      id: "challenge",
      name: "Willingness to take on a challenge",
      group: "3",
    },
    {
      id: "tact",
      name: "Tact/Professionalism",
      group: "4",
    },
  ];

  const setScoreHandler = (score, id) => {
    let currentRatings = { ...ratingState };
    currentRatings[id] = score;
    setRatingState(currentRatings);
  };

  const setCommentHandler = (comment, id) => {
    let currentComments = { ...commentState };
    currentComments[id] = comment;
    setCommentState(currentComments);
  };

  const handleSearch = (e) => {
    let searchVal = e.target.value;
    if (searchVal === searchedApplicant) {
      return;
    }
    setSearchedApplicant(searchVal);
    if (searchVal === "") {
      setFilteredApp([]);
      return;
    }
    const filterBySearch = applicants.filter((applicant) => {
      if (applicant.name.toLowerCase().includes(searchVal.toLowerCase())) {
        return applicant;
      }
    });
    setFilteredApp(filterBySearch);
  };

  const handleSelectApp = (applicant) => {
    setSearchedApplicant(applicant.name);
    setApplicantEmail(applicant.email);
    setFilteredApp([]);
  };

  const resetInputs = () => {
    setApplicantEmail("");
    setPNMEmail("");
    setSearchedApplicant("");
    setEvent("");
    setRatingState({
      commitment: 0,
      socialfit: 0,
      challenge: 0,
      tact: 0,
    });
    setCommentState({
      commitment: "",
      socialfit: "",
      challenge: "",
      tact: "",
    });
    setComment("");
    setSubmitted(false);
    setError("");

    const radioButtons = document.querySelectorAll(`input[class="btn-check"]`);
    radioButtons.forEach((radioButton) => {
      radioButton.checked = false;
    });
  };

  const checkEnter = (key) => {
    if (key === "Enter") {
      handleSelectApp(filteredApp[0]);
    }
  };

  return isLoading ? (
    <div></div>
  ) : (
    <div className="bg-gray-50">
      <div className="flex flex-col items-center justify-center py-8 ">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 ">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              MCG Fall 2025git remote remove origin Feedback Form
            </h1>
            <div>
              <a
                href="/api/admin/candidate-spreadsheet"
                target="_blank"
                className="text-xs rounded-md border border-blue-600 p-2 hover:opacity-60"
              >
                Download Applicant CSV
              </a>
            </div>
            <div>
              <a
                href="/api/admin/feedback-spreadsheet"
                target="_blank"
                className="text-xs rounded-md border border-blue-600 p-2 hover:opacity-60"
              >
                Download Feedback CSV
              </a>
            </div>

            <div className="flex flex-col space-y-4">
              <h3>Applicant:</h3>
              <div className="border-b border-l border-r border-gray-300 rounded-lg">
                <input
                  value={searchedApplicant}
                  onKeyUp={(e) => checkEnter(e.key)}
                  onChange={(e) => handleSearch(e)}
                  className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Search for an applicant"
                />
                <div className="max-h-36 overflow-y-auto">
                  {filteredApp.map((applicant) => {
                    return (
                      <button
                        key={applicant.email}
                        onClick={() => {
                          handleSelectApp(applicant);
                        }}
                        className="block w-full h-8 border-bottom border-gray-500 rounded md hover:bg-gray-200"
                      >
                        {applicant.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <h3>Or email, if they haven't created an account:</h3>
              <div className="border-b border-l border-r border-gray-300 rounded-lg">
                <input
                  value={pnmEmail}
                  onChange={(e) => setPNMEmail(e.target.value)}
                  className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Applicant email"
                />
              </div>

              <div className="">
                <h3>Event:</h3>
                <select
                  value={event}
                  onChange={(e) => {
                    setEvent(e.target.value);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 mt-1 mb-2"
                >
                  <option value="">Choose an event</option>
                  <option value="Coffee Chat">Coffee Chat</option>
                  <option value="Meet the Team">Meet the Team</option>
                  <option value="DEI Panel">DEI Panel</option>
                  <option value="PD Panel">PD Panel</option>
                  <option value="Resume Review">Resume Review</option>
                  <option value="Cheesecake Social">Cheesecake Social</option>
                  <option value="Case Workshop">Case Workshop</option>
                  <option value="Interview">Interview</option>
                  <option value="Conflict">Conflict</option>
                </select>
              </div>

              {values.map((value) => (
                <div key={value.name} className="">
                  <h3 className="mb-0">{value.name}:</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg block w-full p-2.5 mt-1 mb-2">
                    <div
                      class="btn-group w-100 border border-gray-300"
                      role="group"
                      style={{ height: "30px" }}
                    >
                      <input
                        onChange={(e) => setScoreHandler("green", value.id)}
                        type="radio"
                        class="btn-check"
                        name={value.group}
                        id={value.group + "1"}
                      />
                      <label
                        class="btn btn-outline-success"
                        for={value.group + "1"}
                      ></label>

                      <input
                        onChange={(e) => setScoreHandler("yellow", value.id)}
                        type="radio"
                        class="btn-check"
                        name={value.group}
                        id={value.group + "2"}
                      />
                      <label
                        class="btn btn-outline-warning"
                        for={value.group + "2"}
                      ></label>

                      <input
                        onChange={(e) => setScoreHandler("red", value.id)}
                        type="radio"
                        class="btn-check"
                        name={value.group}
                        id={value.group + "3"}
                      />
                      <label
                        class="btn btn-outline-danger"
                        for={value.group + "3"}
                      ></label>

                      <input
                        onChange={(e) => setScoreHandler("white", value.id)}
                        type="radio"
                        class="btn-check"
                        name={value.group}
                        id={value.group + "4"}
                      />
                      <label
                        class="btn btn-outline-secondary"
                        for={value.group + "4"}
                      ></label>
                    </div>

                    <div className="p-1 mt-1">
                      <textarea
                        value={commentState[value.id]}
                        onChange={(e) => {
                          setCommentHandler(e.target.value, value.id);
                        }}
                        rows="4"
                        type="comments"
                        name={value.group + "comment"}
                        id={value.group + "comment"}
                        className="p-2.5 resize-y bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder={
                          "Elaborate on your " +
                          value.name.toLowerCase() +
                          " score here"
                        }
                        required=""
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                General Comments:{" "}
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                }}
                rows="8"
                type="comments"
                name="comments"
                id="comments"
                className="resize-y bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                placeholder="Write your general comments here"
                required=""
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={submitFeedback}
                className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
              >
                Submit Feedback
              </button>
              <button
                onClick={resetInputs}
                className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-gray-400 rounded-lg focus:shadow-outline hover:bg-gray-500"
              >
                New Feedback Form
              </button>
            </div>

            <p className="text-red-500">{error.capitalize()}</p>
            {submitted ? (
              <p className="text-green-500">Submitted successfully!</p>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
