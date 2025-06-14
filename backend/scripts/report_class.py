from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics

from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER

from reportlab.pdfbase import pdfmetrics

print(111111111111111111, pdfmetrics.getRegisteredFontNames())


import os
import sys
import json
import io

font_dir = os.path.dirname(os.path.abspath(__file__))

pdfmetrics.registerFont(TTFont('Helvetica', os.path.join(font_dir, 'ofont.ru_DejaVu Sans.ttf')))
pdfmetrics.registerFont(TTFont('Helvetica-Bold', os.path.join(font_dir, 'ofont.ru_DejaVu Sans.ttf')))

def convert_to_five_point(percent):
    if percent < 40: return 2
    elif 40 <= percent < 60: return 3
    elif 60 <= percent < 80: return 4
    else: return 5

def generate_test_report(class_name: str, date: str, test_name: str, students_data: list, grading_system: list, output_filename: str):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        topMargin=1.5 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        bottomMargin=4 * cm,
    )
    story = []

    # Стили для текста
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=16,
        alignment=1,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleStyle",
        parent=styles["Heading2"],
        fontName="Helvetica",
        fontSize=14,
        alignment=1,
    )
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=12,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        alignment=TA_CENTER
    )

    # Стили для таблицы
    table_text_style = ParagraphStyle(
        "TableText",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=12,
        leading=12,
        alignment=TA_LEFT,
        wordWrap='LTR'
    )

    class FooterCanvas(canvas.Canvas):
        def __init__(self, *args, **kwargs):
            canvas.Canvas.__init__(self, *args, **kwargs)
            self.pages = []

        def showPage(self):
            self.pages.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            for page in self.pages:
                self.__dict__.update(page)
                self.draw_canvas()
                canvas.Canvas.showPage(self)
            canvas.Canvas.save(self)

        def draw_canvas(self):
            self.saveState()
            self.setFont('Helvetica', 10)
            self.drawRightString(A4[0] - 2 * cm, 2 * cm, f"Дата: {date}")
            self.restoreState()

    # Шапка
    story.append(Paragraph(f"Отчёт по успеваемости класса <b>{class_name}</b>", title_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(f"Тест «{test_name}»", title_style))
    story.append(Spacer(1, 0.2 * cm))

    # Разделительная линия
    story.append(Spacer(1, 0.2 * cm))
    line = Table([[""]], colWidths=[17 * cm], rowHeights=[1])
    line.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, -1), 1, colors.black)]))
    story.append(line)
    story.append(Spacer(1, 0.5 * cm))

    # Вычисляем score для каждого ученика
    for student in students_data:
        if "score" not in student:
            correct_answers = sum(student["answers"])
            total_questions = len(student["answers"])
            student["score"] = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0

    # Средняя оценка по классу
    avg_score = sum(student["score"] for student in students_data) / len(students_data)
    story.append(Paragraph(f"Средняя оценка по классу — {avg_score:.1f}%", body_style))
    story.append(Spacer(1, 1 * cm))

    # Сортируем учеников по aruco_num (как числам, а не строкам)
    sorted_students = sorted(students_data, key=lambda x: int(x["aruco_num"]))

    # Подготовка данных для таблицы
    table_headers = [
        Paragraph("№", table_header_style),
        Paragraph("Ученики", table_header_style),
        Paragraph("Ответы", table_header_style),
    ]

    # Добавляем колонки в зависимости от выбранной системы оценивания
    if 'percent' in grading_system:
        table_headers.append(Paragraph("Оценка (%)", table_header_style))
    if 'five-point' in grading_system:
        table_headers.append(Paragraph("Оценка (5-балльная)", table_header_style))

    table_data = [table_headers]

    for student in sorted_students:
        answer_symbols = "".join(["+" if ans else "-" for ans in student["answers"]])
        row = [
            Paragraph(student["aruco_num"], table_text_style),
            Paragraph(student["name"], table_text_style),
            Paragraph(answer_symbols, table_text_style),
        ]

        if 'percent' in grading_system:
            row.append(Paragraph(f"{student['score']}", table_header_style))
        if 'five-point' in grading_system:
            five_point_score = convert_to_five_point(student['score'])
            row.append(Paragraph(str(five_point_score), table_header_style))

        table_data.append(row)

    table = Table(table_data, colWidths=[1 * cm, 5.3 * cm, 6 * cm, 2.8 * cm, 3.4 * cm])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),  # Все колонки по центру
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.7, colors.black),
        ("BOLD", (0, 0), (-1, 0), True),
    ]))
    story.append(table)

    doc.multiBuild(story, canvasmaker=FooterCanvas)


def main():
    data = json.load(io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8'))

    generate_test_report(
        class_name=data['class_name'],
        date=data['date'],
        test_name=data['test_name'],
        students_data=data['students_data'],
        grading_system=data['grading_system'],
        output_filename=data['output_filename']
    )
    print(data['class_name'])

if __name__ == "__main__":
    main()

# # Отчёт по классу по выбранному тесту
# if __name__ == "__main__":
#     class_name = "10-А"
#     # Дата проведения теста, можно брать дату проведения последнего вопроса из таблицы taken_question_answers
#     date = "11/04/2025"
#     test_name = "Алгебра: Квадратные уравнения"
#     grading_system = ['percent', 'five-point']
#     students_data = [
#         {"aruco_num": "2", "name": "Хохлов Тимофей", "answers": [False, True, True, False, True]},
#         {"aruco_num": "1", "name": "Иванов Иван", "answers": [True, True, False, True, False]},
#         {"aruco_num": "3", "name": "Петров Пётр", "answers": [True, True, True, True, True]},
#         {"aruco_num": "5", "name": "Сидорова Анна", "answers": [False, True, False, True, False]},
#         {"aruco_num": "4", "name": "Кузнецов Алексей", "answers": [True, False, True, False, True]},
#     ]

#     generate_test_report(class_name, date, test_name, students_data, grading_system, "test_report.pdf")
#     print("Отчёт успешно сгенерирован!")
