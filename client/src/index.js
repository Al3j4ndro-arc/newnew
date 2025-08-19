// client/src/index.js
import React from "react";
import ReactDOM from "react-dom/client"; // OK to keep createRoot with v5
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";

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

import "./stylesheets/output.css";

const AppRoutes = () => (
  <Router>
    <Switch>
      <Route path="/conflict" component={Conflict} />
      <Route path="/events" component={Events} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/publicevents" component={PublicEvents} />
      <Route path="/signup" component={SignUp} />
      <Route path="/application" component={Application} />
      <Route path="/login" component={Login} />
      <Route path="/logout" component={Logout} />
      <Route path="/admin" component={Admin} />
      <Route path="/deliberations" component={Deliberations} />

      {/* default route */}
      <Route exact path="/" component={PublicEvents} />
      {/* catch-all */}
      <Route render={() => <Redirect to="/publicevents" />} />
    </Switch>
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
