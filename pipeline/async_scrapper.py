import asyncio
import logging
import json
import random

import aiohttp
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.DEBUG,
    format='[%(levelname)s] - %(message)s - %(asctime)s - %(funcName)s',
)
logger = logging.getLogger(__name__)


class Scraper:
    """
    RGANTD catalog scraper. Intentionally overengineered for educational
    purposes, but functional
    """
    _base_url: str = 'https://rgantd.kaisa.ru'
    _headers: dict = {'User-Agent': 'Mozilla/5.0'}
    _session: aiohttp.ClientSession | None = None
    _sem: asyncio.Semaphore | None = None

    def __init__(
            self,
            base_listing_page_url: str = 'https://rgantd.kaisa.ru/type/SHUHOV',
            first_page: int = 1,
            last_page: int = 68,
            page_size: int = 20,
            _params_list: None | list[dict] = None,  # special func to generate
            filename: str = 'raw_data.json',
            number_of_concurrent_requests: int = 1,
            scraped_metadata: None | list = None,
            ) -> None:
        self.base_listing_page_url = base_listing_page_url
        self.first_page = first_page
        self.last_page = last_page
        self.page_size = page_size
        self._params_list = _params_list
        self.filename = filename
        self.number_of_concurrent_requests = number_of_concurrent_requests

        # default value is None to avoid mutable default value
        if scraped_metadata is None:
            self.scraped_metadata = []
        else:
            self.scraped_metadata = scraped_metadata

    def write_metadata(self):
        """Function to write scraped metadata into a .json file"""
        with open(self.filename, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_metadata, f, indent=2, ensure_ascii=False)

    def _listing_page_has_no_result(self, soup):
        """Identifies a blank list page"""
        if soup.find('div', {'class': 'objectlist-no-result'}):
            return True
        else:
            return False

    def _parse_listing_page_for_urls(
            self,
            response_text,
            listing_page_params,
            ) -> list[str] | None:
        """
        Gets url for each card on a list page from buttons
        if there is a list page
        """
        soup = BeautifulSoup(response_text, 'html.parser')

        if self._listing_page_has_no_result(soup):
            logger.warning(f'Page has no result: {listing_page_params}')
            return []
        else:
            descripton_buttons = soup.find_all(
                'a', {'class': 'btn-description'}, href=True)
            card_urls = [
                f"{self._base_url}{button['href'].strip()}"
                for button in descripton_buttons
                ]
            logger.debug(f'Parsed card urls from: {listing_page_params}')
            return card_urls

    def _generate_params(self) -> list[dict[str, int]]:
        """Generates list of url params for list pages"""
        if self.last_page < self.first_page:
            logger.warning(
                'first_page is bigger than last_page. Scraping only first_page'
            )
            self.last_page = self.first_page

        logger.info(
            f'Scraping pages from {self.first_page} to {self.last_page}...'
        )

        return [
            {'pageSize': self.page_size, 'page171446530': page}
            for page in range(self.first_page, self.last_page+1)
            ]

    def _parse_card_metadata(
            self,
            card_url: str,
            response_text: str,
            ) -> dict[str, list]:
        """
        Gets card metadata from a card page (number of attributes might be
        different for each card, and number of values might be different for
        each attribute)
        """

        soup = BeautifulSoup(response_text, 'html.parser')
        attributes = soup.find_all('span', {'class': 'attribute-title'})

        result = {}
        try:
            for attribute in attributes:
                name = attribute.get_text().strip()
                value = attribute.find_next_siblings()[1].get_text().strip()

                # there are attributes that have more than one value
                result.setdefault(name, []).append(value)
        except Exception:
            logger.exception(
                f'Error parsing card attributes: {card_url}. Length: {
                    len(result)}'
            )
        result.update({'url': [card_url]})  # list for an output unification

        logger.debug(
            f'Сard metadata was parsed: {card_url}. Length: {len(result)}'
        )
        return result

    async def _get_listing_page(
            self,
            params: dict,
            ) -> str:
        """Async function to get page with cards"""
        try:
            async with self._sem:  # sleep in sem after response
                async with self._session.get(
                    self.base_listing_page_url, params=params
                ) as response:
                    response_text = await response.text()

                await asyncio.sleep(random.uniform(2.5, 6))

                logger.debug(f'Fetched a listing page: {params}')
                return response_text
        except Exception:
            logger.exception(f'Failed to get list page: {params}')
            raise  # TaskGroup will stop everything

    async def _get_card_page(
            self,
            card_url: str,
            ) -> tuple[str, str] | None:
        """Async function to get page with card metadata"""
        try:
            async with self._sem:  # sleep in sem after response
                async with self._session.get(card_url) as response:
                    response_text = await response.text()

                await asyncio.sleep(random.uniform(2.5, 6))

                logger.debug(f'Fetched a card page: {card_url}')
                return (card_url, response_text)
        except Exception:
            logger.exception(f'Failed to get a card page: {card_url}')
            raise  # TaskGroup will stop everything

    async def _scrape_single_listing_page(
            self,
            listing_page_params: dict[str, int],
            ) -> None:
        """
        Gets a card list page. Parses card urls from the card list page.
        Gets each card with parsed urls. Parses and writes down their matadata
        into a .json file

        Used by scrape()
        """

        # get listing page and parse all card urls
        listing_page = await self._get_listing_page(
            listing_page_params
        )
        card_urls = self._parse_listing_page_for_urls(
            listing_page, listing_page_params
        )

        # get all card pages with parsed urls
        async with asyncio.TaskGroup() as group:
            tasks = [
                group.create_task(
                    self._get_card_page(card_url)
                )
                for card_url in card_urls
            ]

        # add all cards from the listing page to the result
        for task in tasks:
            self.scraped_metadata.append(
                self._parse_card_metadata(*task.result())
            )

        # Log progress with approximate number of cards
        # (although it's possible to parse an exact value)
        logger.info(
            f'Scraped cards: {
                len(self.scraped_metadata)
            } out of approximately {
                self.page_size*self.last_page
            }',
        )

    async def scrape(self) -> None:
        """
        Scrapes card metadata with scrape_single_listing_page() for each
        page in range from first_page to last_page + 1
        """
        async with aiohttp.ClientSession(headers=self._headers) as session:
            self._session = session
            self._sem = asyncio.Semaphore(self.number_of_concurrent_requests)
            async with asyncio.TaskGroup() as group:
                for listing_page_params in self._generate_params():
                    group.create_task(
                        self._scrape_single_listing_page(listing_page_params)
                    )
