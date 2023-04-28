import { Route, Switch, Redirect } from 'react-router-dom';
import { useContext } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/footer';
import Home from './pages/home';
import Agendamento from './pages/agendamento';
import MyContext from '../src/context/Context';

function App() {
    const {agendamento, setAgendamento, checks, setChecks} = useContext(MyContext)
  
  
  return (
    <div>
    <Header/>
    <Switch>
        <Route exact path='/'  >
          <Redirect to='/home'/>
        </Route>
        <Route path='/home' component={  Home } />
        <Route path='/Agendamento'  setChecks={setChecks} component={ Agendamento } />
        <Route path='*' element={<h1>Not Found</h1>} />
      </Switch>
      <Footer/>
    </div>
  );
}

export default App;
