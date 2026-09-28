import json
import re
import pandas as pd

# написать нормальные комментарии и typhints

# a bunch of hardcoded replacements with typo corrections to regex them properly
IDENTIFIER_CORRECTIONS = {
    'Российский государственный архив научно-технической документации, ф.11,': 'Российский государственный архив научно-технической документации, Ф. 166',
    'Российский государственный архив научно-технической документации, ф.16,': 'Российский государственный архив научно-технической документации, Ф. 166',
    'ф.0166': 'Ф. 166',
    'Российский государственный архив научно-технической документации, д.166': 'Российский государственный архив научно-технической документации, Ф. 166',
    'Российский государственный архив научно-технической документации, оп.1': 'Российский государственный архив научно-технической документации, Ф. 166, оп.1',
    'Архив Российской Академии Наук, оп.1': 'Архив Российской Академии Наук, Ф. 1508, оп.1',
    'Архив Российской Академии Наук, ф.1508, д.12': 'Архив Российской Академии Наук, Ф. 1508, Оп.1, Д. 12',
    'Российский государственный архив научно-технической документации, ф.166, д': 'Российский государственный архив научно-технической документации, Ф. 166, Оп. 1, Д',
    'ф.1508, оп.2': 'ф.1508, Оп. 1',
}

FORM_CORRECTIONS = {
    ', текстовая': ', Текстовая',
    ', патентные': ', Патентные',
    ', фото': ', Фото',
    'основе\\Управленческая': 'основе, Управленческая',
}

SUGGESTION_COLUMNS: list[str] = [
    'form', 'medium', 'category', 'descriptors', 'location', 'language',
    'sub_category', 'appraisal', 'archive_name', 'originality_status',
    'autograph_note', 'conservation_status', 'digital_copy_available',
    'probably_document', 'probably_duplicated'
]


def capitalize_without_lowercasing(string: str) -> str:
    """Capitalizes the first letter of a string without lowercasing the rest"""
    return string[:1].upper() + string[1:]

# better to use once on a series
def correct_and_split_form(lst: list[str]) -> list[str]:
    """
    Gets the only one (first) item in form list, corrects typos and splits it
    into a list with multiple values
    """
    if len(lst) > 0:
        string = lst[0]
        for key, value in FORM_CORRECTIONS.items():
            if key in string:
                string = string.replace(key, value)
        tokens = [
            capitalize_without_lowercasing(token.strip())
            for token in re.split(r',\s*(?=[А-Я])', string)
            ]
        return tokens
    else:
        return ['Нет данных']

def preprocess_date_token(token: str | None) -> str | None:
    """Applies hardcoded replacements for regex"""
    if not pd.isna(token):
        token = str(token)
        token = token.replace('–', '-').replace('—', '-')
        token = token.replace('- е', '- [1929]')
    return token

def extract_year(token: str) -> int:
    """Extracts a 4-digit year from a string"""
    return int(re.findall(r'\b\d{4}\b', token)[0])

def normalize_dates(
    date_string: str,
    delimiters: list[str],
) -> list[dict]:
    """
    Normalizes a date_string by splitting it with delimiters, extracting start
    and end years 
    Returns a list of dictionaries containing the start year, end year and
    certainty level (exact, approx, before, after) for each date or an empty
    list if there is no date
    """
    if 'Б/д' in date_string:
        return []

    tokens = [date_string]
    for delimiter in delimiters[:-1]:
        split_tokens = []
        for token in tokens:
            split_tokens.extend(token.split(delimiter))
        tokens = split_tokens

    approx_patterns = r'\[.+?\]|\bе\b'
    before_patterns = r'не позднее|до'
    after_patterns = r'не ранее'

    normalized_tokens_row = []
    for token in tokens:
        approx_match = re.search(approx_patterns, token, re.IGNORECASE)
        before_match = re.search(before_patterns, token, re.IGNORECASE)
        after_match = re.search(after_patterns, token, re.IGNORECASE)

        if delimiters[-1] in token:
            parts = token.split(delimiters[-1])
            if len(parts) == 2:
                normalized_tokens = {
                    "start": extract_year(parts[0].strip()),
                    "end": extract_year(parts[1].strip())
                }
        else:
            normalized_tokens = {
                "start": extract_year(token.strip()),
                "end": extract_year(token.strip())
            }

        if before_match:
            normalized_tokens.update({"certainty": "before"})
        elif after_match:
            normalized_tokens.update({"certainty": "after"})
        elif approx_match:
            normalized_tokens.update({"certainty": "approx"})
        else:
            normalized_tokens.update({"certainty": "exact"})

        normalized_tokens_row.append(normalized_tokens)

    return normalized_tokens_row

