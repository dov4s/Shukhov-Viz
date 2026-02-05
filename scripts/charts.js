import * as processData from './processData.js';
 
const METRIC_KEYS = {
  'Количество': 'count',
  'Вес': 'weight',
  'Интенсивность': 'precision'
};

export function draw(chartType, chartMetric, records, suggestions, g) {  
  if (
    !g.data
    || (
      (g.lastChartType !== chartType)
      || (g.records !== records)
    )
  ) {
    let data;
    // Линейные графики
    if (chartType === 'Линейный график') {
      data = processData.getYearlyWeightsCounts(records);
      g.drawFunction = lineChart;
      lineChart(data, chartMetric, g);
    }
    // Treemap
    else if (chartType === 'Древовидная карта рубрик и подрубрик') {
      data = processData.getTreemapData(records);
      g.drawFunction = treemapChart;
      treemapChart(data, chartMetric, g, suggestions);
    }
    // Диаграммы с накоплением
    else if (chartType === 'Накопление / Вид документа') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'form'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['form'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Носитель') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'medium'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['medium'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Рубрика') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'category'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['category'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Подрубрика') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'sub_category'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['category'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Дескрипторы') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'descriptors'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['descriptors'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Локация') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'location'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['location'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Язык') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'language'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['language'];
      stackedBarChart(data, chartMetric, g);
    } else if (chartType === 'Накопление / Сведения о ценности') {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'appraisal'
      );
      g.drawFunction = stackedBarChart;
      stackedBarChart(data, chartMetric, g);
    } else if (
      chartType === 'Накопление / Архив'
      || chartType === 'Диаграмма с накоплением по архивам'
    ) {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'archive_name'
      );
      g.drawFunction = stackedBarChart;
      g.colorDomain = suggestions['archive_name'];
      stackedBarChart(data, chartMetric, g);
    } else if (
      chartType === 'Накопление / Необходимость реставрации'
    ) {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'conservation_status'
      );
      g.drawFunction = stackedBarChart;
      stackedBarChart(data, chartMetric, g);
    } else if (
      chartType === 'Накопление / Сведения о копийности'
    ) {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'digital_copy_available'
      );
      g.drawFunction = stackedBarChart;
      stackedBarChart(data, chartMetric, g);
    } else if (
      chartType === 'Накопление / Наличие автографа'
    ) {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'autograph_note'
      );
      g.drawFunction = stackedBarChart;
      stackedBarChart(data, chartMetric, g);
    } else if (
      chartType === 'Накопление / Сведения о копийности'
    ) {
      data = processData.getMultipleYearlyWeightsCounts(
        records, suggestions, 'originality_status'
      );
      g.drawFunction = stackedBarChart;
      stackedBarChart(data, chartMetric, g);
    }
    // Столбчатые диаграммы
    else if (chartType === 'Диаграмма / Вид документа') {
      data = processData.getKeyCounts(
        records, suggestions, 'form'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Носитель') {
      data = processData.getKeyCounts(
        records, suggestions, 'medium'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Рубрика') {
      data = processData.getKeyCounts(
        records, suggestions, 'category'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Подрубрика') {
      data = processData.getKeyCounts(
        records, suggestions, 'sub_category'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Дескрипторы') {
      data = processData.getKeyCounts(
        records, suggestions, 'descriptors'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Локация') {
      data = processData.getKeyCounts(
        records, suggestions, 'location'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Язык') {
      data = processData.getKeyCounts(
        records, suggestions, 'language'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Сведения о ценности') {
      data = processData.getKeyCounts(
        records, suggestions, 'appraisal'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (chartType === 'Диаграмма / Архив') {
      data = processData.getKeyCounts(
        records, suggestions, 'archive_name'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (
      chartType === 'Диаграмма / Необходимость реставрации'
    ) {
      data = processData.getKeyCounts(
        records, suggestions, 'conservation_status'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (
      chartType === 'Диаграмма / Наличие цифровой копии'
    ) {
      data = processData.getKeyCounts(
        records, suggestions, 'digital_copy_available'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (
      chartType === 'Диаграмма / Наличие автографа'
    ) {
      data = processData.getKeyCounts(
        records, suggestions, 'autograph_note'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } else if (
      chartType === 'Диаграмма / Сведения о копийности'
    ) {
      data = processData.getKeyCounts(
        records, suggestions, 'originality_status'
      );
      g.drawFunction = barChart;
      barChart(data, chartMetric, g);
    } 
    // Сетевые графы
    else if (
      chartType === 'Сетевой граф по рубрикам'
    ) {
      data = processData.getNetworkData(records, 'category');
      g.drawFunction = networkChart;
      networkChart(data, chartMetric, g);
    }
    else if (
      chartType === 'Сетевой граф по подрубрикам'
    ) {
      data = processData.getNetworkData(records, 'sub_category');
      g.drawFunction = networkChart;
      networkChart(data, chartMetric, g);
    }
    else if (
      chartType === 'Сетевой граф по локациям'
    ) {
      data = processData.getNetworkData(records, 'location');
      g.drawFunction = networkChart;
      networkChart(data, chartMetric, g);
    }
    else if (
      chartType === 'Сетевой граф по дескрипторам'
    ) {
      data = processData.getNetworkData(records, 'descriptors');
      g.drawFunction = networkChart;
      networkChart(data, chartMetric, g);
    }

    g.data = data;
    g.lastChartType = chartType;
    g.lastChartMetric = chartMetric;
    g.records = records;
    // + g.drawFunction
    // + g.colorDomain
  } else {
    g.drawFunction(g.data, chartMetric, g);
  }
}

function lineChart(data, chartMetric, g) {
  g.innerHTML = '';
  const plot = Plot.lineY(
    data,
    {
      x: 'year',
      y: METRIC_KEYS[chartMetric],
      channels: {
        count: 'Количество',
        weight: 'Вес',
        precision: 'Интенсивность',
      },
      marker: true,
      tip: {
        format: {
          x: d3.format('.0f'),           
        }
      },
    }
    
  ).plot({
    width: g.clientWidth,
    height: g.clientHeight,
    x: {
      label: 'Год',
      grid: true,
      ticks: 10,
      tickFormat: d3.format('.0f')
    },
    y: {
      label: chartMetric,
      grid: true,
    },
    style: {
      fontSize: '14px',
    },
  });

  g.appendChild(plot);
}

function stackedBarChart(data, chartMetric, g) {
  g.innerHTML = '';

  let dropNaData = data.filter(d => d[METRIC_KEYS[chartMetric]] != null);
  const [minYear, maxYear] = d3.extent(dropNaData, (d) => d.year);
  const tickValues = d3.ticks(minYear, maxYear, 10);

  const plot = Plot.barY(
    dropNaData, 
    {
      x: 'year',
      y: METRIC_KEYS[chartMetric],
      fill: 'key',
      tip: {
        format: {
          x: d3.format('.0f'),           
        }
      },
      channels: {
      },
    },
  ).plot({
    width: g.clientWidth,
    height: g.clientHeight,
    x: {
      label: 'Год',
      grid: true,
      tickFormat: d3.format('.0f'),
      ticks: tickValues,
      domain: d3.range(
        minYear, maxYear + 1
      )
    },
    y: {
      label: chartMetric,
      grid: true,
    },
    color: {
      range: d3.schemeObservable10,
      // [
      //   "#ff7f00", "#33a02c", "#1f78b4", "#e31a1c", "#b2df8a",
      //   "#fb9a99", "#a6cee3", "#984ea3", "#f781bf",
      // ],

      domain: g.colorDomain,
      legend: true,
    },
    style: {
      fontSize: '14px',
    },
  });
  g.appendChild(plot);
}

function barChart(data, chartMetric, g) {
  g.innerHTML = '';

  let dropNaData = data
    .filter(d => d[METRIC_KEYS[chartMetric]] != 0)
    .sort((a, b) => b.count - a.count);

  // функция от ChatGPT (авто-вычисление ширины для лейблов)
  function computeTextWidth(text, font = '14px Arial') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  const labels = dropNaData.map(d => d.key);
  const maxWidth = Math.max(...labels.map(l => computeTextWidth(l)));

  const plot = Plot.barX(
    dropNaData, 
    {
      x: METRIC_KEYS[chartMetric],
      y: 'key',
      fill: '#1f78b4',
      tip: true,
      channels: {
        count: 'Количество',
      },
    },
  ).plot({
    width: g.clientWidth,
    height: g.clientHeight,
    marginLeft: maxWidth + 40,
    x: {
      label: 'Количество',
      grid: true,
      tickFormat: d3.format('.0f'),
      ticks: 5,
    },
    y: {
      domain: dropNaData.map(d => d.key),
      grid: true,
    },
    style: {
      fontSize: '14px',
    },
  });

  g.appendChild(plot);
}

// Функции из v1, адаптированные через Gemini под новый сайт
// Gemini + редактирование
function networkChart(data, chartMetric, g) {
  g.innerHTML = '';

  const nodes = data.nodes.map((d) => ({
    ...d,
    size: 5 + Math.pow(d.value, 0.5)
  }));
  const links = data.links.map(d => ({ ...d }));

  const width = g.clientWidth;
  const height = g.clientHeight;

  // Создаем SVG
  const svg = d3.select(g)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("overflow", "hidden"); // Чтобы не вылезало

  // Группа для зума
  const zoomableG = svg.append("g").attr("class", "network-container");
  const linksG = zoomableG.append("g").attr("class", "links");
  const nodesG = zoomableG.append("g").attr("class", "nodes");
  const labelsG = zoomableG.append("g").attr("class", "labels");
  
  // Тултип
  const tooltip = d3.select(g)
    .append("div")
    .attr("class", "tooltip");

  // Связи
  const linkElements = linksG
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "#999")
    .style("stroke-width", 0.6)
    .style("opacity", 0.5);

  // Узлы
  const nodeElements = nodesG
    .selectAll("rect") // Или circle, как в оригинале использовали rect
    .data(nodes)
    .join("rect")
    .attr("width", (d) => d.size)
    .attr("height", (d) => d.size)
    .attr("fill", "#1F78B4")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer");

  // Подписи
  const labelElements = labelsG
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text(d => d.id) // Текст подписи (название локации)
    .attr("font-size", 4)
    .attr("fill", "#333") // Цвет текста
    .style("pointer-events", "none")
    .style("text-anchor", "middle")
    .style("font-family", "Arial, sans-serif");

  // Интерактивность (Mouseover / Tooltip)
  nodeElements
    .on("mouseover", (event, d) => {
      // Текст тултипа
      tooltip.html(`${d.id}<br><strong>Количество</strong> ${d.value}`)
        .style("opacity", 1);

      // Подсветка узла
      d3.select(event.currentTarget).attr("fill", "red");

      // Подсветка связей
      linkElements
        .filter((l) => l.source.id === d.id || l.target.id === d.id)
        .attr("stroke", "orange")
        .style("stroke-width", 1.5)
        .style("opacity", 1)
        .raise(); // Поднять наверх

      // Подсветка соседей
      const neighborIds = new Set();
      links.forEach(l => {
        if (l.source.id === d.id) neighborIds.add(l.target.id);
        if (l.target.id === d.id) neighborIds.add(l.source.id);
      });

      nodeElements
        .filter(n => neighborIds.has(n.id))
        .attr("fill", "orange");
    })
    .on("mousemove", (event) => {
      // Позиционирование тултипа относительно контейнера g
      // getBoundingClientRect нужен, чтобы тултип не улетал, если страница прокручена
      const containerRect = g.getBoundingClientRect();
      tooltip
        .style("left", `${containerRect.left + event.offsetX}px`)
        .style("top", `${containerRect.top + event.offsetY}px`);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
      nodeElements.attr("fill", "#1f78b4");
      linkElements
        .attr("stroke", "#999")
        .style("stroke-width", 0.6)
        .style("opacity", 0.5);
    });

  // Симуляция (Force Simulation)
  const simulation = d3.forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links)
        .id(d => d.id)
        .distance(d => d.value)
        .strength(0.5)
    ) // Адаптировал дистанцию
    .force("charge", d3.forceManyBody().strength(-300))
    .force("x", d3.forceX(width / 2).strength(0.7))
    .force("y", d3.forceY(height / 2).strength(0.7))
    .stop();

  // Статический пре-рендер
  const ticks = 300; 
  for (let i = 0; i < ticks; ++i) simulation.tick();

  // Применяем координаты после тиков
  linkElements
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  nodeElements
    .attr("x", d => d.x - d.size / 2)
    .attr("y", d => d.y - d.size / 2);

  labelElements
    .attr("x", d => {
       return d.x; 
    })
    .attr("y", d => {
       return d.y + 5 + d.size / 2; 
    });

  // Zoom / Pan
  const zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .on("zoom", (event) => {
      zoomableG.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Функция авто-зума (Fit to view)
  function fitGraphToView() {
    const bounds = zoomableG.node().getBBox();
    const parent = svg.node().getBoundingClientRect();
    const fullWidth = parent.width;
    const fullHeight = parent.height;

    const { x, y, width: bWidth, height: bHeight } = bounds;

    if (bWidth === 0 || bHeight === 0) return;

    const midX = x + bWidth / 2;
    const midY = y + bHeight / 2;
    
    // Вычисляем масштаб с небольшим отступом (0.9)
    const scale = 0.9 / Math.max(bWidth / fullWidth, bHeight / fullHeight);
    const translate = [
      fullWidth / 2 - scale * midX,
      fullHeight / 2 - scale * midY,
    ];

    svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }

  // Вызываем автозум после отрисовки
  fitGraphToView();
}

// Gemini + редактирование
function treemapChart(data, chartMetric, g, suggestions) {
  g.innerHTML = '';
  g.style.position = 'relative';

  const width = g.clientWidth;
  const height = g.clientHeight;

  const svg = d3.select(g)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("display", "block");


  const allCategories = suggestions && suggestions['category'] ? suggestions['category'] : [];

  const colorScale = d3.scaleOrdinal()
    .domain(allCategories)
    .range(d3.schemeTableau10);

  // Создаем иерархию
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  // Раскладка
  d3.treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(30)
    .paddingInner(1)
    (root);

  // Тултип (глобальный fixed, как мы делали ранее)
  const tooltip = d3.select(g)
    .append("div")
    .attr("class", "tooltip");

  // Слои
  const treemapG = svg.append("g").attr("id", "treemap-main");
  const highlightG = svg.append("g").attr("id", "treemap-highlight");
  const hoverG = svg.append("g").attr("id", "treemap-hover");

  const nodes = root.descendants().filter(d => d.depth > 0);

  // 1. Основной слой
  treemapG.selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => {
      if (d.depth === 2) {
        return d3.color(colorScale(d.parent.data.name)).brighter(0.5);
      } else {
        return colorScale(d.data.name);
      }
    })
    .attr("stroke", "#fff");

  // Добавляем текст для рубрик (заголовки)
  treemapG.selectAll(".category-label")
    .data(nodes.filter(d => d.depth === 1))
    .join("text")
    .attr("x", d => d.x0 + 5)
    .attr("y", d => d.y0 + 20)
    .text(d => d.data.name)
    .attr("font-size", "14px")
    .style("pointer-events", "none")
    .style("display", function(d) {
      const availableWidth = d.x1 - d.x0 - 10;
      const textWidth = this.getComputedTextLength();
      return textWidth > availableWidth ? "none" : "block";
    });
  
  // Текст подрубрик
  treemapG.selectAll(".subcategory-label")
    .data(nodes.filter(d => d.depth === 2))
    .join("text")
    .attr("class", "subcategory-label")
    .attr("x", d => (d.x0 + d.x1) / 2) // Центр по X
    .attr("y", d => (d.y0 + d.y1) / 2 + 4) // Центр по Y
    .text(d => d.data.name)
    .attr("font-size", "12px")
    .style("pointer-events", "none")
    .style("text-anchor", "middle") // Центровка текста
    .style("display", function(d) {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      const textWidth = this.getComputedTextLength();
      if (textWidth > w - 4 || h < 15 || w < 20) {
        return "none";
      }
      return "block";
    });

  // 2. Слой подсветки
  const highlights = highlightG.selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "#00000027")
    .attr("stroke", "red")
    .attr("stroke-width", 4)
    .style("opacity", 0)
    .style("pointer-events", "none");

  // 3. Слой взаимодействия
  hoverG.selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      // Все узлы с таким же именем
      highlights
        .filter(node => node.data.name === d.data.name)
        .style("opacity", 1);

      // Тултип
      const svgRect = svg.node().getBoundingClientRect();
      tooltip.html(`
        ${d.data.name}<br>
        <strong>Количество</strong> ${d.value}
      `)
      .style("left", `${svgRect.left + event.offsetX}px`)
      .style("top", `${svgRect.top + event.offsetY}px`)
      .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      const svgRect = svg.node().getBoundingClientRect();
      tooltip
        .style("left", `${svgRect.left + event.offsetX}px`)
        .style("top", `${svgRect.top + event.offsetY}px`);
    })
    .on("mouseout", () => {
      highlights.style("opacity", 0);
      tooltip.style("opacity", 0);
    });
}
