from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime

import io
import os

# Регистрируем стандартные шрифты
font_dir = os.path.dirname(os.path.abspath(__file__))

pdfmetrics.registerFont(TTFont('Helvetica', os.path.join(font_dir, 'ofont.ru_DejaVu Sans.ttf')))
pdfmetrics.registerFont(TTFont('Helvetica-Bold', os.path.join(font_dir, 'ofont.ru_DejaVu Sans.ttf')))

def convert_to_five_point(percent):
    if percent < 40: return 2
    elif 40 <= percent < 60: return 3
    elif 60 <= percent < 80: return 4
    else: return 5


def generate_test_report(student_name: str, date: str, class_name: str, students_data: list, output_filename: str,
                        grading_system=['percent']):
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

    # Основные стили
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=16,
        alignment=1,
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

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        alignment=TA_CENTER
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=12,
    )

    table_date_style = ParagraphStyle(
        "TableDate",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=12,
        alignment=TA_CENTER
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
            self.drawRightString(A4[0] - 2 * cm, 2 * cm, f"Дата формирования отчёта: {date}")
            self.restoreState()

    # Шапка документа
    story.append(Paragraph(f"{student_name} - отчёт об успеваемости", title_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(f"Класс «{class_name}»", title_style))
    story.append(Spacer(1, 0.2 * cm))

    # Разделительная линия
    line = Table([[""]], colWidths=[17 * cm], rowHeights=[1])
    line.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, -1), 1, colors.black)]))
    story.append(line)
    story.append(Spacer(1, 0.5 * cm))

    # Вычисляем score для каждого теста
    for test in students_data:
        if "score" not in test:
            correct_answers = sum(test["answers"])
            total_questions = len(test["answers"])
            test["score"] = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0

    # Средняя оценка
    avg_score = sum(test["score"] for test in students_data) / len(students_data)
    story.append(Paragraph(f"Средняя оценка — {avg_score:.1f}%", body_style))
    story.append(Spacer(1, 1 * cm))

    # Сортируем тесты по дате (от старых к новым)
    sorted_tests = sorted(students_data, key=lambda x: datetime.strptime(x["date"], "%d.%m.%Y"))

    # Подготовка данных для таблицы
    table_headers = [
        Paragraph("№", table_header_style),
        Paragraph("Название теста", table_header_style),
        Paragraph("Ответы", table_header_style),
    ]

    # Добавляем колонки в зависимости от выбранной системы оценивания
    if 'percent' in grading_system:
        table_headers.append(Paragraph("Оценка (%)", table_header_style))
    if 'five-point' in grading_system:
        table_headers.append(Paragraph("Оценка (5-балльная)", table_header_style))

    table_data = [table_headers]

    for i, test in enumerate(sorted_tests, 1):
        answer_symbols = "".join(["+" if ans else "-" for ans in test["answers"]])
        row = [
            Paragraph(str(i), table_text_style),
            Paragraph(test["name"], table_text_style),
            Paragraph(answer_symbols, table_text_style),
        ]

        if 'percent' in grading_system:
            row.append(Paragraph(f"{test['score']}", table_header_style))
        if 'five-point' in grading_system:
            five_point_score = convert_to_five_point(test['score'])
            row.append(Paragraph(str(five_point_score), table_header_style))

        table_data.append(row)

    # Создание таблицы
    table = Table(table_data, colWidths=[1 * cm, 8 * cm, 4 * cm, 2.8 * cm, 3.5 * cm])

    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (4, 0), (4, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 14),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.7, colors.black),
    ]

    # Добавляем выравнивание для дополнительных колонок
    if 'percent' in grading_system and 'five-point' in grading_system:
        table_style.append(("ALIGN", (3, 0), (4, -1), "CENTER"))
    elif 'percent' in grading_system or 'five-point' in grading_system:
        table_style.append(("ALIGN", (3, 0), (3, -1), "CENTER"))

    table.setStyle(TableStyle(table_style))

    story.append(table)

    doc.multiBuild(story, canvasmaker=FooterCanvas)


import sys
import json

def main():
    data = json.load(io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8'))
    generate_test_report(
        student_name=data["student_name"],
        date=data["date"],
        class_name=data["class_name"],
        students_data=data["students_data"],
        output_filename=data["output_filename"],
        grading_system=data.get("grading_system", ["percent"])
    )
    print("Отчёт успешно сгенерирован!")

if __name__ == "__main__":
    main()


# # Отчёт по всем тестам, написанным выбранными учеником
# if __name__ == "__main__":
#     student_name = "Петров Пётр"
#     report_date = "11.04.2025" #Дата формирования отчёта
#     class_name = "5А"
#     tests_data = [
#         {"name": "Материки Земли", "date": "15.03.2025", "answers": [True, True, False, True, False]},
#         {"name": "Растительный мир", "date": "20.04.2025", "answers": [True, True, True, True, True]},
#         {"name": "Климат планеты", "date": "05.03.2025", "answers": [False, True, False, True, False]},
#         {"name": "Комплексная проверочная работа по физической и экономической географии материков и океанов, включающая изучение особенностей природных зон, климатических условий, гидрографии, населения, хозяйственного освоения территорий и историко-культурных аспектов развития регионов", "date": "25.03.2025", "answers": [True, False, True, False, True]},
#         {"name": "Реки мира", "date": "10.03.2025", "answers": [False, False, True, True, True]},
#     ]

#     # Также подаются данные с фронтенда о том, какую систему оценивания выбрал пользователь.
#     # Могут быть такие значения: ['percent', 'five-point'] или ['percent'] или ['five-point'].
#     # В зависимости от этого, в документе будут отображаться соответствующие колонки.
#     generate_test_report(student_name, report_date, class_name, tests_data,
#                          "report_percent.pdf", grading_system=['percent'])

#     generate_test_report(student_name, report_date, class_name, tests_data,
#                          "report_five_point.pdf", grading_system=['five-point'])

#     generate_test_report(student_name, report_date, class_name, tests_data,
#                          "report_both.pdf", grading_system=['percent', 'five-point'])
#     print("Отчёт успешно сгенерирован!")
