import mysql.connector
import bcrypt

# Connect to the database
conn = mysql.connector.connect(
    host="localhost",
    port=3307,
    user="root",
    password="01000726806ZXcv",
    database="ems_db"
)
cursor = conn.cursor()

# Fetch all employees from the database
cursor.execute("SELECT * FROM employees")
employees = cursor.fetchall()  # Fetch all rows from the last executed statement
"""
password_txt = "1234"
password = password_txt.encode('utf-8')
print(password)

for employee in employees:
    emp_id = employee[0]  # Assuming emp_id is the first column
    try:
        user_password = bcrypt.hashpw(password, bcrypt.gensalt())
        if bcrypt.checkpw(password, user_password):
            print("Password matches")
        else:
            print("Password does not match")
        print(f"Hashed password: {user_password}")
    except Exception as e:
        print(f"Error: {e}")
    cursor.execute(
        'UPDATE employees SET user_password = %s WHERE emp_id = %s',
        (user_password, emp_id)
    )
"""


for employee in employees[:-4]:
    print(employee)  # This will print the entire employee row
    emp_id = employee[0]  # Assuming emp_id is the first column in the row
    user_email = employee[7]  # Assuming emp_id is the first column in the row
    cursor.execute(
        'DELETE FROM  ROLES WHERE  user_email =(%s)',
        (user_email,)
    )



# Commit changes and close connection
conn.commit()
cursor.close()
conn.close()

print("Updated passwords for employees in the 'employees' table.")
