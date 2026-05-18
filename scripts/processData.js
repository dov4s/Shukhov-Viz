const ABS_MIN_YEAR = 1854;
const ABS_MAX_YEAR = 1937;

// Вычисляет количество документов за каждый год
export function getYearlyWeightsCounts(records) {
  const yearlyStats = {};

  records.forEach((record) => {
    let years = [];
    let counter = 0;

    // Раскрытие дат с учетом до/после
    if (record.dates && record.dates.length > 0) {
      record.dates.forEach((dateRange) => {
        let start = dateRange.start;
        let end = dateRange.end;
        
        if (dateRange.certainty === 'before') start = ABS_MIN_YEAR;
        if (dateRange.certainty === 'after') end = ABS_MAX_YEAR;

        for (let year = start; year <= end; year++) {
          counter++;
          years.push(year);
        }
      });
    }

    // Штраф для дубликатов: вес делится пополам
    const isDupe = record.probably_duplicated === 'Возможно';
    const isDoc = record.probably_document === 'Вероятно';
    const weightModifier = isDupe ? 0.5 : 1;

    for (const year of years) {
      if (!yearlyStats[year]) {
        yearlyStats[year] = { weight: 0, count: 0, docs: 0, nonDocs: 0, dupes: 0, rawDates: {} };
      }
      yearlyStats[year].weight += weightModifier / counter;
      yearlyStats[year].count += 1;
      
      if (isDoc) yearlyStats[year].docs += 1; 
      else yearlyStats[year].nonDocs += 1;
      
      if (isDupe) yearlyStats[year].dupes += 1;

      // Собираем оригинальные строковые даты
      if (record.raw_dates) {
        yearlyStats[year].rawDates[record.raw_dates] = (yearlyStats[year].rawDates[record.raw_dates] || 0) + 1;
      }
    }
  });

  const yearsObj = Object.keys(yearlyStats);
  if (yearsObj.length === 0) return [];
  
  const minYear = d3.min(yearsObj, (d) => +d);
  const maxYear = d3.max(yearsObj, (d) => +d);
  const range = d3.range(minYear, maxYear + 1);
  
  return range.map((year) => {
    if (yearlyStats[year]) {
      const stats = yearlyStats[year];
      
      // Высчитываем Топ-3 дат и количество уникальных
      const sortedDates = Object.entries(stats.rawDates).sort((a, b) => b[1] - a[1]);
      const topDatesStr = sortedDates.slice(0, 3).map(d => `${d[0]} (${d[1]})`).join(', ');
      
      return {
        year,
        weight: stats.weight,
        count: stats.count,
        precision: stats.weight / stats.count,
        docs: stats.docs,
        nonDocs: stats.nonDocs,
        dupes: stats.dupes,
        topDates: topDatesStr,
        uniqueDates: sortedDates.length
      };
    } else {
        return {
          year, weight: null, count: null, precision: null, 
          docs: null, nonDocs: null, dupes: null, topDates: null, uniqueDates: null
        };
    }
  });
}

export function getMultipleYearlyWeightsCounts(records, suggestions, type) {
  const fieldYearlyWeightsCounts = {};
  for (const value of suggestions[type]) {
    const filtered = records.filter((record) =>
      (Array.isArray(record[type]) && record[type] !== null)
      ? record[type].some((v) => v === value)
      : (record[type] !== null ? record[type] === value : record[type])
    );
    fieldYearlyWeightsCounts[value] = getYearlyWeightsCounts(filtered);
  }
  return Object.entries(fieldYearlyWeightsCounts)
    .flatMap(([key, valuesArray]) => valuesArray.map(obj => ({ ...obj, key: key })));
}

export function getKeyCounts(records, suggestions, type) {
  const result = [];
  for (const value of suggestions[type]) {
    const filtered = records.filter((record) =>
      (Array.isArray(record[type]) && record[type] !== null)
      ? record[type].some((v) => v === value)
      : (record[type] !== null ? record[type] === value : record[type])
    );
    
    let docs = 0, nonDocs = 0, dupes = 0;
    filtered.forEach(r => {
      if (r.probably_document === 'Вероятно') docs++; else nonDocs++;
      if (r.probably_duplicated === 'Возможно') dupes++;
    });

    result.push({ 
        key: value, count: filtered.length, 
        docs: docs, nonDocs: nonDocs, dupes: dupes 
    });
  }
  return result;
}

