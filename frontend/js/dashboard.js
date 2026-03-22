async function loadDashboard() {
  const [patients, doctors, appointments, bills] = await Promise.all([
    apiFetch('/patients'),
    apiFetch('/doctors'),
    apiFetch('/appointments'),
    apiFetch('/billing'),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.appt_date?.startsWith(todayStr));
  const unpaid = bills.filter(b => !b.paid);

  document.getElementById('page-dashboard').innerHTML = `
    <h1>Dashboard</h1>
    <p class="sub">Hospital overview at a glance</p>
    <div class="stats">
      <div class="stat-card blue"><div class="label">Total Patients</div><div class="value">${patients.length}</div></div>
      <div class="stat-card green"><div class="label">Doctors</div><div class="value">${doctors.length}</div></div>
      <div class="stat-card warn"><div class="label">Today's Appointments</div><div class="value">${todayAppts.length}</div></div>
      <div class="stat-card red"><div class="label">Unpaid Bills</div><div class="value">${unpaid.length}</div></div>
    </div>

    <div class="section">
      <h2>Today's Appointments</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            ${todayAppts.length
              ? todayAppts.map(a => `
                <tr>
                  <td>${a.patient_name}</td>
                  <td>${a.doctor_name}</td>
                  <td>${a.appt_time}</td>
                  <td>${badgeStatus(a.status)}</td>
                </tr>`).join('')
              : '<tr><td colspan="4" class="empty">No appointments today</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}