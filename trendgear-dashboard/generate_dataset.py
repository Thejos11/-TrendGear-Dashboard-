"""
TrendGear - Generador de Dataset Sintético
Fase I: Ingeniería y Modelado de Datos

Sigue la metodología de 4 pasos de la guía:
1. Crear muestra (semillas base definidas abajo)
2. Limpiar muestra (normalización de categorías)
3. One-shot prompting (aquí: generación programática controlada con distribuciones)
4. Revisión (función validate_dataset aplica el checklist de integridad)

Salidas:
- data/trendgear_dataset.csv   (separado por comas)
- data/trendgear_dataset.psv   (separado por pipes, robusto ante comas en nombres/ciudades)
- data/trendgear_dataset.json  (estructura lista para cargar en Firebase Realtime Database)
"""

import csv
import json
import random
from datetime import date, timedelta

random.seed(42)  # reproducibilidad

# -----------------------------------------------------------------
# 1. CREAR MUESTRA — catálogos base ("esquema" que la IA/script debe replicar)
# -----------------------------------------------------------------
FIRST_NAMES = [
    "Camila", "Santiago", "Valentina", "Mateo", "Isabella", "Sebastián",
    "Sofía", "Nicolás", "María José", "Andrés", "Daniela", "Juan Pablo",
    "Luciana", "Diego", "Gabriela", "Alejandro", "Renata", "Emiliano",
    "Antonia", "Samuel", "Paula", "Tomás", "Victoria", "Martín",
    "Fernanda", "David", "Regina", "Joaquín", "Ximena", "Felipe",
]
LAST_NAMES = [
    "García", "Rodríguez", "Martínez", "López", "Hernández", "Pérez",
    "González", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera",
    "Gómez", "Díaz", "Castro", "Morales", "Ortiz", "Vargas", "Suárez", "Molina",
]
PRODUCTS = [
    "Laptop Pro X1", "Smartphone Ultra 5G", "Wireless Earbuds Air",
    "Smart Watch Fit", "Gaming Console Nova", "Monitor 4K UltraView",
    "Mechanical Keyboard RGB", "Bluetooth Speaker Boom", "Tablet Air 11",
    "Drone Explorer Mini", "VR Headset Vision", "Power Bank Max 20K",
]
CITIES = [
    "Bogotá", "Medellín", "Cali", "Cúcuta", "Barranquilla",
    "Ciudad de México", "Buenos Aires", "Lima", "Santiago", "Quito",
]
PAYMENT_METHODS = ["Credit Card", "Debit Card", "PayPal", "Bank Transfer"]
MEMBERSHIP_STATUS = ["Bronze", "Silver", "Gold", "Platinum"]
# Membership tiers ponderados: la mayoría de clientes son Bronze/Silver (distribución realista)
MEMBERSHIP_WEIGHTS = [0.40, 0.30, 0.20, 0.10]

EMAIL_DOMAIN = "mailinator.com"  # dominio seguro sugerido por la guía para pruebas

N_RECORDS = 40
START_DATE = date(2024, 1, 1)
END_DATE = date(2026, 7, 16)  # fecha "actual" del taller


def random_date(start: date, end: date) -> date:
    delta_days = (end - start).days
    return start + timedelta(days=random.randint(0, delta_days))


