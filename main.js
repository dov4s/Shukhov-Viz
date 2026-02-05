import { spawnChart } from './scripts/addRemoveChart.js';
import { draw } from './scripts/charts.js';
import { createTable } from './scripts/table.js';

spawnChart();

function addChart(chartContainer, records, suggestions) {
  if (chartContainer.children.length !==2) {
    const g = document.createElement('div');
    g.setAttribute('class', 'g');
    chartContainer.appendChild(g);

    g.chartData = records;

    const select = chartContainer.querySelector('select.chart-select');
    const chartType = select.options[select.selectedIndex].parentElement.label;
    const chartMetric = select.value.split('||')[1];
    
    let timeout;
    new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        draw(chartType, chartMetric, g.chartData, suggestions, g);
      }, 150);
    }).observe(g);
  } else {
    const g = chartContainer.getElementsByClassName('g')[0];
    g.remove();

    addChart(chartContainer, records, suggestions);
  }
}

d3.json("data.json")
  .then(function (db) {
    let records = db["records"];
    const suggestions = db["suggestions"];

    createTable(records, suggestions, (filtered) => {
      records = filtered;
      drawAllCharts(filtered, suggestions);
    });
    function drawAllCharts(filtered, suggestions) {
      const chartContainers = Array.from(document.getElementsByClassName("g"));
      let i = 0;
      function step() {
        if (i >= chartContainers.length) return;
        const g = chartContainers[i];
        g.processedData = null; 
        g.chartData = filtered;
        const chartContainer = g.parentNode;
        const select = chartContainer.querySelector('select.chart-select');
        const chartType = select.options[
          select.selectedIndex
        ].parentElement.label;
        const parentChartType = select.options[
          select.selectedIndex
        ].parentElement.parentElement.label;
        console.log(parentChartType);
        console.log(chartType);
        const chartMetric = select.value.split('||')[1];
        draw(chartType, chartMetric, filtered, suggestions, g);
        i++;
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }
    
    const listendButtons = [];

    const addContainerBtn = document.getElementById('add-chart-container-btn');
    addContainerBtn.addEventListener('click', function () {
      const addChartBtns = document.getElementsByClassName('add-chart-btn');

      for (let i = 0; i < addChartBtns.length; i++) {
        if (!listendButtons.includes(addChartBtns[i].id)) {
          const container =  addChartBtns[i].parentNode.parentNode;
          addChartBtns[i].addEventListener('click', () =>
            addChart(
              container,
              records,
              suggestions
            ),
          );
        }
        listendButtons.push(addChartBtns[i].id);
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
