import { Redirect, Route, Switch } from "react-router-dom";
import { usePlatform } from "./context/PlatformContext";
import BookingPage from "./pages/BookingPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

function ProtectedRoute({ children, ...routeProps }) {
  const { session } = usePlatform();
  return (
    <Route
      {...routeProps}
      render={({ location }) =>
        session ? children : <Redirect to={{ pathname: "/entrar", state: { from: location } }} />
      }
    />
  );
}

export default function App() {
  return (
    <Switch>
      <Route exact path="/" component={LandingPage} />
      <Route exact path="/entrar" component={LoginPage} />
      <Route exact path="/agendar/:slug" component={BookingPage} />
      <ProtectedRoute path="/painel">
        <DashboardPage />
      </ProtectedRoute>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