def build_record(customer_id: int) -> dict:
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"

    # 2. LIMPIAR MUESTRA — normalización: minúsculas sin acentos ni espacios en el email
    email_user = (
        f"{first}.{last}{customer_id}"
        .lower()
        .replace(" ", "")
        .replace("é", "e").replace("á", "a").replace("í", "i")
        .replace("ó", "o").replace("ú", "u")
    )
    email = f"{email_user}@{EMAIL_DOMAIN}"

    purchase_date = random_date(START_DATE, END_DATE)
    # Coherencia cruzada: last_login siempre >= purchase_date
    last_login = random_date(purchase_date, END_DATE)

    age = random.randint(16, 72)  # dentro del rango válido 13-100
    amount = round(random.uniform(19.99, 2499.99), 2)

    return {
        "Customer ID": f"TG-{customer_id:04d}",
        "Name": name,
        "Email": email,
        "Product Purchased": random.choice(PRODUCTS),
        "Purchase Date": purchase_date.isoformat(),
        "Amount Spent ($)": amount,
        "Age": age,
        "City": random.choice(CITIES),
        "Payment Method": random.choice(PAYMENT_METHODS),
        "Last Login Date": last_login.isoformat(),
        "Membership Status": random.choices(MEMBERSHIP_STATUS, weights=MEMBERSHIP_WEIGHTS)[0],
    }


# -----------------------------------------------------------------
# 3. ONE-SHOT PROMPTING (simulado) — generación controlada del dataset completo
# -----------------------------------------------------------------
def generate_dataset(n: int = N_RECORDS) -> list[dict]:
    return [build_record(i + 1) for i in range(n)]


# -----------------------------------------------------------------
# 4. REVISIÓN — checklist de integridad de la guía
# -----------------------------------------------------------------
def validate_dataset(records: list[dict]) -> list[str]:
    errors = []
    seen_ids = set()

    for r in records:
        cid = r["Customer ID"]
        if cid in seen_ids:
            errors.append(f"ID duplicado: {cid}")
        seen_ids.add(cid)

        if not (13 <= r["Age"] <= 100):
            errors.append(f"{cid}: edad fuera de rango ({r['Age']})")

        if r["Amount Spent ($)"] < 0:
            errors.append(f"{cid}: monto negativo")

        try:
            pdate = date.fromisoformat(r["Purchase Date"])
            ldate = date.fromisoformat(r["Last Login Date"])
        except ValueError:
            errors.append(f"{cid}: formato de fecha inválido (se espera YYYY-MM-DD)")
            continue

        if pdate > ldate:
            errors.append(f"{cid}: Purchase Date posterior a Last Login Date")
        if pdate > END_DATE or ldate > END_DATE:
            errors.append(f"{cid}: fecha futura detectada")

        if r["Payment Method"] not in PAYMENT_METHODS:
            errors.append(f"{cid}: método de pago no normalizado")
        if r["Membership Status"] not in MEMBERSHIP_STATUS:
            errors.append(f"{cid}: estado de membresía no normalizado")
        if r["City"] not in CITIES:
            errors.append(f"{cid}: ciudad fuera del catálogo")
        if not r["Email"].endswith(f"@{EMAIL_DOMAIN}"):
            errors.append(f"{cid}: dominio de correo no seguro")

    return errors


def main():
    records = generate_dataset()
    errors = validate_dataset(records)

    if errors:
        print(f"Se encontraron {len(errors)} problema(s) de validación:")
        for e in errors:
            print(" -", e)
        raise SystemExit("Corrige el dataset antes de exportarlo.")

    print(f"Validación OK: {len(records)} registros cumplen el checklist de integridad.")

    # Export CSV
    fieldnames = list(records[0].keys())
    with open("data/trendgear_dataset.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    # Export PSV (pipe-separated, útil porque Name/City pueden llevar espacios/acentos)
    with open("data/trendgear_dataset.psv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="|")
        writer.writeheader()
        writer.writerows(records)

    # Export JSON estructurado como lo esperaría Firebase Realtime Database:
    # { "customers": { "TG-0001": {...}, "TG-0002": {...}, ... } }
    firebase_shape = {r["Customer ID"]: r for r in records}
    with open("data/trendgear_dataset.json", "w", encoding="utf-8") as f:
        json.dump({"customers": firebase_shape}, f, ensure_ascii=False, indent=2)

    print("Archivos generados en data/: trendgear_dataset.csv, .psv, .json")


if __name__ == "__main__":
    main()
