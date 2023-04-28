import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MyContext from './Context';

function MeuProvider({ children }) {
  const [agendamento, setAgendamento] = useState()
  const [barbeiro, setbarbeiro] = useState('Gabriel')
  const [serviço, setserviço] = useState({servico: []})
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [bot, setBot] = useState('Dis')
  const [checks, setChecks] = useState()
  const[disab, setDisab]= useState(true)
  useEffect(() => {

    if(serviço.service?.length > 0 &&  telefone.length > 15 && telefone.length < 17 &&  nome.length > 3 ){
      setBot('agendar')
      return setDisab(false)
    }
    setBot('Dis')
    return setDisab(true)
  },[serviço, telefone, nome]);
  const contextValue = useMemo(() => ({
    agendamento, setAgendamento,
    checks, setChecks,
    barbeiro, setbarbeiro,
    serviço, setserviço,
    telefone, setTelefone,
    nome, setNome,
    disab, setDisab,
    bot, setBot
  }), [agendamento, checks, barbeiro, serviço, telefone, nome, disab, bot]);

  return (
    <MyContext.Provider value={ contextValue }>
      {children}
    </MyContext.Provider>
  );
}

MeuProvider.propTypes = {
  children: PropTypes.arrayOf(),

}.isRequired;
export default MeuProvider;
