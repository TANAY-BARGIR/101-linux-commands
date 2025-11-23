---
title: 'Data Structures'
description: "Learn about Python's built-in data structures for storing collections of data"
order: 5
---

Data structures are containers that organize and group data together in different ways. Python has several built-in data structures that you'll use frequently in your programs. In this section, we'll explore lists, tuples, dictionaries, and sets.

## Lists

Lists are ordered, mutable (changeable) collections of items. They can contain items of different types.

### Creating Lists

```python
# Empty list
empty_list = []
also_empty = list()

# List with items
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]

# List using the list() constructor
chars = list("hello")  # ['h', 'e', 'l', 'l', 'o']
```

### Accessing List Items

```python
fruits = ["apple", "banana", "cherry", "date", "elderberry"]

# Indexing (zero-based)
print(fruits[0])  # "apple"
print(fruits[2])  # "cherry"

# Negative indexing (counts from the end)
print(fruits[-1])  # "elderberry" (last item)
print(fruits[-2])  # "date" (second-to-last item)

# Slicing [start:end:step]
print(fruits[1:4])     # ["banana", "cherry", "date"] (end index not included)
print(fruits[:3])      # ["apple", "banana", "cherry"] (from start to index 2)
print(fruits[2:])      # ["cherry", "date", "elderberry"] (from index 2 to end)
print(fruits[::2])     # ["apple", "cherry", "elderberry"] (every second item)
print(fruits[::-1])    # ["elderberry", "date", "cherry", "banana", "apple"] (reversed)
```

### Modifying Lists

```python
fruits = ["apple", "banana", "cherry"]

# Change an item
fruits[1] = "blueberry"
print(fruits)  # ["apple", "blueberry", "cherry"]

# Add items
fruits.append("date")              # Add to the end
print(fruits)  # ["apple", "blueberry", "cherry", "date"]

fruits.insert(1, "apricot")        # Insert at position
print(fruits)  # ["apple", "apricot", "blueberry", "cherry", "date"]

fruits.extend(["elderberry", "fig"])  # Add multiple items
print(fruits)  # ["apple", "apricot", "blueberry", "cherry", "date", "elderberry", "fig"]

# Remove items
fruits.remove("blueberry")     # Remove by value (first occurrence)
print(fruits)  # ["apple", "apricot", "cherry", "date", "elderberry", "fig"]

popped = fruits.pop()          # Remove and return the last item
print(popped)  # "fig"
print(fruits)  # ["apple", "apricot", "cherry", "date", "elderberry"]

popped_index = fruits.pop(1)   # Remove and return item at index
print(popped_index)  # "apricot"
print(fruits)  # ["apple", "cherry", "date", "elderberry"]

del fruits[0]                  # Delete item at index
print(fruits)  # ["cherry", "date", "elderberry"]

# fruits.clear()               # Remove all items
# del fruits                   # Delete the list entirely
```

### List Methods

```python
fruits = ["banana", "apple", "cherry", "apple", "date"]

# Sorting
fruits.sort()                  # Sort in place
print(fruits)  # ["apple", "apple", "banana", "cherry", "date"]

fruits.sort(reverse=True)      # Sort in descending order
print(fruits)  # ["date", "cherry", "banana", "apple", "apple"]

# Creating a new sorted list (original list unchanged)
numbers = [3, 1, 4, 1, 5, 9]
sorted_numbers = sorted(numbers)
print(sorted_numbers)  # [1, 1, 3, 4, 5, 9]
print(numbers)         # [3, 1, 4, 1, 5, 9] (unchanged)

# Reversing
fruits.reverse()               # Reverse in place
print(fruits)  # ["apple", "apple", "banana", "cherry", "date"]

# Counting
count = fruits.count("apple")
print(count)  # 2

# Finding index
index = fruits.index("banana")
print(index)  # 2 (index of the first occurrence)

# Copy a list
fruits_copy = fruits.copy()    # or list(fruits) or fruits[:]
```