def parse_locations(raw_location: str) -> list[str]:
    """
    Parses distinct locations from location string. Returns a list of locations
    """
    separators = ['(', ';', ' и ']
    removals = [
        'ст.', 'г.', '[', ']', ')', 'ныне',
        '\"', 'с.', 'линии', 'п-ов', 'р-н'
    ]

    if not raw_location:
        return []

    railway_matches = re.findall(
        r'.*(ж\.д\.\sлинии\s[А-ЯЁёа-яA-Za-z\-]+)|([А-ЯЁёа-яA-Za-z\-]+\sлинии)?\s([А-ЯЁёа-яA-Za-z\-]+\sж\.д\.)',
        raw_location
    )
    railway_matches = [
        railway
        for match in railway_matches
        for railway in match if railway
    ]
    for railway in railway_matches:
        raw_location = raw_location.replace(railway, '')

    for token in separators:
        raw_location = raw_location.replace(token, ',')

    raw_location = raw_location.replace('c', 'с')  # 838

    for railway in railway_matches:
        raw_location = f'{raw_location}, {railway}'

    for token in removals:
        raw_location = raw_location.replace(token, '')

    locations = []
    # railway_token_flag = False
    parts = [part.strip() for part in raw_location.split(',') if part.strip()]
    for part in parts:
        if 'ж.д.' in part:
            # railway_token_flag = True
            part = part.replace('ж.д.', '')

        tokens = re.split(
            r'\s+(?=[А-ЯЁёа-яA-Za-z\-]+-[А-ЯЁёа-яA-Za-z\-]+)',
            part
        )
        locations.extend([token.strip() for token in tokens if token.strip()])

    # if railway_token_flag:
    #     locations.append('ж.д.')

    return locations

# better to use once on a series
def correct_identifier(identifier: str) -> str:
    """
    Replaces an old identifier value with a corrected one based on
    IDENTIFIER_CORRECTIONS
    """
    for key, value in IDENTIFIER_CORRECTIONS.items():
        if key in identifier:
            identifier = identifier.replace(key, value)
    return identifier

def parse_identifier_part(identifier: str, part_keyword: str) -> str:
    """
    Parses a specific part of an identifier. part_keyword could be either 'ф', 
    'оп' or 'д'
    """
    match = re.search(
        fr'({part_keyword})\s*[.,]?\s*([А-Яа-яA-Za-z]?-?\d+)',
        correct_identifier(identifier),
        re.IGNORECASE,
    )
    if match:
        return f'{match.group(1).capitalize()}. {match.group(2)}'
    return 'Нет данных'

def parse_extent(identifier: str) -> str:
    """Parses the number of sheets from an identifier string"""
    match = re.search(
        r'[,\.]\s*([^,\.]*л.*)\s*$',
        correct_identifier(identifier),
        re.IGNORECASE
    )
    if match:
        return match.group(1)
    return 'Нет данных'

# по листам и для ф. 1357 определяется, что это подокументное описание
def check_description_level(
        identifier: str,
        archive_name: str,
        fond: str,
        in_single_file: bool
        ) -> str:
    """
    Guesses the level of archival description based on extent analysis and 
    archive name/fond. Returns 'Вероятно' or 'Неизвестно'
    """
    if re.search(r'лл?\.\s*\d+', identifier, re.IGNORECASE):
        return 'Вероятно'
    if re.search(r'1\s*л\.', identifier, re.IGNORECASE):
        return 'Вероятно'
    if 'ЦГИА СПб' in archive_name and '1357' in fond:
        if not re.search(
            r'лл?\.', identifier, re.IGNORECASE
            ) and not re.search(r'л\.', identifier, re.IGNORECASE):
            return 'Вероятно'
    if in_single_file:
        return 'Вероятно'
    return 'Неизвестно'


