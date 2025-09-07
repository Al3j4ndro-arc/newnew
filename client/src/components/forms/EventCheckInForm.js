// client/src/components/forms/EventCheckInForm.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import validator from "validator";
// ⬇️ from components/forms -> lib
import { api } from "/Users/alejandrovillanueva/mcg-apply/client/src/lib/api.js";

export default function EventCheckInForm({ event }) {
  const { id, name, timelocation, description } = event;
  const [checkInCode, setCheckInCode] = useState("");
  const [correctCode, setCorrectCode] = useState(false);
  const [wrongCode, setWrongCode] = useState(false);

  const history = useHistory();

  const sendCheckInCode = async () => {
    if (!checkInCode) return;
    if (!validator.isAlphanumeric(checkInCode)) {
      setWrongCode(true);
      return;
    }

    try {
      await api("/events/event-signin", {
        method: "POST",
        body: { eventName: id, eventCode: checkInCode },
      });
      setCorrectCode(true);
      setWrongCode(false);
      setCheckInCode("Checked In");
    } catch {
      setWrongCode(true);
    }
  };

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const me = await api("/me", { signal: controller.signal });
        const already = me?.data?.userData?.events?.[id];
        if (alive && already) {
          setCorrectCode(true);
          setCheckInCode("Checked In");
        }
      } catch {
        if (alive) history.push("/login");
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
    // re-check if the event card is reused for a different `id`
  }, [id, history]);

  return (
    <div className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow">
      <div>
        <h5 className="text-center mb-2 text-2xl font-bold tracking-tight text-gray-900">
          {name}
        </h5>
        <p className="text-center mb-3 font-normal text-gray-700">{timelocation}</p>
        <p className="mb-3 font-normal text-gray-700">{description}</p>
      </div>

      <div className="space-y-3">
        <input
          disabled={correctCode}
          type="text"
          className={`${
            correctCode
              ? "bg-green-400"
              : wrongCode
              ? "bg-red-400"
              : "bg-gray-50 border-gray-300"
          } border text-gray-900 text-sm rounded-lg block w-full p-2.5`}
          placeholder="Check in Code"
          value={checkInCode}
          onChange={(e) => {
            setWrongCode(false);
            setCheckInCode(e.target.value);
          }}
        />

        {!correctCode && (
          <button
            onClick={sendCheckInCode}
            className="w-full text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-60"
            disabled={!checkInCode}
          >
            Check-In To Event
          </button>
        )}
      </div>
    </div>
  );
}