### List Comprehensions

List comprehensions provide a concise way to create lists:

```python
# Instead of:
squares = []
for i in range(1, 6):
    squares.append(i ** 2)
print(squares)  # [1, 4, 9, 16, 25]

# You can write:
squares = [i ** 2 for i in range(1, 6)]
print(squares)  # [1, 4, 9, 16, 25]

# With a condition
even_squares = [i ** 2 for i in range(1, 11) if i % 2 == 0]
print(even_squares)  # [4, 16, 36, 64, 100]

# With multiple conditions
numbers = [i for i in range(1, 21) if i % 2 == 0 if i % 3 == 0]
print(numbers)  # [6, 12, 18]

# With if-else
values = [i if i % 2 == 0 else i * 10 for i in range(1, 6)]
print(values)  # [10, 2, 30, 4, 50]
```

## Tuples

Tuples are ordered, immutable (unchangeable) collections of items. They're similar to lists but can't be modified after creation.

### Creating Tuples

```python
# Empty tuple
empty_tuple = ()
also_empty = tuple()

# Tuple with items
numbers = (1, 2, 3, 4, 5)
mixed = (1, "hello", 3.14, True)

# Single-item tuple (note the trailing comma)
single_item = (42,)  # Without the comma, Python treats (42) as a simple integer

# Tuple packing
coordinates = 3, 4  # Creates a tuple (3, 4)

# Tuple unpacking
x, y = coordinates  # x = 3, y = 4
```

### Accessing Tuple Items

Tuples use the same indexing and slicing as lists:

```python
fruits = ("apple", "banana", "cherry", "date", "elderberry")

print(fruits[0])      # "apple"
print(fruits[-1])     # "elderberry"
print(fruits[1:4])    # ("banana", "cherry", "date")
print(fruits[::-1])   # ("elderberry", "date", "cherry", "banana", "apple")
```

### Tuple Methods

Tuples have fewer methods than lists because they're immutable:

```python
fruits = ("apple", "banana", "cherry", "apple", "date")

# Count occurrences
count = fruits.count("apple")
print(count)  # 2

# Find index
index = fruits.index("cherry")
print(index)  # 2
```

### Why Use Tuples?

