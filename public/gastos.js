document.addEventListener('DOMContentLoaded', function() {
  const gastoForm = document.getElementById('gasto-form');
  const gastosList = document.getElementById('gastos-list');
  const totalGastoImporteElement = document.getElementById('total-gasto-importe');
  const conceptoSelect = document.getElementById('concepto');
  const nuevoProveedorLabel = document.getElementById('nuevo-proveedor-label');
  const nuevoProveedorInput = document.getElementById('nuevo-proveedor');

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

  // Función para actualizar el total de gastos
  function updateTotalGastos() {
    let totalGastoImporte = 0;
    const rows = gastosList.querySelectorAll('tr:not(.header-row)');
    rows.forEach(row => {
      const importeText = row.querySelector('.importe').textContent;
      const importe = parseFloat(importeText.replace(/\./g, '').replace(',', '.').replace(' €', ''));
      totalGastoImporte += importe;
    });
    totalGastoImporteElement.textContent = formatCurrency(totalGastoImporte);
  }

  // Función para obtener y mostrar los gastos
  function fetchGastos() {
    const token = localStorage.getItem('token');
    fetch('/api/gastos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        // Agrupar los gastos por proveedor
        const groupedByProveedor = data.data.reduce((acc, gasto) => {
          if (!acc[gasto.concepto]) acc[gasto.concepto] = [];
          acc[gasto.concepto].push(gasto);
          return acc;
        }, {});

        // Ordenar cada grupo por fecha
        for (let proveedor in groupedByProveedor) {
          groupedByProveedor[proveedor].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        }

        // Limpiar la lista de gastos
        gastosList.innerHTML = '';

        // Añadir los gastos agrupados y ordenados a la tabla
        for (let proveedor in groupedByProveedor) {
          const headerRow = document.createElement('tr');
          headerRow.classList.add('header-row');
          headerRow.innerHTML = `<td colspan="4"><strong>${proveedor}</strong></td>`;
          gastosList.appendChild(headerRow);

          groupedByProveedor[proveedor].forEach(gasto => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${gasto.concepto}</td>
              <td>${formatDate(gasto.fecha)}</td>
              <td class="importe">${formatCurrency(gasto.importe)}</td>
              <td><button class="delete-gasto-btn" data-id="${gasto.id}">Eliminar</button></td>
            `;
            gastosList.appendChild(row);
          });
        }
        updateTotalGastos();
      });
  }

  // Función para añadir un nuevo gasto
  gastoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(gastoForm);
    let concepto = formData.get('concepto');
    if (concepto === 'nuevo') {
      concepto = formData.get('nuevo-proveedor');
      const newOption = new Option(concepto, concepto, false, true);
      conceptoSelect.add(newOption);
    }
    const gastoData = {
      concepto,
      fecha: formData.get('fecha'),
      importe: formData.get('importe').replace(',', '.')
    };

    const token = localStorage.getItem('token');
    fetch('/api/gastos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(gastoData)
    })
    .then(response => response.json())
    .then(data => {
      fetchGastos();
      gastoForm.reset();
      nuevoProveedorLabel.style.display = 'none';
      nuevoProveedorInput.style.display = 'none';
    });
  });

  // Función para eliminar un gasto
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('delete-gasto-btn')) {
      const gastoId = e.target.getAttribute('data-id');
      const token = localStorage.getItem('token');
      fetch(`/api/gastos/${gastoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(() => {
        fetchGastos();
      });
    }
  });

  // Mostrar u ocultar el campo de nuevo proveedor
  conceptoSelect.addEventListener('change', function() {
    if (conceptoSelect.value === 'nuevo') {
      nuevoProveedorLabel.style.display = 'block';
      nuevoProveedorInput.style.display = 'block';
      nuevoProveedorInput.required = true;
    } else {
      nuevoProveedorLabel.style.display = 'none';
      nuevoProveedorInput.style.display = 'none';
      nuevoProveedorInput.required = false;
    }
  });

  // Inicializar la lista de gastos y total
  fetchGastos();
});
