import asyncio
import logging
import json

import aiohttp
from bs4 import BeautifulSoup

BASE_URL = 'https://rgantd.kaisa.ru'
CARD_LIST_URL = 'https://rgantd.kaisa.ru/type/SHUHOV'
N_OF_PAGES = 0
PAGE = 1
PAGE_SIZE = 5
LIST_URL_PARAMS = {'pageSize': PAGE_SIZE, 'page171446530': PAGE}
HEADERS = {'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:124.0) Gecko/20100101 Firefox/124.0'}
SEMAPHORE_VALUE = 1
SAVE_FILENAME = 'test_raw_data.json'

async def get_list_page(
        session: aiohttp.ClientSession,
        sem: asyncio.Semaphore,
        url: str,
        params: dict,
        ) -> str:
    """Async function to get page with cards"""
    try:
        async with sem, session.get(url, params=params) as response:
            return await response.text()
    except Exception as e:
        print(e)

def list_page_has_no_result(soup):
    """Identifies a blank list page"""
    if soup.find('div', {'class': 'objectlist-no-result'}):
        return True
    else:
        return False

def parse_list_page_for_urls(response_text) -> list[str] | None:
    """
    Gets url for each card on a list page from buttons
    if there is a list page
    """
    soup = BeautifulSoup(response_text, 'html.parser')

    if list_page_has_no_result(soup):
        return None  # что я хотел сюда дописать?
    else:
        descripton_buttons = soup.find_all(
            'a', {'class': 'btn-description'}, href=True)
        card_urls = [
            f'{BASE_URL}{button['href'].strip()}'
            for button in descripton_buttons
            ]

        return card_urls

def generate_params_for_list_pages(first_page, last_page, page_size):
    """Generates url params to scrape through multiple pages"""
    return [
        {'pageSize': page_size, 'page171446530': page}
        for page in range(first_page, last_page+1)
        ]

async def get_card_page(
        session: aiohttp.ClientSession,
        sem: asyncio.Semaphore,
        url: str,
        params: dict | None = None,
        ) -> tuple[str]:  # url, response.text()
    """Async function to get page with card metadata"""
    try:
        async with sem, session.get(url, params=params) as response:
            return (url, await response.text())
    except Exception as e:
        print(url)

def parse_card_page_for_metadata(
        url: str,
        response_text: str,
        ) -> dict[str, list[str]]:
    """
    Gets card metadata (attributes) from a card page. Number of attributes and
    values might be different for each card
    """

    soup = BeautifulSoup(response_text, 'html.parser')
    attributes = soup.find_all('span', {'class': 'attribute-title'})

    result = {}
    for attribute in attributes:
        name = attribute.get_text().strip()
        value = attribute.find_next_siblings()[1].get_text().strip()
        # there are attributes that have more than one value
        result.setdefault(name, []).append(value)

    result.update({'url': [url]})  # is listed for an output unification
    return result

async def scrape(
        url=CARD_LIST_URL,
        first_page=PAGE,
        last_page=N_OF_PAGES,
        page_size=PAGE_SIZE,
        headers=HEADERS,
        filename=SAVE_FILENAME,
        semaphore_value=SEMAPHORE_VALUE
        ):

    async with aiohttp.ClientSession(headers=headers) as session:
        sem = asyncio.Semaphore(semaphore_value)

        result = []

        async with asyncio.TaskGroup() as group:
            get_list_page_tasks = [
                group.create_task(
                    get_list_page(session, sem, url, params)
                    )
                for params in generate_params_for_list_pages(
                    first_page, last_page, page_size
                    )
                ]

        list_pages = [task.result() for task in get_list_page_tasks]

        for list_page in list_pages:
            card_urls = parse_list_page_for_urls(list_page)
            async with asyncio.TaskGroup() as group:
                get_card_page_tasks = [
                    group.create_task(
                        get_card_page(session, sem, url, params=None)
                    )
                    for url in card_urls
                ]

            result.extend([
                parse_card_page_for_metadata(*task.result())
                for task in get_card_page_tasks
                ])
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(
                    result,
                    f,
                    indent=2, 
                    ensure_ascii=False
                )
