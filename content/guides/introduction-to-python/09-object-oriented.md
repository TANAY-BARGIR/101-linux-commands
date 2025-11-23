---
title: 'Object-Oriented Programming'
description: 'Learn the principles of object-oriented programming in Python'
order: 9
---

Object-Oriented Programming (OOP) is a programming paradigm that organizes code around objects, which are instances of classes. Python is a multi-paradigm language that supports OOP and offers a flexible implementation of OOP principles. In this section, you'll learn how to create and use classes and objects in Python.

## Classes and Objects

A class is a blueprint for creating objects. An object is an instance of a class, a concrete entity based on the class definition.

### Defining a Class

Here's a simple class definition:

```python
class Dog:
    """A simple class representing a dog."""

    # Class attribute (shared by all instances)
    species = "Canis familiaris"

    # Initializer / Constructor
    def __init__(self, name, age):
        """Initialize a new Dog object."""
        self.name = name  # Instance attribute
        self.age = age    # Instance attribute

    # Instance method
    def bark(self):
        """Let the dog bark."""
        return f"{self.name} says Woof!"

    # Instance method
    def description(self):
        """Return a description of the dog."""
        return f"{self.name} is {self.age} years old"
```

Key components of this class definition:

- The `class` keyword followed by the class name (usually in CamelCase)
- A docstring that describes the class
- Class attributes that are shared by all instances
- The `__init__` method (constructor) that initializes new instances
- Instance attributes that are unique to each instance
- Instance methods that define the behavior of objects

### Creating Objects (Instances)

Once you've defined a class, you can create instances (objects) of that class:

```python
# Create two dog instances
buddy = Dog("Buddy", 9)
miles = Dog("Miles", 4)

# Access instance attributes
print(buddy.name)  # "Buddy"
print(miles.age)   # 4

# Access class attributes
print(buddy.species)  # "Canis familiaris"
print(miles.species)  # "Canis familiaris"

# Call instance methods
print(buddy.bark())        # "Buddy says Woof!"
print(miles.description())  # "Miles is 4 years old"
```

### Methods with Parameters

Methods can take parameters just like regular functions:

```python
class Dog:
    # Previous code...

    def eat(self, food):
        """Feed the dog."""
        return f"{self.name} is eating {food}"

# Create a dog instance
buddy = Dog("Buddy", 9)

# Call a method with a parameter
print(buddy.eat("dog food"))  # "Buddy is eating dog food"
```

## Inheritance

Inheritance allows you to create a new class that inherits attributes and methods from an existing class.

### Creating a Subclass

```python
class Dog:
    # Previous Dog class code...

class Bulldog(Dog):
    """A Bulldog, a specific breed of dog."""

    # Override the species class attribute
    species = "Canis familiaris bulldogus"

    def __init__(self, name, age, weight):
        # Call the parent class's __init__ method
        super().__init__(name, age)
        self.weight = weight  # Add a new instance attribute

    # Override the bark method
    def bark(self):
        """Bulldogs have a different bark."""
        return f"{self.name} says Grrrr!"

    # Add a new method
    def snore(self):
        """Bulldogs snore loudly."""
        return f"{self.name} is snoring... ZZZ"
```

### Using the Subclass

```python
# Create a Bulldog instance
rocky = Bulldog("Rocky", 3, 65)

# Access inherited attributes and methods
print(rocky.name)           # "Rocky"
print(rocky.description())  # "Rocky is 3 years old"

# Access overridden attributes and methods
print(rocky.species)  # "Canis familiaris bulldogus"
print(rocky.bark())   # "Rocky says Grrrr!"

# Access new attributes and methods
print(rocky.weight)   # 65
print(rocky.snore())  # "Rocky is snoring... ZZZ"
```

### Multiple Inheritance

Python supports multiple inheritance, where a class can inherit from multiple parent classes:

```python
class Animal:
    def eat(self):
        return "Eating..."

class CanSwim:
    def swim(self):
        return "Swimming..."

class CanFly:
    def fly(self):
        return "Flying..."

# Inherits from both Animal and CanSwim
class Duck(Animal, CanSwim, CanFly):
    def quack(self):
        return "Quack!"

# Create a Duck instance
donald = Duck()

# Access methods from all parent classes
print(donald.eat())   # "Eating..."
print(donald.swim())  # "Swimming..."
print(donald.fly())   # "Flying..."
print(donald.quack()) # "Quack!"
```

