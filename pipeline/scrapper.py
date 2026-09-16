import asyncio
import logging
import json

import aiohttp
from bs4 import BeautifulSoup


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

def parse_list_page_for_urls(base_url, response_text) -> list[str] | None:
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
            f'{base_url}{button['href'].strip()}'
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

def parse_card_metadata(
        url: str,
        response_text: str,
        ) -> dict[str, list]:
    """
    Gets card metadata (attributes) from a card page (number of attributes and
    values might be different for each card)
    """

    soup = BeautifulSoup(response_text, 'html.parser')
    attributes = soup.find_all('span', {'class': 'attribute-title'})

    result = {}
    for attribute in attributes:
        name = attribute.get_text().strip()
        value = attribute.find_next_siblings()[1].get_text().strip()

        # there are attributes that have more than one value
        result.setdefault(name, []).append(value)

    result.update({'url': [url]})  # url is listed for an output unification

    return result

async def scrape_and_write_cards_from_single_list_page(
        session: aiohttp.ClientSession,
        sem: asyncio.Semaphore,
        lock: asyncio.Lock,
        base_url,
        list_page_url: str,
        list_page_params: dict[str, int],
        scraped_metadata: list,
        filename: str,
        ) -> None:
    """
    Gets a card list page. Parses card urls from the card list page.
    Gets each card with parsed urls. Parses and writes down their matadata
    into a .json file
    """
    list_page = await get_list_page(
        session,
        sem, 
        list_page_url,
        list_page_params
    )
    card_urls = parse_list_page_for_urls(base_url, list_page)

    # get all card pages
    async with asyncio.TaskGroup() as group:
        tasks = [
            group.create_task(get_card_page(session, sem, card_url))
            for card_url in card_urls
        ]

    # add all cards from the list page to result
    for task in tasks:
        scraped_metadata.append(parse_card_metadata(*task.result()))

    print(f'Cards scraped: {len(scraped_metadata)}', end='\r')

    # rewrite json with new result
    async with lock:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(scraped_metadata, f, indent=2, ensure_ascii=False)


class Scraper:
    _base_url: str = 'https://rgantd.kaisa.ru'
    _headers: dict = {'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:124.0) Gecko/20100101 Firefox/124.0'}

    def __init__(
            self,
            list_page_url: str = 'https://rgantd.kaisa.ru/type/SHUHOV',
            first_page: int = 1,
            last_page: int = 14,
            page_size: int = 100,
            filename: str = 'raw_data.json',
            number_of_tasks: int = 30,
            scraped_metadata: list = [],  # all scraped matadata
            ) -> None:
        self.list_page_url = list_page_url
        self.first_page = first_page
        self.last_page = last_page
        self.page_size = page_size
        self.filename = filename
        self.number_of_tasks = number_of_tasks
        self.scraped_metadata = scraped_metadata
 
    async def scrape(self):
        async with aiohttp.ClientSession(headers=self._headers) as session:
            sem = asyncio.Semaphore(self.number_of_tasks)  # to limit the number of tasks
            lock = asyncio.Lock()  # to avoid conflicts when writing to a file

            async with asyncio.TaskGroup() as group:
                for list_page_params in generate_params_for_list_pages(
                    self.first_page,
                    self.last_page,
                    self.page_size,
                ):
                    group.create_task(
                        scrape_and_write_cards_from_single_list_page(
                            session,
                            sem,
                            lock,
                            self._base_url,
                            self.list_page_url,
                            list_page_params,
                            self.scraped_metadata,
                            self.filename,
                        )
                    )
