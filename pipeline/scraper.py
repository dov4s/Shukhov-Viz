import random
import time
import json
from concurrent.futures import ThreadPoolExecutor

import requests
from bs4 import BeautifulSoup
from tqdm.auto import tqdm

# Url contains pageSize param that allows to show all cards on a single page
LISTING_PAGE_URL = 'https://rgantd.kaisa.ru/type/SHUHOV?pageSize=1348'
SAVE_FILENAME = 'raw_data.json'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'}
MAX_WORKERS = 1

# Get listing page and parse it for card urls
response = requests.get(LISTING_PAGE_URL, timeout=30)
soup = BeautifulSoup(response.text, 'html.parser')
descripton_buttons = soup.find_all('a', {'class': 'btn-description'}, href=True)
card_urls = []
for button in descripton_buttons:  # base url + card href in button
    card_urls.append(f'https://rgantd.kaisa.ru{button['href'].strip()}')


def get_attributes(url: str) -> dict:
    """
    Gets card page and parses it for metadata. Number of attributes might be
    different for each card, and number of values might be different for each
    attribute
    """
    try:
        time.sleep(random.uniform(2, 4))

        response = requests.get(url, headers=HEADERS, timeout=100)
        soup = BeautifulSoup(response.text, 'html.parser')

        attributes = soup.find_all('span', {'class': 'attribute-title'})

        attributes_dict = {}
        attributes_dict.update({'url': [url]})
        for attribute in attributes:
            attribute_title = attribute.get_text().strip()
            attribute_content = attribute.find_next_siblings()[1].get_text(
                                                                    ).strip()
            # number of values might be different for each attribute
            attributes_dict.setdefault(
                attribute_title, []
            ).append(attribute_content)

        return attributes_dict

    except Exception:
        print(f'Error fetching: {url}')
        return {'url': [url]}


# Get and parse each card page in card_urls with ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    files = list(tqdm(
        executor.map(get_attributes, card_urls),
        total=len(card_urls),
    ))

with open(SAVE_FILENAME, 'w', encoding='utf-8') as f:
    f.write(json.dumps(files, indent=2, ensure_ascii=False))
