// Вычисляет количество документов за каждый год
// для графиков, отображающих данные на временной шкале
export function getYearlyWeightsCounts(records) {
  const yearlyWeights = {};
  const yearlyCounts = {};

  // Общие вес и количество документов за каждый год
  // "год": вес
  // "год": количество
  records.forEach((record) => {
    const years = [];
    let counter = 0;

    if (record.dates.length > 0) {
      record.dates.forEach((dateRange) => {
        for (let year = dateRange.start; year <= dateRange.end; year++) {
          counter++;
          years.push(year);
        }
      });
    }

    for (const year of years) {
      yearlyWeights[year] = (yearlyWeights[year] || 0) + 1 / counter;
      yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
    }
  });

  // Полный диапазон дат
  // Отсутствующие годы добавляются на общую на шкалу
  const range = d3.range(
    d3.min(Object.keys(yearlyWeights), (d) => +d),
    d3.max(Object.keys(yearlyWeights), (d) => +d) + 1
  );
  
  // Года становятся значениями
  // Вес и количество объединяются в один объект
  // "year": год, "weight": вес, "count": количество
  // За отсутствовавшие года количество и вес заполняются нулями
  // Можно расчитать и добавить другие метрики
  const yearlyWeightsCounts = range.map((year) => {
    if (yearlyCounts[year]) {
      return {
        year,
        weight: yearlyWeights[year],
        count: yearlyCounts[year],
        precision: yearlyWeights[year] / yearlyCounts[year],
        /*
        avgDuration: yearlyCounts[year] / yearlyWeights[year],
        */
      };
    } else {
        return {
          year,
          weight: null,
          count: null,
          precision: null,
          /*
          avgDuration: 0,
          */
        };
      }
  });

  return yearlyWeightsCounts;
}

export function getMultipleYearlyWeightsCounts(records, suggestions, type) {
  const fieldYearlyWeightsCounts = {};
  for (const value of suggestions[type]) {
    const filtered = records.filter((record) =>
      (Array.isArray(record[type]) && record[type] !== null)
      ? record[type].some((v) => v === value)
      : (
        record[type] !== null
        ? record[type] === value
        : record[type]
      )
    );
    fieldYearlyWeightsCounts[value] = getYearlyWeightsCounts(filtered);
  }
  const multipleYearlyWeghtsCounts = Object.entries(fieldYearlyWeightsCounts)
  .flatMap(([key, valuesArray]) =>
    valuesArray.map(obj => ({ ...obj, key: key }))
  );
  return multipleYearlyWeghtsCounts;
}

export function getKeyCounts(records, suggestions, type) {
  const fieldKeyCounts = {};
  for (const value of suggestions[type]) {
    const filtered = records.filter((record) =>
      (Array.isArray(record[type]) && record[type] !== null)
      ? record[type].some((v) => v === value)
      : (
        record[type] !== null
        ? record[type] === value
        : record[type]
      )
    );
    fieldKeyCounts[value] = filtered.length;
  }
  return Object.entries(fieldKeyCounts).map(([key, count]) => ({key, count}));
}

// переработанные функции из v1 (переписал через Gemini под новый сайт)
// Gemini
export function getNetworkData(records, fieldName) {
  const nodesMap = {};
  records.forEach((record) => {
    const items = record[fieldName];
    if (Array.isArray(items)) {
      items.forEach((d) => {
        if (nodesMap[d]) {
          nodesMap[d].value += 1;
        } else {
          nodesMap[d] = {
            id: d,
            value: 1,
          };
        }
      });
    }
  });
  const nodes = Object.values(nodesMap);

  const linksMap = {};
  records.forEach((record) => {
    const items = record[fieldName];
    if (Array.isArray(items) && items.length > 1) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const source = items[i];
          const target = items[j];
          const key = [source, target].sort().join("|||"); 
          
          if (linksMap[key]) {
            linksMap[key].value += 1 / items.length;
          } else {
            linksMap[key] = {
              source: source,
              target: target,
              value: 1 / items.length,
            };
          }
        }
      }
    }
  });
  const links = Object.values(linksMap);

  const nodesLinkedIds = new Set();
  links.forEach((link) => {
    nodesLinkedIds.add(link.source);
    nodesLinkedIds.add(link.target);
  });

  return {
    nodes: nodes,
    links: links,
  };
}

// Gemini
export function getTreemapData(records) {
  const categoriesCounts = [];
  records.forEach((record) => {
    const categories = Array.isArray(record.category) ? record.category : [record.category];
    categories.forEach((cat) => {
      categoriesCounts.push({
        category: cat,
        subCategory: record.sub_category || "Без подрубрики",
        count: 1,
      });
    });
  });

  // Группировка
  const categorySubcategoryCounts = {};
  categoriesCounts.forEach((dict) => {
    const key = dict.category + "||" + dict.subCategory;
    if (!categorySubcategoryCounts[key]) {
      categorySubcategoryCounts[key] = { ...dict };
    } else {
      categorySubcategoryCounts[key].count += 1;
    }
  });

  const groupedCounts = d3.group(
    Object.values(categorySubcategoryCounts),
    (d) => d.category
  );

  const children = Array.from(groupedCounts, ([category, subCats]) => ({
    name: category,
    children: subCats.map(sc => ({ name: sc.subCategory, value: sc.count }))
  }));

  return { name: "Root", children };
}
