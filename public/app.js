document.addEventListener('DOMContentLoaded', function() {
  const albaranForm = document.getElementById('albaran-form');
  const albaranesList = document.getElementById('albaranes-list');

  // Función para obtener y mostrar los albaranes
  function fetchAlbaranes() {
    fetch('/api/albaranes')
      .then(response => response.json())
      .then(data => {
        albaranesList.innerHTML = '';
        data.data.forEach(albaran => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${albaran.id}</td>
            <td>${albaran.albaran}</td>
            <td>${albaran.fecha}</td>
            <td>${albaran.kilos}</td>
            <td>${albaran.importe}</td>
          `;
          albaranesList.appendChild(row);
        });
      });
  }

  // Función para añadir un nuevo albarán
  albaranForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(albaranForm);
    const albaranData = {};
    formData.forEach((value, key) => {
      albaranData[key] = value;
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

  // Inicializar la lista de albaranes
  fetchAlbaranes();
});
