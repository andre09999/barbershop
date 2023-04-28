import '../App.css';
import MyContext from '../context/Context';
import { useContext, useState } from 'react';

function Agendamento() {
    const {agendamento, setAgendamento, 
        checks, setChecks, 
        barbeiro, setbarbeiro,
        serviço, setserviço,
        telefone, setTelefone,
        nome, setNome,
        disab,
        bot, setBot} = useContext(MyContext)

    const agenda = (a) => {
        a.preventDefault();
        console.log(barbeiro,serviço, telefone, nome)
      }
      const che = (a) => {
        if(a.checked){
            const servicoss = serviço?.service
            if(serviço?.service){
               return setserviço({service: [a.name, ...servicoss ]})
            }
           return setserviço({service: [a.name]})
        }
        
       const ser = serviço?.service.filter(b => b!== a.name)
       return setserviço({service: ser})
      }

      const maskPhone = (value) => {
        return value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d)/, "($1) $2 ")
          .replace(/(\d{4})(\d)/, "$1-$2")
          .replace(/(-\d{4})(\d+?)$/, "$1");
      };
  return (
    <div className='containerAgenda'>
        <div className='centro'>
        <form onSubmit={agenda} className='efeitoVidro'>
            <label className="option">
                <h3 className='h3Agenda'>Escolha seu barbeiro:</h3>
        <select value={barbeiro} onChange={({target})=> setbarbeiro(target.value)}>
            <option value="Athus">Athus</option>
            <option selected value="Gabriel">Gabriel</option>
        </select>
        </label>
           <input type='text' placeholder='Digite Seu Nome' value={nome} onChange={({target})=> setNome(target.value)}/>
           <input type='tel' pattern="\(\d{2}\)\d{4}-\d{4}" placeholder='Digite Seu Telefone' value={telefone} onChange={({target})=> setTelefone(maskPhone(target.value))}/>
        <div className='containerServices'>
            <label htmlFor='barba' className='service'>
            <input type='checkbox' onChange={({target})=> che(target)} name='barba' id='barba'  className='check'/> 
            <span>Barba</span> 

            </label>
            <label htmlFor='Corte Maculino' className='service'>
           <input type='checkbox' id='Corte Maculino' name='Corte Maculino' className='check' onChange={({target})=> che(target)} /> 
           <span>Cabelo Masculino</span>
            </label>
        </div>
        <button disabled={disab} className={bot} type='submit'>Agendar</button>
        </form>
        </div>
    </div>
  );
}

export default Agendamento;
