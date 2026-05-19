/*
Таблица AgGrid с кастомными фильтрами для двух типов данных: 
json-объектов с датами вида {start, end, certainty} и  обычных тектовых полей.
+ возможность убирать и добавлять столбцы, разворачивать и сворачивать строки,


Proof of concept :)
Почти весь код в этом файле написан чат-ботами и(или) является одним большим
костылём из костылей.
*/

let gridApi = null;
let externalFilterText = "";

let minDateFilter = null;
let maxDateFilter = null;

const ABSOLUTE_MIN_YEAR = 1854;
const ABSOLUTE_MAX_YEAR = 1937;

const AG_GRID_LOCALE_RU = {
  page: 'Страница',
  more: 'ещё',
  to: '-',
  of: 'из',
  next: 'Следующая',
  last: 'Последняя',
  first: 'Первая',
  previous: 'Предыдущая',
  loadingOoo: 'Загрузка...',
  pageSizeSelectorLabel: 'Размер стр.:',
};

const { themeQuartz } = agGrid;
const myTheme = themeQuartz
	.withParams({
    accentColor: "#087AD1",
    backgroundColor: "#FFFFFF",
    borderColor: "#ffffffff",
    borderRadius: 10,
    browserColorScheme: "light",
    cellHorizontalPaddingScale: 0.7,
    cellTextColor: "#2C2F33",
    chromeBackgroundColor: {
        ref: "backgroundColor"
    },
    columnBorder: false,
    fontFamily: {
        googleFont: "Arial"
    },
    fontSize: 13,
    foregroundColor: "#84868B",
    headerBackgroundColor: "#FFFFFF",
    headerFontFamily: [
        "Arial",
    ],
    headerFontSize: 13,
    headerFontWeight: 400,
    headerTextColor: "#84868B",
    rowBorder: true,
    rowVerticalPaddingScale: 0.8,
    sidePanelBorder: true,
    spacing: 6,
    wrapperBorder: false,
    wrapperBorderRadius: 2
  });

