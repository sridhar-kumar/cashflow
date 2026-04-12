let salary = 0;
let expenses = [];
let chart;
let currency = "INR";
let rate = 1;

// Chart center plugin
Chart.register({
  id: 'centerText',
  beforeDraw(chart) {
    const { width, height, ctx } = chart;

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = salary - total;

    ctx.restore();
    ctx.font = "bold 16px Inter";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";

    ctx.fillText("Balance", width / 2, height / 2 - 10);
    ctx.fillText(convert(balance), width / 2, height / 2 + 15);
    ctx.save();
  }
});

window.onload = function () {
  const saved = JSON.parse(localStorage.getItem("data"));

  if (saved) {
    salary = saved.salary;
    expenses = saved.expenses;
  }

  document.getElementById("salaryDisplay").innerText = salary;

  renderExpenses();
  updateBalance();
  updateChart();
};

function addExpense() {
  const salaryInput = document.getElementById("salary").value;
  const name = document.getElementById("expenseName").value;
  const amount = document.getElementById("expenseAmount").value;

  if (salaryInput) {
    salary = Number(salaryInput);
    document.getElementById("salaryDisplay").innerText = salary;
  }

  if (!name || amount <= 0) {
    alert("Invalid input");
    return;
  }

  expenses.push({
    id: Date.now(),
    name,
    amount: Number(amount)
  });

  save();
  renderExpenses();
  updateBalance();
  updateChart();
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  expenses.forEach(exp => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${exp.name} - ${convert(exp.amount)}
      <span class="delete" onclick="deleteExpense(${exp.id})">🗑</span>
    `;

    list.appendChild(li);
  });
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  save();
  renderExpenses();
  updateBalance();
  updateChart();
}

function updateBalance() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = salary - total;

  const el = document.getElementById("balance");
  el.innerText = convert(balance);

  if (balance < salary * 0.1) {
    el.style.color = "red";
    alert("⚠️ Low Balance!");
  } else {
    el.style.color = "white";
  }
}

function save() {
  localStorage.setItem("data", JSON.stringify({ salary, expenses }));
}

function updateChart() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = salary - total;

  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Expenses", "Balance"],
      datasets: [{
        data: [total, balance],
        backgroundColor: ["#ec4899", "#22c55e"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "75%",
      animation: {
        duration: 800
      },
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      }
    }
  });
}

async function convertCurrency() {
  currency = document.getElementById("currency").value;

  if (currency === "USD") {
    const res = await fetch("https://api.frankfurter.app/latest?from=INR&to=USD");
    const data = await res.json();
    rate = data.rates.USD;
  } else {
    rate = 1;
  }

  renderExpenses();
  updateBalance();
}

function convert(value) {
  return currency === "USD"
    ? "$" + (value * rate).toFixed(2)
    : "₹" + value;
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Cash Flow Report", 10, 10);
  doc.text("Salary: " + salary, 10, 20);

  let y = 30;

  expenses.forEach(e => {
    doc.text(`${e.name} - ${e.amount}`, 10, y);
    y += 10;
  });

  doc.save("report.pdf");
}