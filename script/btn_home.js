// const btnCoupe = document.querySelector('#btn-home1');
// const btnCabriolet = document.querySelector('#btn-home2');
// const carro = document.querySelector('#carro-home')
// btnCoupe.addEventListener('click', () => carro.src ='./images/carros/coupe-lado.avif')
// btnCabriolet.addEventListener('click', () => carro.src ='./images/carros/cabriolet-lado.avif')



$('#btn-home1').on('click', () => $('#carro-home').attr('src', './images/carros/coupe-lado.avif'))
$('#btn-home2').on('click', () => $('#carro-home').attr('src', './images/carros/cabriolet-lado.avif'))