export function createTable(records, suggestions, onFilterCallback) {
  let filterDebounceTimeout;

  const gridOptions = {
    theme: myTheme,
    rowData: records,
    pagination: true,
    paginationPageSize: 15,
    paginationPageSizeSelector: [15, 30, 60],
    localeText: AG_GRID_LOCALE_RU,
    defaultColDef: {
      flex: 1,
      filter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      minWidth: 120,
      hide: false,
      cellRenderer: expandableCellRenderer,
      cellClassRules: {
       "no-data-cell": (params) => 
          params.value === "Б/д" || params.value === "Нет данных" 
      }
    },
    columnDefs: [
      {
        headerName: "Справочные данные",
        field: "identifier",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["archive_name"] },
      },
      {
        headerName: "Производственный номер",
        field: "control_number",
        filter: MultiConditionFilter,
      },
      {
        headerName: "Название документа или дела",
        field: "title",
        filter: MultiConditionFilter,
      },
      {
        headerName: "Дата создания",
        field: "raw_dates",
        filter: DatesFilter,
        filterValueGetter: (params) => params.data.dates,
      },
      {
        headerName: "Рубрика",
        field: "raw_category",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["category"] },
        filterValueGetter: (params) => params.data.category,
      },
      {
        headerName: "Подрубрика",
        field: "sub_category",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["sub_category"] },
        hide: true,
      },
      {
        headerName: "Дескрипторы",
        field: "raw_descriptors",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["descriptors"] },
        filterValueGetter: (params) => params.data.descriptors,
        hide: true,
      },
      {
        headerName: "Адрес расположения объекта",
        field: "raw_location",
        filter: MultiConditionFilter,
        filterValueGetter: (params) => params.data.location,
        filterParams: { suggestions: suggestions["location"] },
      },
      {
        headerName: "Вид документа",
        field: "raw_form",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["form"] },
        filterValueGetter: (params) => params.data.form,
      },
      {
        headerName: "Носитель",
        field: "raw_medium",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["medium"] },
        filterValueGetter: (params) => params.data.medium,
        hide: true,
      },
      {
        headerName: "Язык",
        field: "raw_language",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["language"] },
        filterValueGetter: (params) => params.data.language,
        hide: true,
      },
      {
        headerName: "Наличие автографа",
        field: "autograph_note",
        filter: MultiConditionFilter,
        filterParams: {suggestions: suggestions["autograph_note"]},
        hide: true,
      },
      {
        headerName: "Сведения о копийности документа",
        field: "originality_status",
        filter: MultiConditionFilter,
        filterParams: {suggestions: suggestions["originality_status"]},
        hide: true,
      },
      {
        headerName: "Наличие цифровой копии",
        field: "digital_copy_available",
        filter: MultiConditionFilter,
        filterParams: {suggestions: suggestions["digital_copy_available"]},
        hide: true,
      },
      {
        headerName: "Сведения о ценности документа",
        field: "appraisal",
        filter: MultiConditionFilter,
        filterParams: {suggestions: suggestions["appraisal"]},
        hide: true,
      },
      {
        headerName: "Необходимость реставрации",
        field: "conservation_status",
        filter: MultiConditionFilter,
        filterParams: {suggestions: suggestions["conservation_status"]},
        hide: true,
      },
      {
        headerName: "Подокументное описание",
        field: "probably_document",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["probably_document"] },
        hide: true,
      },
      {
        headerName: "Является дубликатом",
        field: "probably_duplicated",
        filter: MultiConditionFilter,
        filterParams: { suggestions: suggestions["probably_duplicated"] },
        hide: true,
      },
      {
        headerName: "Ссылка в системе \"Архив Шухова\"",
        field: "url",
        filter: MultiConditionFilter,
      },
      {
        field: 'notes',
        headerName: 'Ваши заметки (можно редактировать)',
        filter: MultiConditionFilter,
        editable: true,
      },
    ],

    onFilterChanged: () => {
		editable: true,
        clearTimeout(filterDebounceTimeout);
        filterDebounceTimeout = setTimeout(() => {
          if (onFilterCallback) {
            const filtered = getFilteredRecords();
            onFilterCallback(filtered);
          }
        }, 600); 
    },

    onCellValueChanged : function(params){ params.api.resetRowHeights(); },
    onFindChanged: (event) => {
      const { activeMatch, totalMatches, findSearchValue } = event;
      document.getElementById("activeMatchNum").textContent =
        findSearchValue?.length
          ? `${activeMatch?.numOverall ?? 0}/${totalMatches}`
          : "";
    },
    onCellDoubleClicked: function (params) {
        const isEditable = params.column.isCellEditable(params.node);
        if (isEditable) {
            return;
        }
        const cell = params.event.target.closest('.ag-cell');
        if (cell) {
            const range = document.createRange();
            range.selectNodeContents(cell);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },
    isExternalFilterPresent: function () {
      const isDateFilterActive = minDateFilter !== null || maxDateFilter !== null;
      return externalFilterText !== "" || isDateFilterActive;
    },
    doesExternalFilterPass: function (node) {
      const textMatch = externalFilterText === "" || Object.values(node.data)
      .some(v =>
        String(v ?? "").toLowerCase().includes(externalFilterText)
      );
      if (!textMatch) return false;

      if (minDateFilter === null && maxDateFilter === null) return true;

      const rowDates = node.data.dates;
      if (!rowDates || rowDates.length === 0) return false;

      const userMin = minDateFilter !== null ? minDateFilter : -Infinity;
      const userMax = maxDateFilter !== null ? maxDateFilter : Infinity;

      return rowDates.some(dateObj => {
        const interval = getDateObjectAsInterval(dateObj);
        const intersectionStart = Math.max(interval.min, userMin);
        const intersectionEnd = Math.min(interval.max, userMax);

        return intersectionStart <= intersectionEnd;
      });
    },
  };
  const container = document.getElementById("table");
  
  const created = agGrid.createGrid(container, gridOptions);
  gridApi = created;

  initColumnChooser(gridApi);

  bindGlobalExpandControls(container);

  document.getElementById("csv-btn").onclick = onBtCsv;

  const searchInput = document.getElementById("global-search");
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      externalFilterText = searchInput.value.toLowerCase();
      gridApi.onFilterChanged();
      window.dispatchEvent(new Event('tableStateChanged')); 
    }, 400);
  });
}

