#!/usr/bin/env python3
import sqlite3
import uuid
from datetime import datetime

# Database path - update this if your database is in a different location
DB_PATH = '/Users/killian/Desktop/comp3334-project/filesystem.db'

# User ID to add as admin
USER_ID = '4e77b7c4-bef4-4c40-b72b-7fd4dd1aedf7'

def add_user_as_admin(user_id):
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Generate a unique ID for the admin record
        admin_id = str(uuid.uuid4())
        
        # Get current timestamp in SQLite format
        current_time = datetime.now().isoformat()
        
        # Insert the user into the admins table
        cursor.execute(
            "INSERT INTO admins (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (admin_id, user_id, current_time, current_time)
        )
        
        # Commit the changes
        conn.commit()
        
        # Check if insertion was successful
        cursor.execute("SELECT * FROM admins WHERE user_id = ?", (user_id,))
        result = cursor.fetchone()
        
        if result:
            print(f"✅ User {user_id} successfully added as admin with admin ID: {admin_id}")
        else:
            print("❌ Failed to add user as admin")
        
    except sqlite3.IntegrityError as e:
        print(f"❌ Error: {e}")
        print("This may occur if the user ID doesn't exist or is already an admin.")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Close the connection
        if conn:
            conn.close()

if __name__ == "__main__":
    add_user_as_admin(USER_ID)
    print("\nTo verify, you can run this SQL command:")
    print(f"sqlite3 {DB_PATH} 'SELECT * FROM admins WHERE user_id=\"{USER_ID}\";'")