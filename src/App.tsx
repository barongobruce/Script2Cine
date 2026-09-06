import { Toaster } from "sonner";
import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import NewProject from "./pages/NewProject";
import "./index.css";

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/new-project">
          <NewProject onBack={() => window.history.back()} />
        </Route>
      </Switch>

      <Toaster position="bottom-right" richColors />
    </>
  );
}