function getFilteredRecords() {
  const result = [];
  if (!gridApi) return result;

  gridApi.forEachNodeAfterFilter((node) => result.push(node.data));
  return result;
}

function expandableCellRenderer(params) {
  const span = document.createElement('span');
  span.classList.add('cell-content');
  span.innerText = params.value || '';

  span.addEventListener('click', () => {
    span.classList.toggle('expanded');

    params.api.resetRowHeights();
  });

  return span;
}

function bindGlobalExpandControls(gridContainer) {
  const radios = document.getElementsByName('row-expand-mode');
  
  radios.forEach(radio => {
    radio.addEventListener('change', (event) => {
      const isExpanded = event.target.value === 'expanded';
      
      if (isExpanded) {
        gridContainer.classList.add('is-global-expanded');
      } else {
        gridContainer.classList.remove('is-global-expanded');
      }

      setTimeout(() => { if (gridApi) { gridApi.resetRowHeights(); } }, 0);
    });
  });
}

function onBtCsv() { gridApi.exportDataAsCsv({ columnSeparator: "," }); }

function getDateObjectAsInterval(dateObject) {
    if (!dateObject || typeof dateObject !== "object") return {
      min: -Infinity, max: Infinity 
    };

    const start = dateObject.start;
    const end = dateObject.end;
    const certainty = dateObject.certainty ? dateObject.certainty.toLowerCase() : "exact";

    switch (certainty) {
      case "before":
        return { min: -Infinity, max: end };
      case "after":
        return { min: start, max: Infinity };
      default:
        return { min: start, max: end };
    }
}

function initColumnChooser(gridApi) {
  const container = document.getElementById("column-chooser");
  if (!container || !gridApi) return;

  container.innerHTML = "";

  const cols = gridApi.getAllGridColumns ? gridApi.getAllGridColumns() : (gridApi.getAllColumns ? gridApi.getAllColumns() : []);

  cols.forEach(col => {
    const colId = col.getColId();
    const colDef = col.getColDef ? col.getColDef() : {};

    const row = document.createElement("label");
    row.className = "column-chooser-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = typeof col.isVisible === 'function' ? col.isVisible() : true;
    checkbox.dataset.colId = colId;

    checkbox.addEventListener("change", (e) => {
      const id = e.target.dataset.colId;
      const visible = e.target.checked;

      if (typeof gridApi.setColumnsVisible === "function") {
        gridApi.setColumnsVisible([id], visible);
      } else if (typeof gridApi.setColumnVisible === "function") {
        gridApi.setColumnVisible(id, visible);
      }
      
      window.dispatchEvent(new Event('tableStateChanged'));
    });

    const text = document.createElement("span");
    text.textContent = colDef.headerName || colId;

    row.appendChild(checkbox);
    row.appendChild(text);
    container.appendChild(row);
  });
}


class DatesFilter {
  static OPERATORS = [
    { value: "=", text: "Содержит дату (равно)" },
    { value: "!=", text: "Не содержит дату (не равно)" },
    { value: "<", text: "Раньше, чем (меньше)" },
    { value: ">", text: "Позже, чем (больше)" },
    { value: "isEmpty", text: "Без даты" },
    { value: "isNotEmpty", text: "Есть дата" },
    { value: "isExact", text: "Точные даты" },
    { value: "isNotExact", text: "Неточные даты" },
  ];

  static OPERATORS_WITHOUT_VALUE = [
    "isEmpty",
    "isNotEmpty",
    "isExact",
    "isNotExact",
  ];

  init(params) {
    this.params = params;
    this.model = { mode: "AND", clauses: [] };

    this.clausesContainer = null;
    this.gui = this._buildGui();
  }