1. Tuples are faster than lists
2. They protect data that shouldn't change
3. They can be used as dictionary keys (lists can't)
4. They're used for multiple return values from functions

```python
# Function returning multiple values as a tuple
def get_dimensions():
    return 1920, 1080  # Returns a tuple (1920, 1080)

# Tuple unpacking
width, height = get_dimensions()
print(f"Width: {width}, Height: {height}")
```

## Dictionaries

Dictionaries are unordered collections of key-value pairs. They're optimized for retrieving data when you know the key.

### Creating Dictionaries

```python
# Empty dictionary
empty_dict = {}
also_empty = dict()

# Dictionary with items
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}

# Using dict() constructor
person = dict(name="Alice", age=30, city="New York")

# Different types of keys and values
mixed = {
    "name": "Bob",
    42: "The answer",
    (1, 2): "Tuple key",
    True: "Boolean key"
}
```

### Accessing Dictionary Items

```python
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}

# Using the key
print(person["name"])  # "Alice"

# Using get() method (safer, doesn't raise an error for missing keys)
print(person.get("age"))         # 30
print(person.get("country"))     # None
print(person.get("country", "Unknown"))  # "Unknown" (default value)
```

### Modifying Dictionaries

```python
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}

# Add or change items
person["email"] = "alice@example.com"  # Add new item
person["age"] = 31                     # Change existing item

# Update multiple items
person.update({"age": 32, "country": "USA", "email": "alice.new@example.com"})
print(person)

# Remove items
removed_value = person.pop("city")  # Remove and return the value
print(removed_value)  # "New York"

removed_item = person.popitem()     # Remove and return the last item as (key, value)
print(removed_item)  # ("email", "alice.new@example.com")

del person["age"]                   # Delete an item

# person.clear()                    # Remove all items
# del person                        # Delete the dictionary entirely
```

### Dictionary Methods

```python
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}

# Get all keys
keys = person.keys()
print(keys)  # dict_keys(['name', 'age', 'city'])

# Get all values
values = person.values()
print(values)  # dict_values(['Alice', 30, 'New York'])

# Get all key-value pairs as tuples
items = person.items()
print(items)  # dict_items([('name', 'Alice'), ('age', 30), ('city', 'New York')])

# Copy a dictionary
person_copy = person.copy()  # or dict(person)
```

### Dictionary Comprehensions

Similar to list comprehensions, but for creating dictionaries:

```python
# Create a dictionary of squares
squares = {i: i ** 2 for i in range(1, 6)}
print(squares)  # {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# With conditions
even_squares = {i: i ** 2 for i in range(1, 11) if i % 2 == 0}
print(even_squares)  # {2: 4, 4: 16, 6: 36, 8: 64, 10: 100}

# Convert list of tuples to dictionary
pairs = [("a", 1), ("b", 2), ("c", 3)]
pair_dict = {key: value for key, value in pairs}
print(pair_dict)  # {'a': 1, 'b': 2, 'c': 3}
```

## Sets

Sets are unordered collections of unique items. They're useful for removing duplicates and testing membership.

### Creating Sets

```python
# Empty set (note: {} creates an empty dictionary, not a set)
empty_set = set()

# Set with items
fruits = {"apple", "banana", "cherry"}

# Set from an iterable
letters = set("hello")  # Creates {'h', 'e', 'l', 'o'} (duplicates removed)
```

### Set Operations

```python
# Add items
fruits = {"apple", "banana", "cherry"}
fruits.add("date")
print(fruits)  # {'apple', 'banana', 'cherry', 'date'}

# Remove items
fruits.remove("banana")  # Raises an error if the item doesn't exist
print(fruits)  # {'apple', 'cherry', 'date'}

fruits.discard("elderberry")  # No error if the item doesn't exist

popped = fruits.pop()  # Remove and return an arbitrary element
print(popped)  # Could be any of the remaining items

# fruits.clear()  # Remove all items
```

### Mathematical Set Operations

```python
a = {1, 2, 3, 4, 5}
b = {4, 5, 6, 7, 8}

# Union (all items from both sets)
print(a | b)        # {1, 2, 3, 4, 5, 6, 7, 8}
print(a.union(b))   # Same as above

# Intersection (items that are in both sets)
print(a & b)        # {4, 5}
print(a.intersection(b))  # Same as above

# Difference (items in a but not in b)
print(a - b)        # {1, 2, 3}
print(a.difference(b))  # Same as above

# Symmetric difference (items in either set but not in both)
print(a ^ b)        # {1, 2, 3, 6, 7, 8}
print(a.symmetric_difference(b))  # Same as above

# Subset and superset tests
c = {1, 2}
print(c.issubset(a))      # True (all items in c are also in a)
print(a.issuperset(c))    # True (a contains all items in c)
```

### Set Comprehensions

```python
# Create a set of squares
squares = {i ** 2 for i in range(1, 6)}
print(squares)  # {1, 4, 9, 16, 25}

# With conditions
even_squares = {i ** 2 for i in range(1, 11) if i % 2 == 0}
print(even_squares)  # {4, 16, 36, 64, 100}
```

## Practical Example: Contact Management System

Let's build a simple contact management system that demonstrates the use of these data structures:

```python
def display_menu():
    """Display the menu options."""
    print("\nContact Management System")
    print("-------------------------")
    print("1. Add a contact")
    print("2. View all contacts")
    print("3. Search for a contact")
    print("4. Update a contact")
    print("5. Delete a contact")
    print("6. Exit")

def add_contact(contacts):
    """Add a new contact to the contacts list."""
    name = input("Enter name: ")

    # Check if contact already exists
    if any(contact['name'].lower() == name.lower() for contact in contacts):
        print(f"A contact with the name '{name}' already exists.")
        return

    phone = input("Enter phone number: ")
    email = input("Enter email (optional): ")

    # Create a new contact dictionary
    contact = {
        "name": name,
        "phone": phone,
        "email": email if email else "N/A"
    }

    contacts.append(contact)
    print(f"Contact '{name}' added successfully.")

def view_contacts(contacts):
    """Display all contacts."""
    if not contacts:
        print("No contacts found.")
        return

    print("\nAll Contacts:")
    print("------------")
    for i, contact in enumerate(contacts, 1):
        print(f"{i}. Name: {contact['name']}")
        print(f"   Phone: {contact['phone']}")
        print(f"   Email: {contact['email']}")
        print()

def search_contact(contacts):
    """Search for a contact by name."""
    if not contacts:
        print("No contacts found.")
        return

    search_term = input("Enter name to search: ").lower()

    # Use list comprehension to find matching contacts
    found_contacts = [contact for contact in contacts
                     if search_term in contact['name'].lower()]

    if found_contacts:
        print("\nFound Contacts:")
        print("--------------")
        for i, contact in enumerate(found_contacts, 1):
            print(f"{i}. Name: {contact['name']}")
            print(f"   Phone: {contact['phone']}")
            print(f"   Email: {contact['email']}")
            print()
    else:
        print(f"No contacts found containing '{search_term}'.")

def update_contact(contacts):
    """Update an existing contact."""
    if not contacts:
        print("No contacts found.")
        return

    name = input("Enter name of contact to update: ")

    # Find the contact by name
    for contact in contacts:
        if contact['name'].lower() == name.lower():
            print(f"Updating contact '{name}'")
            print("Leave field empty to keep current value.")

            # Get new values, or keep old ones if empty
            new_phone = input(f"Enter new phone number [{contact['phone']}]: ")
            new_email = input(f"Enter new email [{contact['email']}]: ")

            # Update the contact
            contact['phone'] = new_phone if new_phone else contact['phone']
            contact['email'] = new_email if new_email else contact['email']

            print(f"Contact '{name}' updated successfully.")
            return

    print(f"No contact found with the name '{name}'.")

def delete_contact(contacts):
    """Delete a contact by name."""
    if not contacts:
        print("No contacts found.")
        return

    name = input("Enter name of contact to delete: ")

    # Find the contact by name
    for i, contact in enumerate(contacts):
        if contact['name'].lower() == name.lower():
            # Confirm deletion
            confirm = input(f"Are you sure you want to delete '{name}'? (y/n): ")

            if confirm.lower() == 'y':
                del contacts[i]
                print(f"Contact '{name}' deleted successfully.")
            else:
                print("Deletion cancelled.")

            return

    print(f"No contact found with the name '{name}'.")

def main():
    # Initialize contacts list
    contacts = []

    while True:
        display_menu()
        choice = input("\nEnter your choice (1-6): ")

        if choice == '1':
            add_contact(contacts)
        elif choice == '2':
            view_contacts(contacts)
        elif choice == '3':
            search_contact(contacts)
        elif choice == '4':
            update_contact(contacts)
        elif choice == '5':
            delete_contact(contacts)
        elif choice == '6':
            print("Thank you for using the Contact Management System. Goodbye!")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")

if __name__ == "__main__":
    main()
```

Save this as `contact_manager.py` and run it. This example demonstrates:

1. Lists for storing multiple items (the contacts list)
2. Dictionaries for structured data (each contact is a dictionary)
3. Functions for modularity
4. List comprehensions for searching
5. Conditional statements and loops for control flow

## Next Steps

Data structures are essential for organizing and manipulating data in your programs. Now that you understand Python's built-in data structures, you're ready to explore how to extend Python's functionality using modules and packages.

In the next section, we'll learn how to import and use modules from Python's standard library and create our own modules to make our code more organized and reusable.

Happy coding!
