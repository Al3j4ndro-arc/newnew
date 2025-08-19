import React from "react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export default function ConflictForm({ user }) {
  const [isLoading, setIsLoading] = useState(true);
  const [filteredApp, setFilteredApp] = useState([]);
  const [allApplicants, setAll] = useState([]);
  const [searchedApplicant, setSearchedApplicant] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  const history = useHistory();

  useEffect(() => {
    fetch("/api/conflict/all-candidates")
      .then((res) => {
        if (res.ok) {
          res
            .json()
            .then((result) => {
              if (result.candidates) {
                const pnmData = [];
                for (const candidate of result.candidates) {
                  const userconflicts = user.conflict;
                  if (userconflicts.includes(candidate.email)) {
                    pnmData.push({ pnm: candidate, conflict: true });
                  } else {
                    pnmData.push({ pnm: candidate, conflict: false });
                  }
                }
                setIsLoading(false);
                setFilteredApp(pnmData);
                setAll(pnmData);
              }
            })
            .catch((err) => {
              console.log("error finding conflicts0");
              history.push('/login');
            });
        } else {
          console.log("error finding conflicts1");
          history.push('/login');
        }
      })
      .catch((err) => {
        console.log("error finding conflicts2");
        history.push('/login');
      });
  }, []);

  const handleSearch = (e) => {
    let searchVal = e.target.value;
    setSearchedApplicant(searchVal);
    if (searchVal === "") {
      setFilteredApp(allApplicants);
      return;
    } else {
      const filterBySearch = allApplicants.filter((applicant) => {
        if (
          applicant.pnm.name.toLowerCase().includes(searchVal.toLowerCase())
        ) {
          return applicant;
        }
      });
      setFilteredApp(filterBySearch);
    }
  };

  const submitConflict = () => {
    const d = {
      data: allApplicants,
    };
    fetch("/api/conflict/submit-conflict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(d),
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

  const click = (candidate) => {
    const new_data = [];
    for (const c of allApplicants) {
      if (c.pnm.email !== candidate.pnm.email) {
        new_data.push({ pnm: c.pnm, conflict: c.conflict });
      } else {
        if (candidate.conflict) {
          new_data.push({ pnm: c.pnm, conflict: false });
        } else {
          new_data.push({ pnm: c.pnm, conflict: true });
        }
      }
    }

    const new_filtered = [];
    for (const c of filteredApp) {
      if (c.pnm.email !== candidate.pnm.email) {
        new_filtered.push({ pnm: c.pnm, conflict: c.conflict });
      } else {
        if (candidate.conflict) {
          new_filtered.push({ pnm: c.pnm, conflict: false });
        } else {
          new_filtered.push({ pnm: c.pnm, conflict: true });
        }
      }
    }

    setFilteredApp(new_filtered);
    setAll(new_data);
  };

  return isLoading ? (
    <div></div>
  ) : (
    <div className="flex flex-col items-center justify-center py-8 ">
      <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 ">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h3>Search:</h3>
          <div className="border-b border-l border-r border-gray-300 rounded-lg">
            <input
              value={searchedApplicant}
              onChange={(e) => handleSearch(e)}
              className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Search for an applicant"
            />
          </div>
          <div>
            {filteredApp.map((candidate) => {
              return (
                <div>
                  {candidate.conflict ? (
                    <div
                      className="p-0.5"
                      onClick={() => {
                        click(candidate);
                      }}
                    >
                      <div className="p-2 flex gap-x-2 bg-gray-100 hover:shadowgrey border border-gray-200 rounded-lg">
                        {candidate.pnm.name}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-0.5"
                      onClick={() => {
                        click(candidate);
                      }}
                    >
                      <div className="p-2 flex gap-x-2 hover:shadowgrey border border-gray-200 rounded-lg">
                        {candidate.pnm.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={submitConflict}
            className="w-full nptext-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
          >
            Update Conflicts
          </button>
          <p className="text-red-500">{error.capitalize()}</p>
          {submitted ? (
            <p className="text-green-500">Conflicts updated successfully!</p>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