  _buildGui() {
    const container = document.createElement("div");
    container.className = "date-array-filter-container";

    const modeSwitcher = document.createElement("div");
    modeSwitcher.className = "date-array-filter-mode-switcher";
    modeSwitcher.innerHTML = `
      <label><input type="radio" name="mode" value="AND" checked/>Все условия (И)</label>
      <label><input type="radio" name="mode" value="OR"/>Любое из условий (ИЛИ)</label>
    `;
    modeSwitcher.querySelectorAll('input[name="mode"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        this.model.mode = event.target.value;
        this._onModelChanged();
      });
    });

    this.clausesContainer = document.createElement("div");
    this.clausesContainer.className = "date-array-filter-clauses-container";

    const controls = document.createElement("div");
    controls.className = "date-array-filter-controls";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Добавить условие";
    addButton.addEventListener("click", () => {
      this.model.clauses.push({
        type: "compare",
        operator: "=",
        value: "",
      });
      this._renderClauses();
      this._onModelChanged();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Очистить";
    clearButton.addEventListener("click", () => {
      this.model = { mode: "OR", clauses: [] };
      this._renderClauses();
      this._onModelChanged();
    });

    controls.appendChild(addButton);
    controls.appendChild(clearButton);

    container.appendChild(modeSwitcher);
    container.appendChild(this.clausesContainer);
    container.appendChild(controls);

    return container;
  }

  _renderClauses() {
    this.clausesContainer.innerHTML = "";
    this.model.clauses.forEach((clause, index) => {
      const clauseElement = this._createClauseElement(clause, index);
      this.clausesContainer.appendChild(clauseElement);
    });
  }

  _createClauseElement(clause, index) {
    const row = document.createElement("div");
    row.className = "date-array-filter-clause-row";

    const operatorSelect = document.createElement("select");
    DatesFilter.OPERATORS.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.text = option.text;
      if (option.value === clause.operator) {
        optionElement.selected = true;
      }
      operatorSelect.appendChild(optionElement);
    });

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.placeholder = "Год...";
    valueInput.value = clause.value !== undefined ? clause.value : "";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-clause-button";
    removeButton.textContent = "x";

    const isValueNeeded = !DatesFilter.OPERATORS_WITHOUT_VALUE.includes(
      clause.operator
    );
    valueInput.disabled = !isValueNeeded;

    operatorSelect.addEventListener("change", (event) => {
      const newOperator = event.target.value;
      clause.operator = newOperator;

      const needsValue =
        !DatesFilter.OPERATORS_WITHOUT_VALUE.includes(newOperator);
      valueInput.disabled = !needsValue;

      if (needsValue) {
        clause.type = "compare";
        if (clause.value === undefined) clause.value = "";
      } else {
        clause.type = "empty";
        delete clause.value;
        valueInput.value = "";
      }
      this._onModelChanged();
    });

    valueInput.addEventListener("input", (event) => {
      clause.value =
        event.target.value === "" ? "" : Number(event.target.value);
      this._onModelChanged();
    });

    removeButton.addEventListener("click", () => {
      this.model.clauses.splice(index, 1);
      this._renderClauses();
      this._onModelChanged();
    });

    row.appendChild(operatorSelect);
    row.appendChild(valueInput);
    row.appendChild(removeButton);

    return row;
  }

  _onModelChanged() {
    if (
      this.params &&
      typeof this.params.filterChangedCallback === "function"
    ) {
      this.params.filterChangedCallback();
    }
  }

  doesFilterPass(params) {
    const dates = params.data.dates || [];
    const clauses = this.model.clauses || [];

    if (clauses.length === 0) return true;

    const isClausePassing = (clause) => {
      switch (clause.operator) {
        case "isEmpty":
          return !dates || dates.length === 0;
        case "isNotEmpty":
          return dates && dates.length > 0;
        case "isExact":
          return dates.some(
            (dateObject) =>
              dateObject && dateObject.certainty.toLowerCase() === "exact"
          );
        case "isNotExact":
          return dates.some(
            (dateObject) =>
              dateObject && dateObject.certainty.toLowerCase() !== "exact"
          );
      }

      const filterValue = Number(clause.value);
      if (!Number.isFinite(filterValue)) return false;

      if (clause.operator === "!=") {
        const hasMatch = dates.some((dateObject) => {
          const interval = this._getDateObjectAsInterval(dateObject);
          return this._compareInterval(interval, "=", filterValue);
        });
        return !hasMatch;
      }

      return dates.some((dateObject) => {
        const interval = this._getDateObjectAsInterval(dateObject);
        return this._compareInterval(
          interval,
          clause.operator,
          filterValue
        );
      });
    };

    if (this.model.mode === "AND") {
      return clauses.every(isClausePassing);
    }
    return clauses.some(isClausePassing);
  }

  _getDateObjectAsInterval(dateObject) {
    if (!dateObject || typeof dateObject !== "object") return null;

    const start = dateObject.start;
    const end = dateObject.end;
    const certainty = dateObject.certainty
      ? dateObject.certainty.toLowerCase()
      : "exact";

    switch (certainty) {
      case "before":
        return { min: -Infinity, max: end };
      case "after":
        return { min: start, max: Infinity };
      default:
        return { min: start, max: end };
    }
  }

  _compareInterval(interval, operator, value) {
    if (!interval) return false;
    switch (operator) {
      case "=":
        return interval.min <= value && value <= interval.max;
      case "!=":
        return value < interval.min || value > interval.max;
      case "<":
        return interval.min < value;
      case ">":
        return interval.max > value;
      default:
        return false;
    }
  }

  getGui() {
    return this.gui;
  }

  isFilterActive() {
    return this.model.clauses.length > 0;
  }

  getModel() {
    if (!this.isFilterActive()) return undefined;
    return JSON.parse(JSON.stringify(this.model));
  }

  setModel(model) {
    this.model = model
      ? JSON.parse(JSON.stringify(model))
      : { mode: "OR", clauses: [] };

    const modeRadio = this.gui.querySelector(
      `input[name="mode"][value="${this.model.mode}"]`
    );
    if (modeRadio) modeRadio.checked = true;

    this._renderClauses();
  }

  getModelAsString(model) {
    const activeModel = model || this.model;
    if (
      !activeModel ||
      !activeModel.clauses ||
      activeModel.clauses.length === 0
    )
      return "";

    const parts = activeModel.clauses.map((clause) => {
      const operatorInfo = DatesFilter.OPERATORS.find(
        (op) => op.value === clause.operator
      );
      const operatorText = operatorInfo
        ? operatorInfo.text
        : clause.operator;

      if (DatesFilter.OPERATORS_WITHOUT_VALUE.includes(clause.operator)) {
        return `[${operatorText}]`;
      }
      return `${operatorText} ${clause.value}`;
    });

    const separator = activeModel.mode === "AND" ? " И " : " ИЛИ ";
    return parts.join(separator);
  }

  afterGuiAttached() { }  // Что это?
  destroy() { }
}

