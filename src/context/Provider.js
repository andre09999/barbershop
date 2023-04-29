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
  const[data, setData]= useState(new Date(Date.now()).toLocaleString().split(',')[0])
  const[arrey]= useState( [ "09:00", "09:30","10:00","10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00","15:30","16:00", "16:30","17:00","17:30","18:00","18:30"])
 
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
    bot, setBot,
    data, setData,
    arrey
  }), [agendamento, checks, barbeiro, serviço, telefone, nome, disab, bot, data, arrey]);

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
