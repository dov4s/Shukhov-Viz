export function spawnChart(){
	const chartsGroup = document.getElementById('charts-group');
	const addContainerBtn = document.getElementById('add-chart-container-btn');
	let containersCounter = 0;

	addContainerBtn.addEventListener('click', function(){
		const chartContainer = document.createElement('div');
		chartContainer.setAttribute('class', 'chart-container');
		chartContainer.setAttribute('id', `chart-container-${containersCounter}`);
		chartsGroup.appendChild(chartContainer);
		chartsGroup.appendChild(addContainerBtn);  // кнопка всегда в конце чартов
		const btns = document.createElement('div');
		btns.setAttribute('class', 'chart-btns');

		// кастомный селект (много тупого копипаста из ChatGPT)
		const wrapper = document.createElement('div');
		wrapper.className = 'chart-select custom-select';
		btns.appendChild(wrapper);

		const hiddenSelect = document.createElement('select');
		hiddenSelect.className = 'chart-select';
		hiddenSelect.style.display = 'none';
		wrapper.appendChild(hiddenSelect);
		
		const selected = document.createElement('div');
		selected.className = 'selected-value';
		selected.textContent = 'Выбрать график';
		wrapper.appendChild(selected);

		const dropdown = document.createElement('div');
		dropdown.className = 'dropdown';
		wrapper.appendChild(dropdown);

		const topChartGroups = {
			'Основные графики': {
				'Линейный график': ['Всего описательных статей', 'Вес', 'Интенсивность'],
				'Диаграмма с накоплением по архивам': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Древовидная карта рубрик и подрубрик': ['Всего описательных статей'],
				'Древовидная карта архивов, фондов, описей и дел': ['Всего описательных статей'],
				'Сетевой граф по адресам': ['Всего описательных статей'],
			},
			'Диаграммы': {
				'Диаграмма / Архив': ['Всего описательных статей'],
				'Диаграмма / Рубрика': ['Всего описательных статей'],
				'Диаграмма / Подрубрика': ['Всего описательных статей'],
				'Диаграмма / Дескрипторы': ['Всего описательных статей'],
				'Диаграмма / Локация': ['Всего описательных статей'],
				'Диаграмма / Вид документа': ['Всего описательных статей'],
				'Диаграмма / Носитель': ['Всего описательных статей'],
				'Диаграмма / Язык': ['Всего описательных статей'],
				'Диаграмма / Наличие автографа': ['Всего описательных статей'],
				'Диаграмма / Сведения о копийности': ['Всего описательных статей'],
				'Диаграмма / Наличию цифровой копии': ['Всего описательных статей'],
				'Диаграмма / Сведения о ценности': ['Всего описательных статей'],
				'Диаграмма / Необходимость реставрации': ['Всего описательных статей'],
			},
			'Диаграммы с накоплением': {
				'Накопление / Архив': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Рубрика': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Подрубрика': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Дескрипторы': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Локация': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Вид документа': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Носитель': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Язык': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Наличие автографа': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Сведения о копийности': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Сведения о копийности': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Сведения о ценности': [
					'Всего описательных статей','Вес','Интенсивность'
				],
				'Накопление / Необходимость реставрации': [
					'Всего описательных статей','Вес','Интенсивность'
				],
			},
		};

		// визуал селекта (тупой копипаст из chatGPT)
		for (const [topLabel, types] of Object.entries(topChartGroups)) {
			const topNode = document.createElement('div');
			topNode.className = 'dropdown-item top-group';

			const topHeader = document.createElement('div');
			topHeader.className = 'submenu-header';
			topHeader.textContent = topLabel;
			topNode.appendChild(topHeader);

			const typesMenu = document.createElement('div');
			typesMenu.className = 'submenu';
			topNode.appendChild(typesMenu);

			dropdown.appendChild(topNode);

			topHeader.addEventListener('click', (e) => {
				e.stopPropagation();
				const allTopGroups = dropdown.querySelectorAll('.top-group');

				allTopGroups.forEach(group => {
					const menu = group.querySelector('.submenu');
					if (menu && menu !== typesMenu) {
						menu.classList.remove('open');
						menu.querySelectorAll('.open').forEach(
							el => el.classList.remove('open'));
					}
				});

				typesMenu.classList.toggle('open');
			});

			for (const [typeLabel, metrics] of Object.entries(types)) {
				const optGroup = document.createElement('optgroup');
				optGroup.label = typeLabel;
				hiddenSelect.appendChild(optGroup);

				const typeNode = document.createElement('div');
				typeNode.className = 'dropdown-item dropdown-submenu';

				const typeHeader = document.createElement('div');
				typeHeader.className = 'submenu-header';
				typeHeader.textContent = typeLabel;
				typeNode.appendChild(typeHeader);

				const metricsMenu = document.createElement('div');
				metricsMenu.className = 'submenu';
				typeNode.appendChild(metricsMenu);
				typesMenu.appendChild(typeNode);

				typeHeader.addEventListener('click', (e) => {
					e.stopPropagation();
					const siblingSubmenus = typesMenu.querySelectorAll('.submenu');
					siblingSubmenus.forEach(sub => {
						if (sub !== metricsMenu) {
							sub.classList.remove('open');
						}
					});

					metricsMenu.classList.toggle('open');
				});

				for (const metric of metrics) {
					const opt = document.createElement('option');
					opt.value = `${typeLabel}||${metric}`;
					opt.textContent = metric;

					optGroup.appendChild(opt);

					const metricRow = document.createElement('div');
					metricRow.className = 'dropdown-item metric-row';
					metricRow.textContent = metric;
					metricsMenu.appendChild(metricRow);

					metricRow.addEventListener('click', (ev) => {
						ev.stopPropagation();
						hiddenSelect.value = `${typeLabel}||${metric}`;
						opt.selected = true;
						selected.textContent = `${typeLabel} / ${metric}`;

						dropdown.classList.remove('open');
						dropdown.querySelectorAll('.submenu.open').forEach(
							n => n.classList.remove('open')
						);
					});
				}
			}
		}
		selected.addEventListener('click', (e) => {
				e.stopPropagation();
				dropdown.classList.toggle('open');
		});
		document.addEventListener('click', () => {
				dropdown.classList.remove('open');
				dropdown.querySelectorAll('.submenu.open').forEach
				(n => n.classList.remove('open')
			);
		});
		// конец кастомного селекта

		const addChartBtn = document.createElement('button');
		btns.appendChild(addChartBtn);
		addChartBtn.setAttribute('class', 'add-chart-btn');
		addChartBtn.setAttribute('id', `add-chart-btn-${containersCounter}`);
		addChartBtn.textContent = 'Отобразить';

		chartContainer.appendChild(btns);

		const removeContainerBtn = document.createElement('button');
		btns.appendChild(removeContainerBtn);
		removeContainerBtn.setAttribute('class','remove-chart-container-btn');
		removeContainerBtn.textContent = 'Удалить контейнер';
		removeContainerBtn.onclick = function() {
			chartContainer.parentNode.removeChild(chartContainer);
			window.dispatchEvent(new Event('chartStateChanged'));
		};

		containersCounter += 1;
	});
}