When a class inherits from multiple parents, Python uses the Method Resolution Order (MRO) to determine which method to call when the same method name is used in multiple parent classes.

## Encapsulation

Encapsulation is the bundling of data and methods that operate on that data within a single unit (the class). It also involves restricting access to certain components to prevent unintended modifications.

### Private Attributes and Methods

Python doesn't have true private attributes or methods, but it uses a convention: names prefixed with a single underscore are considered "protected" (not meant to be accessed directly), and names prefixed with double underscores are name-mangled to make them harder to access accidentally:

```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner            # Public attribute
        self._balance = balance       # Protected attribute
        self.__account_number = "12345"  # Private attribute (name-mangled)

    def deposit(self, amount):
        """Deposit money into the account."""
        if amount > 0:
            self._balance += amount
            return f"Deposited ${amount}. New balance: ${self._balance}"
        return "Invalid deposit amount"

    def withdraw(self, amount):
        """Withdraw money from the account."""
        if 0 < amount <= self._balance:
            self._balance -= amount
            return f"Withdrew ${amount}. New balance: ${self._balance}"
        return "Invalid withdrawal amount"

    def get_balance(self):
        """Get the current balance."""
        return self._balance

    def _service_charge(self):
        """Apply a service charge (protected method)."""
        self._balance -= 5

    def __generate_statement(self):
        """Generate an account statement (private method)."""
        return f"Statement for account {self.__account_number}"
```

### Accessing Attributes

```python
# Create a bank account
account = BankAccount("Alice", 1000)

# Access public attributes and methods
print(account.owner)           # "Alice"
print(account.deposit(500))    # "Deposited $500. New balance: $1500"
print(account.get_balance())   # 1500

# Access protected attributes and methods
# This works, but it's discouraged by convention
print(account._balance)        # 1500
account._service_charge()
print(account.get_balance())   # 1495

# Try to access private attributes and methods
# This will raise an AttributeError
# print(account.__account_number)
# account.__generate_statement()

# But you can still access them using name mangling
print(account._BankAccount__account_number)  # "12345"
print(account._BankAccount__generate_statement())  # "Statement for account 12345"
```

## Property Decorators

Python provides property decorators for controlled access to attributes. This allows you to define methods that behave like attributes:

```python
class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius

    @property
    def celsius(self):
        """Get the temperature in Celsius."""
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        """Set the temperature in Celsius."""
        if value < -273.15:
            raise ValueError("Temperature below absolute zero is not possible")
        self._celsius = value

    @property
    def fahrenheit(self):
        """Get the temperature in Fahrenheit."""
        return (self._celsius * 9/5) + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        """Set the temperature in Fahrenheit."""
        celsius = (value - 32) * 5/9
        if celsius < -273.15:
            raise ValueError("Temperature below absolute zero is not possible")
        self._celsius = celsius
```

Using properties:

```python
# Create a Temperature instance
temp = Temperature(25)

# Access properties like attributes
print(temp.celsius)     # 25
print(temp.fahrenheit)  # 77.0

# Set properties
temp.celsius = 30
print(temp.celsius)     # 30
print(temp.fahrenheit)  # 86.0

temp.fahrenheit = 68
print(temp.celsius)     # 20.0
print(temp.fahrenheit)  # 68.0

# This will raise a ValueError
# temp.celsius = -300
```

## Polymorphism

Polymorphism allows different classes to be treated as instances of the same class through inheritance and method overriding, or by implementing the same methods in unrelated classes.

### Method Overriding

We've already seen method overriding in the Bulldog example, where the `bark` method was overridden.

### Duck Typing

Python also supports "duck typing," where the type or class of an object is less important than the methods it defines. "If it walks like a duck and quacks like a duck, then it's a duck."