export function getNetworkData(records, fieldName) {
  const nodesMap = {};
  records.forEach((record) => {
    const isDoc = record.probably_document === 'Вероятно';
    const isDupe = record.probably_duplicated === 'Возможно';
    
    const items = record[fieldName];
    if (Array.isArray(items)) {
      items.forEach((d) => {
        if (nodesMap[d]) {
          nodesMap[d].value += 1;
          if (isDoc) nodesMap[d].docsCount += 1; else nodesMap[d].nonDocsCount += 1;
          if (isDupe) nodesMap[d].dupesCount += 1;
        } else {
          nodesMap[d] = {
            id: d, value: 1, 
            docsCount: isDoc ? 1 : 0, 
            nonDocsCount: isDoc ? 0 : 1, 
            dupesCount: isDupe ? 1 : 0
          };
        }
      });
    }
  });
  
  const linksMap = {};
  records.forEach((record) => {
    const items = record[fieldName];
    if (Array.isArray(items) && items.length > 1) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const source = items[i];
          const target = items[j];
          const key = [source, target].sort().join("|||"); 
          
          if (linksMap[key]) linksMap[key].value += 1 / items.length;
          else linksMap[key] = { source: source, target: target, value: 1 / items.length };
        }
      }
    }
  });

  return { nodes: Object.values(nodesMap), links: Object.values(linksMap) };
}

export function getTreemapData(records) {
  const categoriesCounts = [];
  records.forEach((record) => {
    const categories = Array.isArray(record.category) ? record.category : [record.category];
    categories.forEach((cat) => {
      categoriesCounts.push({
        category: cat,
        subCategory: record.sub_category || "Без подрубрики",
        count: 1,
        docs: record.probably_document === 'Вероятно' ? 1 : 0,
        nonDocs: record.probably_document !== 'Вероятно' ? 1 : 0,
        dupes: record.probably_duplicated === 'Возможно' ? 1 : 0
      });
    });
  });

  const categorySubcategoryCounts = {};
  categoriesCounts.forEach((dict) => {
    const key = dict.category + "||" + dict.subCategory;
    if (!categorySubcategoryCounts[key]) {
      categorySubcategoryCounts[key] = { ...dict };
    } else {
      categorySubcategoryCounts[key].count += 1;
      categorySubcategoryCounts[key].docs += dict.docs;
      categorySubcategoryCounts[key].nonDocs += dict.nonDocs;
      categorySubcategoryCounts[key].dupes += dict.dupes;
    }
  });

  const groupedCounts = d3.group(Object.values(categorySubcategoryCounts), (d) => d.category);

  const children = Array.from(groupedCounts, ([category, subCats]) => ({
    name: category,
    children: subCats.map(sc => ({ 
        name: sc.subCategory, value: sc.count, 
        docsCount: sc.docs, nonDocsCount: sc.nonDocs, dupesCount: sc.dupes 
    }))
  }));

  return { name: "Root", children };
}

// Древовидная карта для Архивов
export function getArchiveTreemapData(records) {
  const rollup = d3.rollup(
    records,
    v => {
      return {
        count: v.length,
        docs: d3.sum(v, d => d.probably_document === 'Вероятно' ? 1 : 0),
        nonDocs: d3.sum(v, d => d.probably_document !== 'Вероятно' ? 1 : 0),
        dupes: d3.sum(v, d => d.probably_duplicated === 'Возможно' ? 1 : 0)
      };
    },
    d => d.archive_name || "Без архива",
    d => (d.fond ? d.fond : "Без фонда"),
    d => (d.inventory ? d.inventory : "Без описи"),
    d => (d.file ? d.file : "Без дела")
  );

  function mapChildren(mapObj, name) {
    if (mapObj.count !== undefined) {
      return { name: name, value: mapObj.count, docsCount: mapObj.docs, nonDocsCount: mapObj.nonDocs, dupesCount: mapObj.dupes };
    }
    const children = Array.from(mapObj.entries()).map(([childName, childValue]) => {
      return mapChildren(childValue, childName);
    });
    return { name: name, children: children };
  }

  return mapChildren(rollup, "Root");
}
