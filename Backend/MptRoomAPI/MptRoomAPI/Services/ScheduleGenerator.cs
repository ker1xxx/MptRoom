using MptRoomAPI.Models.Enums;
using MptRoomAPI.Models;
using MptRoomAPI.DTO;
using System.Collections.Generic;

namespace MptRoomAPI.Services
{
    public class ScheduleGenerator
    {
        private readonly List<GroupModel> _groups;
        private readonly List<TeacherModel> _teachers;
        private readonly List<HousingModel> _housings;
        private readonly List<LessonSlotModel> _lessonSlots;

        public ScheduleGenerator(
            List<GroupModel> groups,
            List<TeacherModel> teachers,
            List<HousingModel> housings,
            List<LessonSlotModel> lessonSlots)
        {
            _groups = groups;
            _teachers = teachers;
            _housings = housings;
            _lessonSlots = lessonSlots;
        }

        public List<LessonModel> GenerateSchedule(List<CourseLoadDTO> courseLoads, int weeksInSemester)
        {
            var lessons = new List<LessonModel>();

            foreach (var group in _groups)
            {
                // 1. Для каждого предмета группы распределить часы
                foreach (var lesson in group.Lessons)
                {

                    var load = courseLoads.FirstOrDefault(cl =>
                 cl.SubjectId == lesson.Subject.SubjectId
                       );

                    if (load == null)
                        throw new ArgumentException($"Нагрузка для предмета {lesson.Subject.SubjectName} не указана");

                    var totalHours = load.HoursPerSemester;

                    // 2. Рассчитать количество пар в неделю (пример: 18 недель в семестре)
                    var pairsPerWeek = totalHours / weeksInSemester;

                    // 3. Распределить преподавателей
                    var subjectTeachers = _teachers
                        .Where(t => t.Courses.Any(c => c.SubjectId == lesson.SubjectId))
                        .ToList();

                    if (!subjectTeachers.Any())
                        throw new InvalidOperationException($"Нет преподавателей для предмета {lesson.Subject.SubjectName}");

                    // 4. Распределить пары по дням и слотам
                    var assignedPairs = 0;
                    for (int week = 0; week < weeksInSemester; week++)
                    {
                        var weekType = week % 2 == 0 ? WeekTypeEnum.even : WeekTypeEnum.odd;

                        foreach (var day in Enum.GetValues(typeof(DayOfWeek)).Cast<DayOfWeek>())
                        {
                            // 5. Выбрать случайный корпус для группы на этот день
                            var housing = GetRandomHousingForGroup(group, day);

                            // 6. Назначить пары в доступные слоты
                            foreach (var slot in _lessonSlots.OrderBy(s => s.LessonStart))
                            {
                                if (assignedPairs >= pairsPerWeek)
                                    break;

                                var teacher = GetAvailableTeacher(subjectTeachers, day, slot, weekType);
                                if (teacher == null)
                                    continue;

                                // 7. Создать занятие
                                var newLesson = new LessonModel
                                {
                                    SubjectId = (int)lesson.SubjectId,
                                    GroupId = group.GroupId.Value,
                                    TeacherId = teacher.UserId.Value,
                                    DayOfWeek = day,
                                    WeekType = weekType,
                                    LessonNumberId = (int)slot.LessonSlotId,
                                    HousingId = (int)housing.HousingId,
                                    Subject = lesson.Subject,
                                    Group = group,
                                    LessonNumber = slot,
                                    Housing = housing,
                                    Teacher = teacher
                                };

                                lessons.Add(lesson);
                                assignedPairs++;

                                // 8. Заблокировать слоты для преподавателя и группы
                                teacher.Lessons.Add(lesson);
                                group.Lessons.Add(lesson);
                            }
                        }
                    }
                }
            }

            return lessons;
        }

        private HousingModel GetRandomHousingForGroup(GroupModel group, DayOfWeek day)
        {
            // Проверяем, есть ли уже занятия у группы в этот день
            var existingHousing = group.Lessons
                .FirstOrDefault(l => l.DayOfWeek == day)?
                .Housing;

            return existingHousing ?? _housings.OrderBy(h => Guid.NewGuid()).First();
        }

        private TeacherModel GetAvailableTeacher(
            List<TeacherModel> teachers,
            DayOfWeek day,
            LessonSlotModel slot,
            WeekTypeEnum weekType)
        {
            return teachers.FirstOrDefault(t =>
                !t.Lessons.Any(l =>
                    l.DayOfWeek == day &&
                    l.LessonNumberId == slot.LessonSlotId &&
                    l.WeekType == weekType
                )
            );
        }
    }
}