```python
class Duck:
    def quack(self):
        return "Quack!"

    def fly(self):
        return "Flapping wings"

class Person:
    def quack(self):
        return "I'm quacking like a duck!"

    def fly(self):
        return "I'm flapping my arms!"

def make_it_quack_and_fly(thing):
    """Make the thing quack and fly regardless of its type."""
    print(thing.quack())
    print(thing.fly())

# Create instances
duck = Duck()
person = Person()

# Both can quack and fly
make_it_quack_and_fly(duck)    # "Quack!" and "Flapping wings"
make_it_quack_and_fly(person)  # "I'm quacking like a duck!" and "I'm flapping my arms!"
```

## Special Methods (Magic Methods)

Python classes can define special methods, also known as "magic methods" or "dunder methods" (double underscore methods), to customize the behavior of objects.

### Common Special Methods

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        """Return a string representation of the vector."""
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        """Return a string representation for developers."""
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        """Add two vectors."""
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """Subtract one vector from another."""
        return Vector(self.x - other.x, self.y - other.y)

    def __eq__(self, other):
        """Check if two vectors are equal."""
        return self.x == other.x and self.y == other.y

    def __abs__(self):
        """Return the magnitude of the vector."""
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __bool__(self):
        """Return True if the vector's magnitude is non-zero."""
        return abs(self) != 0

    def __len__(self):
        """Return the dimension of the vector."""
        return 2
```

Using special methods:

```python
# Create vectors
v1 = Vector(3, 4)
v2 = Vector(1, 2)

# __str__ is called by print()
print(v1)  # "Vector(3, 4)"

# __repr__ is called in interactive mode or by repr()
repr(v2)  # "Vector(1, 2)"

# __add__ is called by +
v3 = v1 + v2
print(v3)  # "Vector(4, 6)"

# __sub__ is called by -
v4 = v1 - v2
print(v4)  # "Vector(2, 2)"

# __eq__ is called by ==
print(v1 == v2)  # False
print(v3 == Vector(4, 6))  # True

# __abs__ is called by abs()
print(abs(v1))  # 5.0

# __bool__ is called by bool() or in conditionals
if v1:
    print("v1 is non-zero")  # This will be printed

# __len__ is called by len()
print(len(v1))  # 2
```

## Static Methods and Class Methods

### Static Methods

Static methods don't operate on instances and don't require the `self` parameter:

```python
class MathUtils:
    @staticmethod
    def add(a, b):
        return a + b

    @staticmethod
    def multiply(a, b):
        return a * b

# Use static methods without creating an instance
print(MathUtils.add(5, 3))       # 8
print(MathUtils.multiply(5, 3))  # 15

# You can also use them from an instance
math = MathUtils()
print(math.add(5, 3))       # 8
```

### Class Methods

Class methods operate on the class itself and take a `cls` parameter:

```python
class Person:
    count = 0  # Class attribute to track the number of people

    def __init__(self, name, age):
        self.name = name
        self.age = age
        Person.count += 1

    @classmethod
    def create_adult(cls, name):
        """Create a new person who is an adult (age 18)."""
        return cls(name, 18)

    @classmethod
    def create_child(cls, name):
        """Create a new person who is a child (age 5)."""
        return cls(name, 5)

    @classmethod
    def get_count(cls):
        """Get the number of Person instances created."""
        return cls.count

# Create instances using class methods
adult = Person.create_adult("Alice")
child = Person.create_child("Bob")

print(adult.name, adult.age)  # "Alice 18"
print(child.name, child.age)  # "Bob 5"
print(Person.get_count())     # 2
```

## Abstract Base Classes

Abstract Base Classes (ABCs) define a common interface for their subclasses but can't be instantiated themselves. Python's `abc` module provides tools for creating ABCs:

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        """Calculate the area of the shape."""
        pass

    @abstractmethod
    def perimeter(self):
        """Calculate the perimeter of the shape."""
        pass

    def describe(self):
        """Describe the shape."""
        return f"This shape has an area of {self.area()} square units and a perimeter of {self.perimeter()} units."

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

    def perimeter(self):
        import math
        return 2 * math.pi * self.radius
```

Using abstract base classes:

```python
# This would raise TypeError because Shape is abstract
# shape = Shape()

# Create concrete instances
rect = Rectangle(10, 5)
circle = Circle(7)

print(rect.area())       # 50
print(rect.perimeter())  # 30
print(rect.describe())   # "This shape has an area of 50 square units and a perimeter of 30 units."

print(circle.area())       # 153.93804002589985
print(circle.perimeter())  # 43.982297150257104
print(circle.describe())   # "This shape has an area of 153.93804002589985 square units and a perimeter of 43.982297150257104 units."
```

