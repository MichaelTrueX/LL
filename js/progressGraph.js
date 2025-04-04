"use strict";

function loadProgressGraph() {
  clearContent();
  const container = document.getElementById("content");
  if (!container) {
    console.error("Container with id 'content' not found.");
    return;
  }
  container.innerHTML = `
    <h2>Progress Graph</h2>
    <h3>Knowledge Levels</h3>
    <canvas id="knowledgeChart" width="400" height="200"></canvas>
    <h3>CSV Load Log</h3>
    <label for="logPeriodSelector">Select Period:</label>
    <select id="logPeriodSelector">
      <option value="week">Week</option>
      <option value="month" selected>Month</option>
      <option value="year">Year</option>
    </select>
    <canvas id="logChart" width="400" height="200"></canvas>
  `;
  const ctx1 = document.getElementById("knowledgeChart").getContext("2d");
  let knowledgeCounts = {};
  getUserWords().then(userWords => {
    userWords.forEach(word => {
      const level = word.knowledge;
      knowledgeCounts[level] = (knowledgeCounts[level] || 0) + 1;
    });
    const knowledgeLevels = Object.keys(knowledgeCounts).sort();
    const knowledgeData = knowledgeLevels.map(level => knowledgeCounts[level]);
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: knowledgeLevels,
        datasets: [{
          label: 'Words per Knowledge Level',
          data: knowledgeData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }).catch(err => {
    console.error("Error retrieving user words for chart:", err);
  });
  const ctx2 = document.getElementById("logChart").getContext("2d");
  let logChart;
  function updateLogChart(period) {
    getLogData().then(logData => {
      const dates = logData.map(entry => entry.date);
      const counts = logData.map(entry => entry.count);
      if (logChart) {
        logChart.data.labels = dates;
        logChart.data.datasets[0].data = counts;
        logChart.update();
      } else {
        logChart = new Chart(ctx2, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'Number of Words Loaded',
              data: counts,
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
              fill: true
            }]
          },
          options: { scales: { y: { beginAtZero: true } } }
        });
      }
    }).catch(err => {
      console.error("Error retrieving log data:", err);
    });
  }
  const periodSelector = document.getElementById("logPeriodSelector");
  updateLogChart(periodSelector.value);
  periodSelector.addEventListener("change", function() {
    updateLogChart(this.value);
  });
}
