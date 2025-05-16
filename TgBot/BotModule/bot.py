import telebot
import requests
from datetime import datetime, timedelta
from Props.config import BOT_TOKEN

from collections import defaultdict
from datetime import datetime

API_BASE = "https://mptroom.ru/api/api"
BOT_LOGIN = "sercetBotLogin"
BOT_PASSWORD = "2281137BotSecretPa$$word"

bot = telebot.TeleBot(BOT_TOKEN)
session = requests.Session()

group_schedule = {}
teacher_schedule = {}
supersede_cache = {"time": None, "data": []}

def log(msg):
    print(msg)

def authorize():
    try:
        resp = session.post(f"{API_BASE}/auth/login", json={"login": BOT_LOGIN, "password": BOT_PASSWORD}, verify=False)
        resp.raise_for_status()
        log("Авторизация успешна")
    except Exception as e:
        log(f"Ошибка авторизации: {e}")


def get_access_token_from_session():
    for cookie in session.cookies:
        if cookie.name == "access_token":
            return cookie.value
    return None

def get_refresh_token_from_session():
    for cookie in session.cookies:
        if cookie.name == "refresh_token":
            return cookie.value
    return None

def refresh_token():
    try:
        authorize()
        log("Токен обновлён")
    except Exception as e:
        log(f"Ошибка обновления токена: {e}")