## Practical Example: Library Management System

Let's build a practical example of a Library Management System that demonstrates OOP principles:

```python
from datetime import datetime, timedelta
from abc import ABC, abstractmethod

class LibraryItem(ABC):
    """Base class for all library items."""

    def __init__(self, title, item_id):
        self.title = title
        self.item_id = item_id
        self.checked_out = False
        self.due_date = None

    @abstractmethod
    def get_type(self):
        """Return the type of the item."""
        pass

    @abstractmethod
    def get_loan_period(self):
        """Return the loan period in days."""
        pass

    def check_out(self):
        """Check out the item."""
        if self.checked_out:
            return f"{self.title} is already checked out."

        self.checked_out = True
        self.due_date = datetime.now() + timedelta(days=self.get_loan_period())
        return f"{self.title} checked out successfully. Due on {self.due_date.strftime('%Y-%m-%d')}."

    def check_in(self):
        """Check in the item."""
        if not self.checked_out:
            return f"{self.title} is not checked out."

        self.checked_out = False
        self.due_date = None
        return f"{self.title} checked in successfully."

    def is_overdue(self):
        """Check if the item is overdue."""
        if not self.checked_out:
            return False
        return datetime.now() > self.due_date

    def __str__(self):
        status = "Checked out" if self.checked_out else "Available"
        return f"{self.get_type()}: {self.title} ({self.item_id}) - {status}"

class Book(LibraryItem):
    """A book in the library."""

    def __init__(self, title, item_id, author, pages):
        super().__init__(title, item_id)
        self.author = author
        self.pages = pages

    def get_type(self):
        return "Book"

    def get_loan_period(self):
        return 21  # 3 weeks

    def __str__(self):
        base_str = super().__str__()
        return f"{base_str}, Author: {self.author}, Pages: {self.pages}"

class DVD(LibraryItem):
    """A DVD in the library."""

    def __init__(self, title, item_id, director, runtime):
        super().__init__(title, item_id)
        self.director = director
        self.runtime = runtime  # in minutes

    def get_type(self):
        return "DVD"

    def get_loan_period(self):
        return 7  # 1 week

    def __str__(self):
        base_str = super().__str__()
        return f"{base_str}, Director: {self.director}, Runtime: {self.runtime} mins"

class Magazine(LibraryItem):
    """A magazine in the library."""

    def __init__(self, title, item_id, issue, publisher):
        super().__init__(title, item_id)
        self.issue = issue
        self.publisher = publisher

    def get_type(self):
        return "Magazine"

    def get_loan_period(self):
        return 7  # 1 week

    def __str__(self):
        base_str = super().__str__()
        return f"{base_str}, Issue: {self.issue}, Publisher: {self.publisher}"

class Patron:
    """A library patron (user)."""

    def __init__(self, name, patron_id):
        self.name = name
        self.patron_id = patron_id
        self.checked_out_items = []

    def check_out_item(self, item):
        """Check out an item from the library."""
        if item.checked_out:
            return f"Cannot check out {item.title} because it is already checked out."

        item.check_out()
        self.checked_out_items.append(item)
        return f"{self.name} checked out {item.title}."

    def return_item(self, item):
        """Return an item to the library."""
        if item not in self.checked_out_items:
            return f"{self.name} does not have {item.title} checked out."

        item.check_in()
        self.checked_out_items.remove(item)
        return f"{self.name} returned {item.title}."

    def get_checked_out_items(self):
        """Get a list of all checked out items."""
        return self.checked_out_items

    def __str__(self):
        num_items = len(self.checked_out_items)
        return f"Patron: {self.name} ({self.patron_id}), Items Checked Out: {num_items}"

class Library:
    """A library that manages items and patrons."""

    def __init__(self, name):
        self.name = name
        self.items = {}  # Dictionary of item_id -> item
        self.patrons = {}  # Dictionary of patron_id -> patron

    def add_item(self, item):
        """Add an item to the library collection."""
        if item.item_id in self.items:
            return f"Item with ID {item.item_id} already exists."

        self.items[item.item_id] = item
        return f"{item.title} added to the library."

    def add_patron(self, patron):
        """Register a new patron with the library."""
        if patron.patron_id in self.patrons:
            return f"Patron with ID {patron.patron_id} already exists."

        self.patrons[patron.patron_id] = patron
        return f"{patron.name} registered with the library."

    def check_out_item(self, patron_id, item_id):
        """Check out an item to a patron."""
        if patron_id not in self.patrons:
            return f"Patron with ID {patron_id} does not exist."

        if item_id not in self.items:
            return f"Item with ID {item_id} does not exist."

        patron = self.patrons[patron_id]
        item = self.items[item_id]

        return patron.check_out_item(item)

    def return_item(self, patron_id, item_id):
        """Return an item from a patron."""
        if patron_id not in self.patrons:
            return f"Patron with ID {patron_id} does not exist."

        if item_id not in self.items:
            return f"Item with ID {item_id} does not exist."

        patron = self.patrons[patron_id]
        item = self.items[item_id]

        return patron.return_item(item)

    def list_overdue_items(self):
        """List all overdue items."""
        overdue_items = [item for item in self.items.values() if item.is_overdue()]
        return overdue_items

    def __str__(self):
        return f"{self.name} Library - {len(self.items)} items, {len(self.patrons)} patrons"

# Example usage
def main():
    # Create a library
    library = Library("Community")

    # Add some items to the library
    book1 = Book("The Hobbit", "B001", "J.R.R. Tolkien", 295)
    book2 = Book("1984", "B002", "George Orwell", 328)
    dvd1 = DVD("The Matrix", "D001", "The Wachowskis", 136)
    magazine1 = Magazine("National Geographic", "M001", "January 2023", "National Geographic Society")

    print(library.add_item(book1))
    print(library.add_item(book2))
    print(library.add_item(dvd1))
    print(library.add_item(magazine1))

    # Register some patrons
    patron1 = Patron("Alice Smith", "P001")
    patron2 = Patron("Bob Johnson", "P002")

    print(library.add_patron(patron1))
    print(library.add_patron(patron2))

    # Check out and return items
    print(library.check_out_item("P001", "B001"))  # Alice checks out The Hobbit
    print(library.check_out_item("P002", "D001"))  # Bob checks out The Matrix
    print(library.check_out_item("P001", "M001"))  # Alice checks out National Geographic

    print("\nLibrary Items Status:")
    for item in library.items.values():
        print(f"- {item}")

    print("\nPatron Status:")
    for patron in library.patrons.values():
        print(f"- {patron}")
        for item in patron.get_checked_out_items():
            print(f"  * {item.title}")

    print("\nReturning items:")
    print(library.return_item("P001", "B001"))  # Alice returns The Hobbit

    print("\nUpdated Library Items Status:")
    for item in library.items.values():
        print(f"- {item}")

if __name__ == "__main__":
    main()
```

