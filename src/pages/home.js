import '../App.css';
import logo from '../img/333733591_873102923801425_5641639317677690573_n-removebg-preview.png'
import img1 from '../img/carrossel/1.jpg'
import img2 from '../img/carrossel/2.jpg'
import img3 from '../img/carrossel/3.jpg'
import img4 from '../img/carrossel/4.jpg'
import maos from '../img/Alecive-Flatwoken-Apps-Google-Maps.512.png'
import logWpp from '../img/icones/whatsapp.png'
import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
function Home() {
  return (
    <div className="containerHome">
    <div  className='logoHome'>
        <div className='logss'>
     <img src={logo} alt='logo barbearia' className='foto'/>
     </div>
     </div>
     <div className='container1' >
     <Carousel fade>
   
        <Carousel.Item className="slide" interval={ 2000 }>
        <img src={img1} alt='logo barbearia' className='fotos'/>
        </Carousel.Item>
     
        <Carousel.Item className="slide" interval={ 2000 }>
        <img src={img2} alt='logo barbearia' className='fotos'/>
        </Carousel.Item>
     
        <Carousel.Item className="slide" interval={ 2000 }>
        <img src={img3} alt='logo barbearia' className='fotos' />
        </Carousel.Item>

        <Carousel.Item className="slide" interval={ 2000 }>
        <img src={img4} alt='logo barbearia' className='fotos' />
        </Carousel.Item>

     </Carousel>
     </div>
     <a href='https://api.whatsapp.com/send?phone=5562982212243&text=Ol%C3%A1+quero+agendar+meu+hor%C3%A1rio' target='_blank' rel="noreferrer" className='agende'>
            <img src={logWpp} alt='logo wpp' className='logo'/>
            <h1>Agende seu Horario</h1>
        </a>
        <a href='https://goo.gl/maps/KWxrcY2tMP5Y4SQV6' target='_blank' rel="noreferrer" className='endereco'>
            <img src={maos} alt='logo wpp' className='logo'/>
            <h1>Rua 101 Unidade 101, Pq Atheneu, Goiânia GO, 74890-420, Brasil</h1>
        </a>
     </div>
   
  );
}

export default Home;
