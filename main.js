import { spawnChart } from './scripts/addRemoveChart.js';
import { draw } from './scripts/charts.js';
import { createTable, getGridApi, applyTableState } from './scripts/table.js';

spawnChart();

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getUrlState() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  if (!s) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(s)));
  } catch (e) {
    console.error("Не удалось прочитать состояние из URL", e);
    return null;
  }
}

function updateUrlState() {
  const gridApi = getGridApi();
  const state = {
    search: document.getElementById('global-search').value || "",
    charts: []
  };

  document.querySelectorAll('.chart-container').forEach(container => {
    const select = container.querySelector('select.chart-select');
    if (select && select.value && select.value !== 'Выбрать график') {
      const [type, metric] = select.value.split('||');
      state.charts.push({
        type, metric,
        w: container.style.width,
        h: container.style.height
      });
    }
  });

  if (gridApi) {
    state.filters = gridApi.getFilterModel();
    const cols = gridApi.getAllGridColumns ? gridApi.getAllGridColumns() : gridApi.getAllColumns();
    if (cols) {
      state.cols = cols.filter(c => c.isVisible()).map(c => c.getColId());
    }
  }

  const stateStr = btoa(encodeURIComponent(JSON.stringify(state)));
  const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?s=' + stateStr;
  window.history.replaceState({ path: newUrl }, '', newUrl);
}

const debouncedUpdateUrl = debounce(updateUrlState, 500);

window.addEventListener('tableStateChanged', debouncedUpdateUrl);
window.addEventListener('chartStateChanged', debouncedUpdateUrl);

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
      debouncedUpdateUrl();
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
          const container = addChartBtns[i].parentNode.parentNode;
          
          new ResizeObserver(debouncedUpdateUrl).observe(container);

          addChartBtns[i].addEventListener('click', () => {
            addChart(container, records, suggestions);
            debouncedUpdateUrl();
          });
        }
        listendButtons.push(addChartBtns[i].id);
      }
    });
    
    function spawnDefaultCharts() {
      const urlState = getUrlState();
      let configsToSpawn = [];

      if (urlState && urlState.charts && urlState.charts.length > 0) {
        configsToSpawn = urlState.charts;
      } else {
        configsToSpawn = [
          { type: 'Диаграмма с накоплением по архивам', metric: 'Всего описательных статей', w: '55vw', h: '45vh' },
          { type: 'Сетевой граф по адресам', metric: 'Всего описательных статей', w: '30vw', h: '45vh' },
          
          { type: 'Диаграмма с накоплением по архивам', metric: 'Вес', w: '55vw', h: '45vh' },
          { type: 'Древовидная карта рубрик и подрубрик', metric: 'Всего описательных статей', w: '30vw', h: '45vh' },
          
          { type: 'Древовидная карта архивов, фондов, описей и дел', metric: 'Всего описательных статей', w: '78vw', h: '82vh' },
          
          { type: 'Диаграмма / Архив', metric: 'Всего описательных статей', w: '23vw', h: '35vh' },
          { type: 'Диаграмма / Вид документа', metric: 'Всего описательных статей', w: '26vw', h: '35vh' },
          { type: 'Диаграмма / Носитель', metric: 'Всего описательных статей', w: '23vw', h: '35vh' }
        ];
      }

      configsToSpawn.forEach(conf => {
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

      if (urlState) {
        applyTableState(urlState);
      }
    }

    setTimeout(spawnDefaultCharts, 100);
  })
  .catch((err) => {
    console.error(err);
  });
