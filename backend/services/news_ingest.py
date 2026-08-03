from apscheduler.schedulers.background import BackgroundScheduler


def start_news_ingestion_job() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.start()
    return scheduler