if __name__ == '__main__':
    with open('raw_data.json', 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    df = pd.DataFrame(raw_data)

    # basic analysys of raw_data
    print('\nnumber of unique values per attribute')
    for col in df:
        print(col, df[col].explode().nunique())
    print('\nnumber of attribute occurences')
    for col in df:
        print(col, df[col].count())
    print('\nmean number of values per attribute')
    for col in df:
        print(col, df[col].str.len().mean())

    processed_df = pd.DataFrame()

    # extract values of attributes that always have only one value
    processed_df['url'] = df['url'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['title'] = df['Название документа по описи'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['sub_category'] = df['Подрубрика'].apply(
        lambda lst:
            capitalize_without_lowercasing(lst[0])
            if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['autograph_note'] = df['Наличие автографа'].apply(
        lambda lst:
            lst[0].capitalize()
            if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['conservation_status'] = df['Нуждается в реставрации'].apply(
        lambda lst:
            lst[0].capitalize()
            if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['digital_copy_available'] = df['Наличие цифровой копии'].apply(
        lambda lst:
            lst[0].capitalize()
            if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['control_number'] = df['Производственный номер'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['identifier'] = df['Дополнительные данные'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['archive_name'] = df['Название архива'].apply(
        lambda lst:
        lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    # could be easily normalized (raw values for now)
    processed_df['originality_status'] = df['Подлинник/Копия'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['appraisal'] = df['Ценность'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )

    # attributes that have more than one value
    processed_df['descriptors'] = df['Дескрипторы'].apply(
        lambda lst:
            [descriptor.capitalize() for descriptor in lst]
            if isinstance(lst, list) and len(lst) > 0  else ["Нет данных"]
    )

    # split values
    processed_df['dates'] = df['Дата создания'].apply(
        lambda lst:
            normalize_dates(preprocess_date_token(lst[0]), [',', '-'])
            if len(lst) > 0 else lst  # processed as [] in site js logic
    )
    processed_df['form'] = df['Вид документа'].apply(correct_and_split_form)
    processed_df['medium'] = df['Носитель (синька,фото,бумага,калька)'].apply(
        lambda lst: [
            capitalize_without_lowercasing(token.strip())
            for token in re.split(',', lst[0])
        ] if isinstance(lst, list) and len(lst) > 0  else ["Нет данных"]  # return list for js logic
    )
    processed_df['category'] = df['Рубрика'].apply(
        lambda lst: [
            capitalize_without_lowercasing(token.strip())
            for token in re.split(r',\s*(?=[А-Я])', lst[0])
            if token.strip()
        ] if isinstance(lst, list) and len(lst) > 0  else ["Нет данных"]
    )
    processed_df['location'] = df['Адрес расположения объекта'].apply(
        lambda lst:
            parse_locations(lst[0])
            if isinstance(lst, list) else ['Нет данных']
    )
    processed_df['language'] = df['Язык документа'].apply(
        lambda lst: [
            capitalize_without_lowercasing(token.strip())
            for token in re.split(',', lst[0])
        ]
        if isinstance(lst, list) and len(lst) > 0  else ["Нет данных"]
    )

    # copy raw values to show in the site table
    processed_df['raw_dates'] = df['Дата создания'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_location'] = df['Адрес расположения объекта'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_language'] = df['Язык документа'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_descriptors'] = df['Дескрипторы'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_form'] = df['Вид документа'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_medium'] = df[
        'Носитель (синька,фото,бумага,калька)'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )
    processed_df['raw_category'] = df['Рубрика'].apply(
        lambda lst:
            lst[0] if isinstance(lst, list) and len(lst) > 0 else 'Нет данных'
    )

    # parse fond, inventory, file and extent from identifier
    processed_df['fond'] = processed_df['identifier'].apply(
        parse_identifier_part, part_keyword='ф')
    processed_df['inventory'] = processed_df['identifier'].apply(
        parse_identifier_part, part_keyword='оп')
    processed_df['file'] = processed_df['identifier'].apply(
        parse_identifier_part, part_keyword='д')
    processed_df['extent'] = processed_df['identifier'].apply(parse_extent)

    # find out description level
    processed_df['in_single_file'] = (
        processed_df.groupby(
            ['archive_name', 'fond', 'inventory', 'file']
        )['title'].transform('nunique') > 1  # больше одного title среди
    )                                        # дубликатов по шифру
    processed_df['probably_document'] = processed_df.apply(  # листы + 1 дело
        lambda row: check_description_level(
            row['identifier'], row['archive_name'], row['fond'],
            row['in_single_file']
        ), axis=1
    )

    # find out duplicates
    processed_df['probably_duplicated'] = processed_df.duplicated(
        subset=['identifier', 'title'], keep='first'
    ).map({True: 'Возможно', False: 'Нет'})

    # some minor hard coded corrections of incorrect data
    processed_df.loc[
        processed_df['fond'] == 'Ф. 166', 'inventory'] = 'Оп. 1-10'
    processed_df.loc[processed_df['fond'] == 'Ф. 2', 'fond'] = 'Ф. Т-2'
    processed_df.loc[processed_df['fond'] == 'Ф. 1', 'fond'] = 'Ф. Т-1'

    # new_inventory for ЦАНО
    processed_df['new_inventory'] = 'Нет'
    processed_df.loc[
        processed_df['fond'] == 'Ф. Р-1679', 'new_inventory'] = 'Да'


    suggestions = {}
    for col in SUGGESTION_COLUMNS:
        suggestions[col] = processed_df[col].explode().dropna().unique(
                                                                ).tolist()

    records = processed_df.to_dict(orient='records')
    to_json = {
        'records': records,
        'suggestions': suggestions
    }

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(to_json, f, indent=2, ensure_ascii=False)
