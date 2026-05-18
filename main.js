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
    
    function spawnDefaultCharts() {

      const defaultConfigs = [
        { type: 'Диаграмма с накоплением по архивам', metric: 'Количество', w: '60vw', h: '45vh' },
        { type: 'Сетевой граф по локациям', metric: 'Количество', w: '32vw', h: '45vh' },
        
        { type: 'Диаграмма с накоплением по архивам', metric: 'Вес', w: '60vw', h: '45vh' },
        { type: 'Древовидная карта рубрик и подрубрик', metric: 'Количество', w: '32vw', h: '45vh' },
        
        { type: 'Древовидная карта архивов, фондов, описей и дел', metric: 'Количество', w: '78vw', h: '82vh' },
        
        { type: 'Диаграмма / Архив', metric: 'Количество', w: '23vw', h: '35vh' },
        { type: 'Диаграмма / Вид документа', metric: 'Количество', w: '26vw', h: '35vh' },
        { type: 'Диаграмма / Носитель', metric: 'Количество', w: '23vw', h: '35vh' }
      ];

      defaultConfigs.forEach(conf => {
        addContainerBtn.click();
        
        const containers = document.getElementsByClassName('chart-container');
        const lastConfig = containers[containers.length - 1];
        
        lastConfig.style.width = conf.w;
        lastConfig.style.height = conf.h;
        
        const select = lastConfig.querySelector('select.chart-select');
        const addBtn = lastConfig.querySelector('.add-chart-btn');
        const displayDiv = lastConfig.querySelector('.selected-value');
        
        const targetValue = `${conf.type}||${conf.metric}`;
        Array.from(select.options).forEach((opt, idx) => {
            if(opt.value === targetValue) select.selectedIndex = idx;
        });
        
        if (displayDiv) displayDiv.textContent = `${conf.type} / ${conf.metric}`;
        
        addBtn.click();
      });
    }

    // Запускаем через небольшую задержку, чтобы DOM успел построиться
    setTimeout(spawnDefaultCharts, 100);
  })
  .catch((err) => {
    console.error(err);
  });
