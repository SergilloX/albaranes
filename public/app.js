document.addEventListener('DOMContentLoaded', function() {
  const albaranForm = document.getElementById('albaran-form');
  const albaranesList = document.getElementById('albaranes-list');
  const totalKilosElement = document.getElementById('total-kilos');
  const totalImporteElement = document.getElementById('total-importe');
  const cobroForm = document.getElementById('cobro-form');
  const cobrosList = document.getElementById('cobros-list');
  const pendienteCobroElement = document.getElementById('pendiente-cobro');

  // Función para formatear el importe en euros con puntos y comas
  function formatCurrency(amount) {
    const number = parseFloat(amount);
    if (isNaN(number)) return '0,00 €';
    const rounded = number.toFixed(2);
    const [integerPart, decimalPart] = rounded.split('.');
    const integerPartWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPartWithDots},${decimalPart} €`;
  }

  // Función para formatear la fecha en dd/mm/aaaa
  function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  // Función para actualizar el pendiente de cobro
  function updatePendienteCobro() {
    fetch('/api/albaranes')
      .then(response => response.json())
      .then(data => {
        let totalImporte = 0;
        data.data.forEach(albaran => {
          totalImporte += albaran.importe;
        });

        const totalAjustado = totalImporte * 0.88 * 0.98;
        fetch('/api/cobros')
          .then(response => response.json())
          .then(cobrosData => {
            let totalCobros = 0;
            cobrosData.data.forEach(cobro => {
              totalCobros += cobro.importe;
            });

            const pendienteCobro = totalAjustado - totalCobros;
            pendienteCobroElement.textContent = formatCurrency(pendienteCobro);
          });
      });
  }

  // Función para obtener y mostrar los albaranes
  function fetchAlbaranes() {
    fetch('/api/albaranes')
      .then(response => response.json())
      .then(data => {
        albaranesList.innerHTML = '';
        let totalKilos = 0;
        let totalImporte = 0;

        data.data.forEach(albaran => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${albaran.id}</td>
            <td>${albaran.albaran}</td>
            <td>${formatDate(albaran.fecha)}</td>
            <td>${formatCurrency(albaran.kilos).replace('€','')}</td>
            <td>${formatCurrency(albaran.importe)}</td>
            <td>${albaran.invernadero || ''}</td>
            <td><button class="delete-btn" data-id="${albaran.id}">Eliminar</button></td>
          `;
          albaranesList.appendChild(row);

          // Sumar los valores para el total
          totalKilos += albaran.kilos;
          totalImporte += albaran.importe;
        });

        // Calcular y mostrar el total ajustado
        const totalAjustado = (totalImporte * 0.88 * 0.98).toFixed(2);
        totalKilosElement.textContent = `${formatCurrency(totalKilos).replace('€','')}`;
        totalImporteElement.textContent = `${formatCurrency(totalAjustado)}`;
        
        updatePendienteCobro(); // Actualizar pendiente de cobro
      });
  }

  // Función para añadir un nuevo albarán
  albaranForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(albaranForm);
    const albaranData = {};
    formData.forEach((value, key) => {
      albaranData[key] = value || null; // Asegurarse de capturar el valor del invernadero, aunque sea nulo
    });

    fetch('/api/albaranes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(albaranData)
    })
    .then(response => response.json())
    .then(data => {
      fetchAlbaranes();
      albaranForm.reset();
    });
  });

  // Función para eliminar un albarán
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('delete-btn')) {
      const albaranId = e.target.getAttribute('data-id');
      fetch(`/api/albaranes/${albaranId}`, {
        method: 'DELETE'
      })
      .then(() => {
        fetchAlbaranes(); // Recalcular los totales después de eliminar
      });
    }
  });

  // Función para añadir un nuevo cobro
  cobroForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(cobroForm);
    const cobroData = {};
    formData.forEach((value, key) => {
      cobroData[key] = value;
    });

    fetch('/api/cobros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cobroData)
    })
    .then(response => response.json())
    .then(data => {
      fetchCobros();
      cobroForm.reset();
    });
  });

  // Función para obtener y mostrar los cobros
  function fetchCobros() {
    fetch('/api/cobros')
      .then(response => response.json())
      .then(data => {
        cobrosList.innerHTML = '';

        data.data.forEach(cobro => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${cobro.id}</td>
            <td>${formatDate(cobro.fecha)}</td>
            <td>${formatCurrency(cobro.importe)}</td>
            <td><button class="delete-cobro-btn" data-id="${cobro.id}">Eliminar</button></td>
          `;
          cobrosList.appendChild(row);
        });

        updatePendienteCobro(); // Actualizar pendiente de cobro
      });
  }

  // Función para eliminar un cobro
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('delete-cobro-btn')) {
      const cobroId = e.target.getAttribute('data-id');
      fetch(`/api/cobros/${cobroId}`, {
        method: 'DELETE'
      })
      .then(() => {
        fetchCobros(); // Recalcular el pendiente de cobro después de eliminar
      });
    }
  });

  // Función para mostrar la sección activa y actualizar el menú
  function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.style.display = page.id === pageId ? 'block' : 'none';
    });

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href').substring(1) === pageId);
    });
  }

  // Configurar los eventos de navegación
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const pageId = link.getAttribute('href').substring(1);
      showPage(pageId);
    });
  });

  // Inicializar las listas de albaranes y cobros y totales
  fetchAlbaranes();
  fetchCobros();

  // Mostrar la página inicial (por defecto)
  showPage('albaranes');
});
