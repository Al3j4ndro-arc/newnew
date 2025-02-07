import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Root from "./routes/root.js";
import Login from "./routes/login.js";
import SignUp from "./routes/signup.js";
import Application from "./routes/application.js";
import Events from "./routes/events.js";
import PublicEvents from "./routes/publicEvents.js";
import Feedback from "./routes/feedback.js";
import Conflict from "./routes/conflict.js";
import Logout from "./routes/logout.js";
import Admin from "./routes/admin.js";
import Deliberations from "./routes/deliberations.js";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Styles
import "./stylesheets/output.css";

const router = createBrowserRouter([
  {
    path: "/conflict",
    element: <Conflict />,
  },
  {
    path: "/events",
    element: <Events />,
  },

  {
    path: "/feedback",
    element: <Feedback />,
  },

  {
    path: "/publicevents",
    element: <PublicEvents />,
  },

  {
    path: "/signup",
    element: <SignUp />,
  },

  {
    path: "/application",
    element: <Application />,
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/logout",
    element: <Logout />,
  },

  {
    path: "/admin",
    element: <Admin />,
  },

  {
    path: "/deliberations",
    element: <Deliberations />,
  },

  {
    path: "*",
    element: <PublicEvents />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