This example demonstrates:

1. Abstract base classes with `LibraryItem` as the parent class for different types of items
2. Inheritance with `Book`, `DVD`, and `Magazine` inheriting from `LibraryItem`
3. Encapsulation with attributes and methods organized within classes
4. Polymorphism with different implementations of `get_type` and `get_loan_period`
5. Composition with `Library` managing collections of items and patrons
6. Method overriding with `__str__` methods customized for each class
7. Property validation with check-out and check-in logic

## OOP Design Principles

As you become more comfortable with OOP, consider these design principles:

1. **Single Responsibility Principle**: A class should have only one reason to change.
2. **Open/Closed Principle**: Classes should be open for extension but closed for modification.
3. **Liskov Substitution Principle**: Objects of a superclass should be replaceable with objects of a subclass without affecting the program's correctness.
4. **Interface Segregation**: Many specific interfaces are better than one general-purpose interface.
5. **Dependency Inversion**: Depend on abstractions, not on concrete implementations.

These principles, often referred to as SOLID, help create more maintainable, flexible, and robust code.

## Next Steps

Object-oriented programming is a powerful paradigm that can help you organize and structure your code. By creating classes and objects, you can model real-world entities and their relationships, making your code more intuitive and maintainable.

In the next section, we'll put everything you've learned together to build a complete Python project from start to finish.

Happy coding!
