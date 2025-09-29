import random
import bcrypt
import datetime

names = [
    "Ahmed El-Sayed", "Mona Hassan", "Youssef Ali", "Salma Ibrahim", "Omar Farouk",
    "Nourhan Adel", "Mahmoud Tarek", "Layla Mohamed", "Karim Mostafa", "Heba Said",
    "Tarek Ismail", "Nada Fahmy", "Fatma Hassan", "Mariam Kamal", "Ziad Fouad",
    "Mai Kamal", "Hana Saad", "Amr Halim", "Khaled Naguib", "Ramy Amin"
]

addresses = [
    "Nasr City, Cairo", "Dokki, Giza", "Maadi, Cairo", "Heliopolis, Cairo",
    "Shobra, Cairo", "6th of October City, Giza", "Zagazig, Sharqia",
    "Mansoura, Dakahlia", "Alexandria, Roushdy", "Port Said, Egypt"
]

def random_email(name):
    base = name.lower().replace(" ", ".")
    return f"{base}{random.randint(10,9999)}@gmail.com"

def random_phone():
    prefix = random.choice(["010", "011", "012", "015"])
    return prefix + "".join([str(random.randint(0,9)) for _ in range(8)])

def random_password():
    return bcrypt.hashpw(b"123456", bcrypt.gensalt(12)).decode("utf-8")

def random_dob():
    start = datetime.date(1950, 1, 1)
    end = datetime.date(2015, 12, 31)
    delta = (end - start).days
    return start + datetime.timedelta(days=random.randint(0, delta))

def random_next_check():
    today = datetime.date.today()
    return today + datetime.timedelta(days=random.randint(1, 30))

def random_gender():
    return random.choice(["Male", "Female"])

def generate_insert(table="patients", count=50, start_id=1):
    values = []
    for i in range(count):
        pid = start_id + i
        name = random.choice(names)
        email = random_email(name)
        password = random_password()
        phone = random_phone()
        address = random.choice(addresses)
        is_assigned = random.choice([True, False])
        hospital_floor = random.randint(0, 6) if is_assigned else -1
        dob = random_dob()
        next_check = random_next_check()
        gender = random_gender()
        emergency = f"{random.choice(names)} - {random_phone()}"

        values.append(
            f"({pid},'{name}','{email}','{password}','{phone}','{address}',{str(is_assigned).upper()},{hospital_floor},'{dob}','{next_check}','{gender}','{emergency}')"
        )

    sql = f"INSERT INTO `{table}` (patient_id, patient_name, patient_email, patient_password, patient_phone, patient_address, isAssignedToRoom, hospital_floor, date_of_birth, next_check_date, patient_gender, emergency_contact) VALUES\n"
    sql += ",\n".join(values) + ";"
    return sql

if __name__ == "__main__":
    sql_data = generate_insert(count=50)

    # Save to file
    with open("patients_inserts.sql", "w", encoding="utf-8") as f:
        f.write(sql_data)

    print("✅ File patients_inserts.sql created with 50 records")
    print(sql_data[:500] + " ...")  # preview
