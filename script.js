const tableBody = document.querySelector('#vacation-table tbody');
const addVacationForm = document.getElementById('add-vacation-form');
const employeeNameInput = document.getElementById('employee-name');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const yearSelect = document.getElementById('year-select');

let vacationData = {};
const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
let currentYear = new Date().getFullYear();

// Carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('vacationData');
    if (savedData) {
        vacationData = JSON.parse(savedData);
    } else {
        // Dados iniciais
        vacationData = {
            "Servidor 1": [{ start: '2025-01-10', end: '2025-01-20' }, { start: '2025-07-01', end: '2025-07-15' }],
            "Servidor 2": [{ start: '2025-01-15', end: '2025-01-25' }, { start: '2025-08-10', end: '2025-08-20' }],
            "Servidor 3": [{ start: '2025-03-01', end: '2025-03-15' }],
            "Servidor 4": [{ start: '2025-06-05', end: '2025-06-20' }],
            "Servidor 5": [{ start: '2025-11-10', end: '2025-11-30' }],
        };
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('vacationData', JSON.stringify(vacationData));
}

// Preencher seletor de ano
function populateYearSelect() {
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    yearSelect.innerHTML = '';
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// Renderizar tabela
function renderTable() {
    tableBody.innerHTML = '';

    const employeesForYear = new Set();
    Object.keys(vacationData).forEach(employeeName => {
        vacationData[employeeName].forEach(vacation => {
            const startYear = new Date(vacation.start).getFullYear();
            const endYear = new Date(vacation.end).getFullYear();
            if (startYear <= currentYear && endYear >= currentYear) {
                employeesForYear.add(employeeName);
            }
        });
    });

    Array.from(employeesForYear).sort().forEach(employeeName => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = employeeName;
        nameCell.classList.add('sticky', 'left-0', 'bg-white', 'z-10', 'font-semibold');
        row.appendChild(nameCell);

        for (let i = 0; i < 12; i++) {
            const monthCell = document.createElement('td');
            monthCell.addEventListener('mouseenter', () => showTooltip(monthCell, employeeName, i));
            monthCell.addEventListener('mouseleave', hideTooltip);
            row.appendChild(monthCell);
        }

        tableBody.appendChild(row);
    });

    renderVacations();
}

// Renderizar blocos de férias e detectar conflitos
function renderVacations() {
    document.querySelectorAll('.vacation-block').forEach(block => block.remove());
    document.querySelectorAll('.conflict').forEach(cell => cell.classList.remove('conflict'));

    const occupiedDates = {};

    Object.keys(vacationData).forEach((employeeName, rowIndex) => {
        if (!tableBody.rows[rowIndex]) return;

        vacationData[employeeName].forEach((vacation, vacIndex) => {
            const startDate = new Date(vacation.start);
            const endDate = new Date(vacation.end);

            if (startDate.getFullYear() > currentYear || endDate.getFullYear() < currentYear) return;

            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (!occupiedDates[dateString]) occupiedDates[dateString] = [];
                occupiedDates[dateString].push({ employee: employeeName, vacIndex });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const startMonth = startDate.getMonth();
            const endMonth = endDate.getMonth();

            for (let month = startMonth; month <= endMonth; month++) {
                const yearOfBlock = (month < startMonth && startDate.getFullYear() === currentYear)
                    ? currentYear + 1 : currentYear;
                if (yearOfBlock !== currentYear) continue;

                const monthCellIndex = month + 1;
                const cell = tableBody.rows[rowIndex]?.cells[monthCellIndex];

                if (cell) {
                    const blockStartDate = (month === startMonth && startDate.getFullYear() === currentYear)
                        ? startDate : new Date(currentYear, month, 1);
                    const blockEndDate = (month === endMonth && endDate.getFullYear() === currentYear)
                        ? endDate : new Date(currentYear, month, daysInMonth[month]);

                    const startDayOfMonth = blockStartDate.getDate();
                    const endDayOfMonth = blockEndDate.getDate();
                    const totalDaysInBlock = Math.floor((blockEndDate - blockStartDate) / (1000 * 60 * 60 * 24)) + 1;
                    const blockWidthPercentage = (totalDaysInBlock / daysInMonth[month]) * 100;
                    const daysBeforeBlock = startDayOfMonth - 1;
                    const blockLeftPercentage = (daysBeforeBlock / daysInMonth[month]) * 100;

                    const vacationBlock = document.createElement('div');
                    vacationBlock.className = 'vacation-block';
                    vacationBlock.textContent = `${startDayOfMonth}-${endDayOfMonth}`;
                    vacationBlock.style.left = `${blockLeftPercentage}%`;
                    vacationBlock.style.width = `${blockWidthPercentage}%`;

                    // Adicionar botão de excluir
                    const deleteBtn = document.createElement('span');
                    deleteBtn.textContent = ' ✖ ';
                    deleteBtn.style.position = 'absolute';
                    deleteBtn.style.right = '2px';
                    deleteBtn.style.top = '2px';
                    deleteBtn.style.fontSize = '0.6rem';
                    deleteBtn.style.color = '#ef4444';
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.title = 'Apagar esta férias';

                    deleteBtn.onclick = () => {
                        vacationData[employeeName].splice(vacIndex, 1);
                        if (vacationData[employeeName].length === 0) {
                            delete vacationData[employeeName];
                        }
                        saveData();
                        renderTable();
                    };

                    vacationBlock.appendChild(deleteBtn);
                    cell.appendChild(vacationBlock);
                }
            }
        });
    });

    // Detectar conflitos
    Object.keys(occupiedDates).forEach(dateString => {
        if (occupiedDates[dateString].length > 1) {
            occupiedDates[dateString].forEach(({ employee }) => {
                const rowIndex = Array.from(tableBody.rows).findIndex(
                    row => row.cells[0].textContent === employee
                );
                if (rowIndex === -1) return;

                const date = new Date(dateString);
                const monthCellIndex = date.getMonth() + 1;
                const cell = tableBody.rows[rowIndex]?.cells[monthCellIndex];

                if (cell) {
                    cell.classList.add('conflict');
                    cell.setAttribute('data-conflict-tooltip', 
                        occupiedDates[dateString].map(e => e.employee).join(', ')
                    );
                }
            });
        }
    });
}

// Tooltip de Conflito
function showTooltip(cell, employeeName, monthIndex) {
    const tooltip = document.getElementById(`tooltip-${employeeName}-${monthIndex}`);
    if (!tooltip) return;
    tooltip.classList.add('show');
}

function hideTooltip(event) {
    const tooltip = event.target.querySelector('.tooltip');
    if (tooltip) tooltip.classList.remove('show');
}

// Exportar para CSV
window.exportToCSV = () => {
    let csv = 'Nome,Férias\n';

    Object.entries(vacationData).forEach(([name, vacations]) => {
        vacations.forEach(vac => {
            csv += `"${name}","${vac.start} até ${vac.end}"\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferias-${currentYear}.csv`;
    a.click();
};

// Evento de adição de férias
addVacationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const employeeName = employeeNameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!employeeName || !startDate || !endDate) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert("A data de início não pode ser posterior à data de fim.");
        return;
    }

    if (!vacationData[employeeName]) vacationData[employeeName] = [];
    vacationData[employeeName].push({ start: startDate, end: endDate });
    vacationData[employeeName].sort((a, b) => new Date(a.start) - new Date(b.start));

    saveData();
    renderTable();
    addVacationForm.reset();
});

// Mudança de ano
yearSelect.addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value);
    renderTable();
});

// Inicialização
loadData();
populateYearSelect();
renderTable();