class MultiConditionFilter {
  static OPERATORS = [
    { value: "contains", text: "Содержит" },
    { value: "notContains", text: "Не содержит" },
  ];

  init(params) {
    this.params = params;
    this.api = params.api;
    this.colId = params.column.getColId();

    this.model = { logic: "AND", conditions: [] };
    this.suggestions =
      (params.filterParams && params.filterParams.suggestions) ||
      (params.colDef &&
        params.colDef.filterParams &&
        params.colDef.filterParams.suggestions) ||
      [];
    
    this.cleanupFunctions = [];

    this.gui = this._buildGui();
  }

  _buildGui() {
    const container = document.createElement("div");
    container.className = "multi-condition-filter-container";

    const logicSwitcher = document.createElement("div");
    logicSwitcher.className = "multi-condition-filter-mode-switcher";
    logicSwitcher.innerHTML = `
      <label><input type="radio" name="logic" value="AND" checked/> Все условия (И)</label>
      <label><input type="radio" name="logic" value="OR"/> Любое из условий (ИЛИ)</label>
    `;
    logicSwitcher
      .querySelectorAll('input[name="logic"]')
      .forEach((radio) => {
        radio.addEventListener("change", (event) => {
          this.model.logic = event.target.value;
          this._onModelChanged();
        });
      });

    this.conditionsContainer = document.createElement("div");
    this.conditionsContainer.className =
      "multi-condition-filter-conditions-container";

    const controls = document.createElement("div");
    controls.className = "multi-condition-filter-controls";

    const addButton = document.createElement("button");
    addButton.textContent = "Добавить условие";
    addButton.addEventListener("click", () => {
      this.model.conditions.push({ operator: "contains", value: "" });
      this._renderConditions();
      this._onModelChanged();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Очистить";
    clearButton.addEventListener("click", () => {
      this.model = { logic: "AND", conditions: [] };
      this._renderConditions();
      this._onModelChanged();
    });

    controls.appendChild(addButton);
    controls.appendChild(clearButton);

    container.appendChild(logicSwitcher);
    container.appendChild(this.conditionsContainer);
    container.appendChild(controls);

    this._renderConditions();
    return container;
  }

  _renderConditions() {
    if (this.cleanupFunctions) {
      this.cleanupFunctions.forEach(fn => fn());
    }
    this.cleanupFunctions = [];
    document
      .querySelectorAll(".multi-condition-suggestions")
      .forEach(el => el.remove());

    this.conditionsContainer.innerHTML = "";
    this.model.conditions.forEach((condition, index) => {
      const conditionElement = this._createConditionElement(
        condition,
        index
      );
      this.conditionsContainer.appendChild(conditionElement);
    });
  }

  _createConditionElement(condition, index) {
    const row = document.createElement("div");
    row.className = "multi-condition-filter-condition-row";

    const operatorSelect = document.createElement("select");
    MultiConditionFilter.OPERATORS.forEach((op) => {
      const option = document.createElement("option");
      option.value = op.value;
      option.text = op.text;
      if (op.value === condition.operator) option.selected = true;
      operatorSelect.appendChild(option);
    });
    operatorSelect.addEventListener("change", (event) => {
      this.model.conditions[index].operator = event.target.value;
      this._onModelChanged();
    });

    const wrapper = document.createElement("div");
    wrapper.className = "multi-condition-input-wrapper";

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.value = condition.value;
    valueInput.placeholder = "Введите текст...";
    valueInput.autocomplete = "off";
    valueInput.className = "multi-condition-input";
    valueInput.addEventListener("input", (event) => {
      this.model.conditions[index].value = event.target.value;
      this._filterSuggestions(suggestionsList, event.target.value);
      this._onModelChanged();
    });

    const suggestionsList = document.createElement("ul");
    suggestionsList.className = "multi-condition-suggestions";

    let isMouseOverList = false;
    suggestionsList.addEventListener("mouseenter", () => isMouseOverList = true);
    suggestionsList.addEventListener("mouseleave", () => isMouseOverList = false);

    suggestionsList.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      valueInput.focus();
    });

    this.suggestions.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      li.className = "multi-condition-suggestion-item";
      
      li.addEventListener("mousedown", (e) => {
        e.stopPropagation(); 
        
        valueInput.value = s;
        this.model.conditions[index].value = s;
        suggestionsList.style.display = "none";
        isMouseOverList = false;
        this._onModelChanged();
      });
      suggestionsList.appendChild(li);
    });

    const updatePosition = () => {
      const rect = valueInput.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      
      suggestionsList.style.top = rect.bottom + window.scrollY + "px";
      suggestionsList.style.left = rect.left + window.scrollX + "px";
      suggestionsList.style.width = rect.width + "px";
    };

    valueInput.addEventListener("input", (event) => {
      this.model.conditions[index].value = event.target.value;
      this._filterSuggestions(suggestionsList, event.target.value);
      this._onModelChanged();
      updatePosition(); 
    });

    valueInput.addEventListener("focus", () => {
      updatePosition();
      suggestionsList.style.display = "block";
      this._filterSuggestions(suggestionsList, valueInput.value);
    });

    valueInput.addEventListener("blur", () => {
      if (isMouseOverList) {
        valueInput.focus(); 
        return;
      }
      setTimeout(() => (suggestionsList.style.display = "none"), 50);
    });

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    this.cleanupFunctions.push(() => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
        if (suggestionsList.parentNode) suggestionsList.remove();
    });

    wrapper.appendChild(valueInput);
    document.body.appendChild(suggestionsList);

    const removeButton = document.createElement("button");
    removeButton.textContent = "x";
    removeButton.className = "remove-condition-button";
    removeButton.addEventListener("click", () => {
      this.model.conditions.splice(index, 1);
      this._renderConditions();
      this._onModelChanged();
    });

    row.appendChild(operatorSelect);
    row.appendChild(wrapper);
    row.appendChild(removeButton);

    return row;
  }

  _filterSuggestions(listEl, query) {
    const lower = query.toLowerCase();
    Array.from(listEl.children).forEach((li) => {
      if (!query || li.textContent.toLowerCase().includes(lower)) {
        li.style.display = "block";
      } else {
        li.style.display = "none";
      }
    });
  }

  _onModelChanged() {
    this.params.filterChangedCallback();
  }

  doesFilterPass(params) {
    const field = this.params.colDef.field;
    const rowData = params.data;

    const cellValueRaw = rowData ? rowData[field] : null;
    const cellValue = cellValueRaw
      ? String(cellValueRaw).toLowerCase()
      : "";

    if (this.model.conditions.length === 0) {
      return true;
    }

    const checkCondition = (condition) => {
      const filterValue = condition.value
        ? condition.value.toLowerCase()
        : "";
      switch (condition.operator) {
        case "contains":
          return cellValue.includes(filterValue);
        case "notContains":
          return !cellValue.includes(filterValue);
        default:
          return true;
      }
    };

    if (this.model.logic === "AND") {
      return this.model.conditions.every(checkCondition);
    } else {
      // OR
      return this.model.conditions.some(checkCondition);
    }
  }

  getGui() {
    return this.gui;
  }

  isFilterActive() {
    return this.model.conditions.length > 0;
  }

  getModel() {
    if (!this.isFilterActive()) return null;
    return JSON.parse(JSON.stringify(this.model));
  }

  setModel(model) {
    this.model = model || { logic: "AND", conditions: [] };

    const logicRadio = this.gui.querySelector(
      `input[name="logic"][value="${this.model.logic}"]`
    );
    if (logicRadio) logicRadio.checked = true;

    this._renderConditions();
  }

  destroy() {
    if (this.cleanupFunctions) {
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];
    }
  }
}