def get_with_refresh(url, **kwargs):
    try:
        token = get_access_token_from_session()
        headers = kwargs.get("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        kwargs["headers"] = headers

        response = session.get(url, verify=False, **kwargs)

        if response.status_code == 401:
            log("🔐 Access токен истёк. Обновляем...")
            refresh_token()
            token = get_access_token_from_session()
            if token:
                headers["Authorization"] = f"Bearer {token}"
            kwargs["headers"] = headers
            response = session.get(url, verify=False, **kwargs)

        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        log(f"❌ Ошибка запроса к {url}: {e}")
        return None


def post_with_refresh(url, **kwargs):
    try:
        token = get_access_token_from_session()
        headers = kwargs.get("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        kwargs["headers"] = headers

        response = session.post(url, verify=False, **kwargs)

        if response.status_code == 401:
            log("🔐 Access токен истёк. Обновляем...")
            refresh_token()
            token = get_access_token_from_session()
            if token:
                headers["Authorization"] = f"Bearer {token}"
            kwargs["headers"] = headers
            response = session.post(url, verify=False, **kwargs)

        response.raise_for_status()
        return response
    except requests.RequestException as e:
        log(f"❌ Ошибка POST запроса к {url}: {e}")
        return None

def fetch_groups():
    return get_with_refresh(f"{API_BASE}/Group") or []

def fetch_lessons_by_group(group_id):
    return get_with_refresh(f"{API_BASE}/Lesson/group/{group_id}") or []

def fetch_supersedes():
    now = datetime.now()
    if supersede_cache["time"] and (now - supersede_cache["time"]) < timedelta(hours=1):
        return supersede_cache["data"]
    data = get_with_refresh(f"{API_BASE}/LessonSupersedeRequest") or []
    supersede_cache["time"] = now
    supersede_cache["data"] = data
    return data

def is_even_week():
    return datetime.now().isocalendar()[1] % 2 == 0

def filter_lessons_by_week(lessons):
    even_week = is_even_week()
    filtered = []
    for l in lessons:
        # weekType: 0 = any, 1 = even, 2 = odd, например (в твоём API может быть иначе)
        wt = l.get("weekType", 0)
        if wt == 0 or (wt == 1 and even_week) or (wt == 2 and not even_week):
            filtered.append(l)
    return filtered

def load_schedule():
    authorize()
    groups = fetch_groups()
    for g in groups:
        lessons = fetch_lessons_by_group(g["groupId"])
        group_schedule[g["groupName"].lower()] = lessons
    log("Расписания загружены")

@bot.message_handler(commands=['start'])
def start_handler(message):
    bot.reply_to(message, "Привет! Используй \n/Group <название группы>, чтобы получить расписание для группы на текущую неделю!\n/Teacher <Фамилия>, чтобы получить расписане преподавателя на текущую неделю!")

@bot.message_handler(commands=['Group'])
def group_handler(message):
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        bot.reply_to(message, "Укажи название группы, например /Group ИСП-31")
        return
    
    groups = fetch_groups()  # получаем список групп из API

    user_group_name = parts[1].lower()
    group_id = 0
    for group in groups:
        if group['groupName'].lower() == user_group_name:
            group_id = group['groupId']


    if not group_id:
        bot.reply_to(message, f"Группа с названием {user_group_name} не найдена")
        return
    
    lessons = group_schedule.get(user_group_name)
    if not lessons:
        bot.reply_to(message, f"Расписание для группы {user_group_name} не найдено")
        return

    lessons = filter_lessons_by_week(lessons)
    supersedes = fetch_supersedes()

    for s in supersedes:
        if s.get("supersedeRequestStatus") == 2 and s.get("groupId") == group_id:
            lessons.append({
                "lessonId": -1,
                "subjectId": s.get("subjectId"),
                "subjectName": s.get("subjectName", "Замена"),
                "groupName": s.get("groupName"),
                "lessonNumberId": s.get("lessonSlotId"),
                "lessonTime": "Замена",
                "housingId": None,
                "dayOfWeek": s.get("dayOfWeek"),
                "teacherId": s.get("teacherId")
            })

    if not lessons:
        bot.reply_to(message, "На этой неделе занятий нет.")
        return

    format_schedule(user_group_name.upper(), lessons, message)

@bot.message_handler(commands=['Teacher'])
def teacher_handler(message):
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        bot.reply_to(message, "Укажи фамилию преподавателя, например /Teacher Иванов")
        return

    teachers = fetch_teachers()  # Список преподавателей с personalDataId
    teacher_personal_list = fetch_personals()  # Список персональных данных с personalDataId и lastName

    user_teacher_name = parts[1].lower()
    teacher_id = None

    # Преобразуем список персональных данных в словарь для быстрого поиска по personalDataId
    personal_data_map = {p.get('personalDataId'): p for p in teacher_personal_list}

    for teacher in teachers:
        personal_data_id = teacher.get('personalDataId')
        personal_data = personal_data_map.get(personal_data_id)

        if personal_data:
            last_name = personal_data.get('lastname', '').lower()
            if last_name == user_teacher_name:
                teacher_id = teacher.get('userId')
                break

    if not teacher_id:
        bot.reply_to(message, f"Преподаватель с фамилией {user_teacher_name} не найден")
        return

    # Собираем все уроки для преподавателя
    filtered_lessons = []
    for group_name, lessons in group_schedule.items():
        for lesson in lessons:
            if lesson.get('teacherId') == teacher_id:
                lesson_copy = lesson.copy()
                lesson_copy['groupName'] = group_name  # вставляем название группы
                filtered_lessons.append(lesson_copy)

    filtered_lessons = filter_lessons_by_week(filtered_lessons)
    supersedes = fetch_supersedes()

    # Добавляем замены для преподавателя
    for s in supersedes:
        if s.get("supersedeRequestStatus") == 2 and s.get("teacherId") == teacher_id:
            filtered_lessons.append({
                "lessonId": -1,
                "subjectId": s.get("subjectId"),
                "subjectName": "Замена",
                "groupName": s.get("groupName"),
                "lessonNumberId": s.get("lessonSlotId"),
                "lessonTime": "Замена",
                "housingId": None,
                "dayOfWeek": s.get("dayOfWeek"),
                "teacherId": teacher_id
            })

    if not filtered_lessons:
        bot.reply_to(message, "На этой неделе занятий нет у этого преподавателя.")
        return

    # Вызываем функцию форматирования и вывода расписания
    format_teacher_schedule(user_teacher_name, filtered_lessons, message)
    



def fetch_subjects():
    return get_with_refresh(f"{API_BASE}/Subject")

def fetch_housings():
    return get_with_refresh(f"{API_BASE}/Housing")

def fetch_lesson_times():
   return get_with_refresh(f"{API_BASE}/LessonSlot")

def fetch_teachers():
    return get_with_refresh(f"{API_BASE}/Teacher")

def fetch_personals():
    return get_with_refresh(f"{API_BASE}/PersonalData")

def format_time(time_str):
    # преобразует '8:30:00' → '08:30'
    return datetime.strptime(time_str, "%H:%M:%S").strftime("%H:%M")

def get_teacher_name(teacher_id, teacher_map):
    return teacher_map.get(teacher_id, "-")

def prepare_mappings():
    subject_map = {s["subjectId"]: s["subjectName"] for s in fetch_subjects()}
    housing_map = {h["housingId"]: h["housingName"] for h in fetch_housings()}
    time_map = {
        t["lessonSlotId"]: f'{format_time(t["lessonStart"])} - {format_time(t["lessonEnd"])}'
        for t in fetch_lesson_times()
    }
    pers = fetch_personals()
    personals = {p["personalDataId"]: f'{p["lastname"]} {p["name"]} {p["patronymic"]}' for p in pers}
    teachers = fetch_teachers()
    teacher_map = {
        t["userId"]: personals.get(t["personalDataId"], "-")
        for t in teachers
    }
    return subject_map, housing_map, time_map, teacher_map

def format_schedule(group_name, lessons, message):
    subject_map, housing_map, time_map, teacher_map = prepare_mappings()
    days = ["-", "Понедельник", "Вторник", "Срела", "Четверг", "Пятница", "Суббота", "Воскресенье"]
    schedule_by_day = defaultdict(list)
    for lesson in lessons:
        schedule_by_day[lesson.get("dayOfWeek", 0)].append(lesson)

    text = f"📅 Расписание для группы *{group_name}*:\n\n"
    for day_index in range(1, 7):
        day_name = days[day_index]
        lessons = schedule_by_day.get(day_index, [])
        if not lessons:
            continue
        text += f"📌 *{day_name}*\n"
        lessons.sort(key=lambda x: (x.get("lessonNumberId") or 0))
        for l in lessons:
            time_slot = time_map.get(l.get("lessonNumberId"), "⏳")
            subj = l.get("subjectName") or subject_map.get(l.get("subjectId"), "-")
            housing = housing_map.get(l.get("housingId"), "-")
            teacher = get_teacher_name(l.get("teacherId"), teacher_map)
            text += f"🕒 `{time_slot}` | 📚 {subj} \n 🧑‍🏫 {teacher} \n 🏫 {housing}\n"
        text += "\n\n"

    bot.reply_to(message, text, parse_mode="Markdown")


def format_teacher_schedule(teacher_name, lessons, message):
    subject_map, housing_map, time_map, teacher_map = prepare_mappings()
    days = ["-", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
    schedule_by_day = defaultdict(list)

    for lesson in lessons:
        schedule_by_day[lesson.get("dayOfWeek", 0)].append(lesson)

    text = f"📅 Расписание для преподавателя *{teacher_name.title()}*:\n\n"

    for day_index in range(1, 7):
        day_name = days[day_index]
        day_lessons = schedule_by_day.get(day_index, [])
        if not day_lessons:
            continue

        text += f"📌 *{day_name}*\n"
        day_lessons.sort(key=lambda x: (x.get("lessonNumberId") or 0))

        for l in day_lessons:
            time_slot = time_map.get(l.get("lessonNumberId"), "⏳")
            subj = l.get("subjectName") or subject_map.get(l.get("subjectId"), "-")
            housing = housing_map.get(l.get("housingId"), "-")
            group = l.get("groupName", "-")  # вот отличие — выводим группу вместо преподавателя

            text += f"🕒 `{time_slot}` | 👥 {group} \n 📚 {subj} \n 🏫 {housing}\n"

        text += "\n\n"

    bot.reply_to(message, text, parse_mode="Markdown")

def get_teacher_name(teacher_id, teacher_map):
    return teacher_map.get(teacher_id, "-")


if __name__ == "__main__":
    load_schedule()
    bot.polling()
