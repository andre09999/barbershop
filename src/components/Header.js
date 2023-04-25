import '../App.css';
import logo from'../img/favicon.jpeg'
import logInsta from '../img/icones/icons8-instagram-512.png'
import logWpp from '../img/icones/whatsapp.png'
function Header() {
  return (

      <header >
        <img src={logo} alt='logo' className='logoBarber'/>
        <h1 className='headerH1'>Oliveer Barbearia</h1>
        <div className='log'>
        <a href='https://www.instagram.com/oliveer_barbearia/' target='_blank' rel="noreferrer">
            <img src={logInsta} alt='logo insta' className='logo'/>
        </a>
        <a href='https://api.whatsapp.com/send?phone=5562982243221&text=Gostaria%20de%20agendar%20meu%20horario' target='_blank' rel="noreferrer">
            <img src={logWpp} alt='logo wpp' className='logo'/>
        </a>
        </div>
      </header>

  );
}

export default Header;