export function getGridApi() {
  return gridApi;
}

export function applyTableState(state) {
  if (!gridApi || !state) return;
  
  // Восстанавливаем видимость столбцов
  if (state.cols && state.cols.length > 0) {
    const allCols = gridApi.getAllGridColumns ? gridApi.getAllGridColumns() : gridApi.getAllColumns();
    const allColIds = allCols.map(c => c.getColId());
    
    // Скрываем все, затем показываем только сохраненные
    if (typeof gridApi.setColumnsVisible === "function") {
      gridApi.setColumnsVisible(allColIds, false);
      gridApi.setColumnsVisible(state.cols, true);
    } else {
      allColIds.forEach(id => gridApi.setColumnVisible(id, false));
      state.cols.forEach(id => gridApi.setColumnVisible(id, true));
    }
    initColumnChooser(gridApi); // Обновляем чекбоксы в UI
  }
  
  // Восстанавливаем фильтры (AgGrid делает магию и сам их распарсит, включая наши кастомные)
  if (state.filters) {
    gridApi.setFilterModel(state.filters);
  }
  
  // Восстанавливаем глобальный поиск
  if (state.search) {
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
        searchInput.value = state.search;
        externalFilterText = state.search.toLowerCase();
    }
  }
  
  gridApi.onFilterChanged();
}
