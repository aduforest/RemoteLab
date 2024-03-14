# from apscheduler.schedulers.background import BackgroundScheduler
# from django.utils import timezone
# from .models import Reservation

# def delete_expired_reservations():
#     now = timezone.now()
#     expired_reservations = Reservation.objects.filter(end__lt=now)
#     expired_reservations.delete()
#     print(f"Deleted {expired_reservations.count()} expired reservations.")

# def start():
#     scheduler = BackgroundScheduler()
#     scheduler.add_job(delete_expired_reservations, 'interval', hours=1)
#     scheduler.start()
