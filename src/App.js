import { Route, Switch, Redirect } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/footer';
import Home from './pages/home';
import Agendamento from './pages/agendamento';

function App() {

  return (
    <div>
    <Header/>
    <Switch>
        <Route exact path='/'  >
          <Redirect to='/home'/>
        </Route>
        <Route path='/home' component={  Home } />
        <Route path='/Agendamento'  component={ Agendamento } />
        <Route path='*' element={<h1>Not Found</h1>} />
      </Switch>
      <Footer/>
    </div>
  );
}

export default App;
