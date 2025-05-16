import loguru

BOT_TOKEN = '7571182724:AAE-iQ2aNhe0v2PWvoALW-h9XqKQ3nIskI8'

def init_logger():
    logger = loguru.logger
    logger.add("debug.log", format="{time} {level} {message}", level="DEBUG", rotation="1GB", retention="30 days", compression='zip')
    return logger

LOGGER = init_logger()

BASE_URL = 'https://mptroom.ru/api/api'