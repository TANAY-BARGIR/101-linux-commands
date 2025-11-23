---
title: 'Building a Practical Project'
description: "Apply everything you've learned by building a complete Python application"
order: 10
---

Congratulations on making it to the final section of this Python guide! In this section, we'll apply everything you've learned by building a complete Python application: a Task Management System. This project will incorporate all the major concepts we've covered, from basic syntax to object-oriented programming.

## Project Overview: Task Management System

Our Task Management System will allow users to:

- Create, view, update, and delete tasks
- Organize tasks into projects
- Set priorities and due dates for tasks
- Mark tasks as complete
- Save and load tasks from a file
- Generate reports on task status

Let's break down the implementation into steps:

## Step 1: Planning the Project Structure

Before we start coding, let's plan our project structure:

```
task_manager/
│
├── task_manager.py      # Main script to run the application
├── models.py            # Classes for Task, Project, etc.
├── storage.py           # Functions for saving/loading data
├── reports.py           # Functions for generating reports
├── utils.py             # Utility functions
└── data/                # Directory for saved data
    └── tasks.json       # JSON file to store tasks
```

## Step 2: Implementing the Models

Let's start by defining our data models in `models.py`:

```python
"""
Models for the Task Management System.

This module defines the classes for Task, Project, and other data structures.
"""

from datetime import datetime, timedelta
from enum import Enum
import uuid

class Priority(Enum):
    """Priority levels for tasks."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

    def __str__(self):
        return self.name

class Status(Enum):
    """Status options for tasks."""
    NOT_STARTED = 1
    IN_PROGRESS = 2
    COMPLETED = 3

    def __str__(self):
        return self.name.replace('_', ' ').title()

class Task:
    """Represents a task in the system."""

    def __init__(self, title, description="", priority=Priority.MEDIUM,
                 due_date=None, project=None):
        """Initialize a new Task."""
        self.id = str(uuid.uuid4())[:8]  # Generate a unique ID
        self.title = title
        self.description = description
        self.priority = priority
        self.status = Status.NOT_STARTED
        self.created_at = datetime.now()
        self.completed_at = None
        self.due_date = due_date
        self.project = project

    def mark_complete(self):
        """Mark the task as complete."""
        self.status = Status.COMPLETED
        self.completed_at = datetime.now()

    def mark_in_progress(self):
        """Mark the task as in progress."""
        self.status = Status.IN_PROGRESS

    def update(self, title=None, description=None, priority=None, due_date=None, project=None):
        """Update task details."""
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if priority is not None:
            self.priority = priority
        if due_date is not None:
            self.due_date = due_date
        if project is not None:
            self.project = project

    def is_overdue(self):
        """Check if the task is overdue."""
        if self.due_date and self.status != Status.COMPLETED:
            return datetime.now() > self.due_date
        return False

    def days_left(self):
        """Calculate days left until the due date."""
        if not self.due_date:
            return None
        if self.status == Status.COMPLETED:
            return 0

        time_left = self.due_date - datetime.now()
        return max(0, time_left.days)

    def to_dict(self):
        """Convert the task to a dictionary for storage."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority.name,
            'status': self.status.name,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'project': self.project
        }

    @classmethod
    def from_dict(cls, data):
        """Create a Task instance from a dictionary."""
        task = cls(
            title=data['title'],
            description=data.get('description', ''),
            priority=Priority[data['priority']],
            due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
            project=data.get('project')
        )
        task.id = data['id']
        task.status = Status[data['status']]
        task.created_at = datetime.fromisoformat(data['created_at'])
        if data.get('completed_at'):
            task.completed_at = datetime.fromisoformat(data['completed_at'])
        return task

    def __str__(self):
        """Return a string representation of the task."""
        status_str = f"[{self.status}]"
        priority_str = f"({self.priority})"

        if self.is_overdue():
            due_str = "OVERDUE"
        elif self.due_date:
            days = self.days_left()
            due_str = f"{days} day{'s' if days != 1 else ''} left"
        else:
            due_str = "No due date"

        project_str = f"Project: {self.project}" if self.project else "No project"

        return f"{self.title} {status_str} {priority_str} - {due_str} - {project_str}"

class TaskManager:
    """Manages a collection of tasks."""

    def __init__(self):
        """Initialize a new TaskManager."""
        self.tasks = {}  # Dictionary of task_id -> task
        self.projects = set()  # Set of project names

    def add_task(self, task):
        """Add a task to the manager."""
        self.tasks[task.id] = task
        if task.project:
            self.projects.add(task.project)

    def get_task(self, task_id):
        """Get a task by ID."""
        return self.tasks.get(task_id)

    def delete_task(self, task_id):
        """Delete a task by ID."""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            del self.tasks[task_id]

            # Update projects set if necessary
            if task.project and all(t.project != task.project for t in self.tasks.values()):
                self.projects.remove(task.project)

            return True
        return False

    def get_all_tasks(self):
        """Get all tasks."""
        return list(self.tasks.values())

    def get_tasks_by_status(self, status):
        """Get tasks by status."""
        return [task for task in self.tasks.values() if task.status == status]

    def get_tasks_by_priority(self, priority):
        """Get tasks by priority."""
        return [task for task in self.tasks.values() if task.priority == priority]

    def get_tasks_by_project(self, project):
        """Get tasks by project."""
        return [task for task in self.tasks.values() if task.project == project]

    def get_overdue_tasks(self):
        """Get all overdue tasks."""
        return [task for task in self.tasks.values() if task.is_overdue()]

    def get_due_soon_tasks(self, days=3):
        """Get tasks due within the specified number of days."""
        result = []
        for task in self.tasks.values():
            if task.status != Status.COMPLETED and task.due_date:
                days_left = task.days_left()
                if days_left is not None and days_left <= days:
                    result.append(task)
        return result

    def to_dict(self):
        """Convert all tasks to a dictionary for storage."""
        return {
            'tasks': [task.to_dict() for task in self.tasks.values()]
        }

    @classmethod
    def from_dict(cls, data):
        """Create a TaskManager instance from a dictionary."""
        manager = cls()
        for task_data in data.get('tasks', []):
            task = Task.from_dict(task_data)
            manager.add_task(task)
        return manager
```

## Step 3: Implementing Storage Functions

Now, let's create functions to save and load our data in `storage.py`:

```python
"""
Storage functions for the Task Management System.

This module provides functions to save and load task data.
"""

import json
import os
from models import Task, TaskManager

# Default data directory and file
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "tasks.json")

def ensure_data_dir():
    """Ensure the data directory exists."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def save_tasks(task_manager, file_path=DATA_FILE):
    """
    Save tasks to a JSON file.

    Args:
        task_manager (TaskManager): The task manager to save.
        file_path (str): Path to the file where tasks will be saved.

    Returns:
        bool: True if successful, False otherwise.
    """
    ensure_data_dir()

    try:
        with open(file_path, 'w') as f:
            json.dump(task_manager.to_dict(), f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving tasks: {e}")
        return False

def load_tasks(file_path=DATA_FILE):
    """
    Load tasks from a JSON file.

    Args:
        file_path (str): Path to the file to load tasks from.

    Returns:
        TaskManager: A task manager with loaded tasks, or a new one if loading fails.
    """
    if not os.path.exists(file_path):
        return TaskManager()

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return TaskManager.from_dict(data)
    except Exception as e:
        print(f"Error loading tasks: {e}")
        return TaskManager()
```

## Step 4: Implementing Report Generation

Let's create functions to generate reports in `reports.py`:

```python
"""
Reports for the Task Management System.

This module provides functions to generate reports from task data.
"""

from datetime import datetime
from models import Status, Priority

def generate_status_report(task_manager):
    """
    Generate a report on task status.

    Args:
        task_manager (TaskManager): The task manager to generate the report from.

    Returns:
        str: A formatted report.
    """
    not_started = task_manager.get_tasks_by_status(Status.NOT_STARTED)
    in_progress = task_manager.get_tasks_by_status(Status.IN_PROGRESS)
    completed = task_manager.get_tasks_by_status(Status.COMPLETED)

    total = len(task_manager.get_all_tasks())
    if total == 0:
        return "No tasks to report on."

    not_started_percent = len(not_started) / total * 100 if total > 0 else 0
    in_progress_percent = len(in_progress) / total * 100 if total > 0 else 0
    completed_percent = len(completed) / total * 100 if total > 0 else 0

    report = "Task Status Report\n"
    report += "=================\n\n"
    report += f"Total Tasks: {total}\n\n"
    report += f"Not Started: {len(not_started)} ({not_started_percent:.1f}%)\n"
    report += f"In Progress: {len(in_progress)} ({in_progress_percent:.1f}%)\n"
    report += f"Completed: {len(completed)} ({completed_percent:.1f}%)\n"

    return report

def generate_priority_report(task_manager):
    """
    Generate a report on task priorities.

    Args:
        task_manager (TaskManager): The task manager to generate the report from.

    Returns:
        str: A formatted report.
    """
    low = task_manager.get_tasks_by_priority(Priority.LOW)
    medium = task_manager.get_tasks_by_priority(Priority.MEDIUM)
    high = task_manager.get_tasks_by_priority(Priority.HIGH)
    urgent = task_manager.get_tasks_by_priority(Priority.URGENT)

    total = len(task_manager.get_all_tasks())
    if total == 0:
        return "No tasks to report on."

    report = "Task Priority Report\n"
    report += "===================\n\n"
    report += f"Total Tasks: {total}\n\n"
    report += f"Low Priority: {len(low)} ({len(low) / total * 100:.1f}%)\n"
    report += f"Medium Priority: {len(medium)} ({len(medium) / total * 100:.1f}%)\n"
    report += f"High Priority: {len(high)} ({len(high) / total * 100:.1f}%)\n"
    report += f"Urgent Priority: {len(urgent)} ({len(urgent) / total * 100:.1f}%)\n"

    return report

def generate_overdue_report(task_manager):
    """
    Generate a report on overdue tasks.

    Args:
        task_manager (TaskManager): The task manager to generate the report from.

    Returns:
        str: A formatted report.
    """
    overdue_tasks = task_manager.get_overdue_tasks()

    if not overdue_tasks:
        return "No overdue tasks. Good job!"

    report = "Overdue Tasks Report\n"
    report += "===================\n\n"
    report += f"Number of Overdue Tasks: {len(overdue_tasks)}\n\n"
    report += "Overdue Tasks:\n"

    for task in sorted(overdue_tasks, key=lambda t: t.due_date):
        days_overdue = (datetime.now() - task.due_date).days
        report += f"- {task.title} (Due: {task.due_date.strftime('%Y-%m-%d')}, {days_overdue} days overdue)\n"

    return report

def generate_project_report(task_manager):
    """
    Generate a report on tasks by project.

    Args:
        task_manager (TaskManager): The task manager to generate the report from.

    Returns:
        str: A formatted report.
    """
    all_tasks = task_manager.get_all_tasks()

    if not all_tasks:
        return "No tasks to report on."

    # Count tasks by project
    projects = {}
    for task in all_tasks:
        project = task.project or "No Project"
        if project not in projects:
            projects[project] = {
                'total': 0,
                'not_started': 0,
                'in_progress': 0,
                'completed': 0
            }

        projects[project]['total'] += 1

        if task.status == Status.NOT_STARTED:
            projects[project]['not_started'] += 1
        elif task.status == Status.IN_PROGRESS:
            projects[project]['in_progress'] += 1
        elif task.status == Status.COMPLETED:
            projects[project]['completed'] += 1

    report = "Project Report\n"
    report += "=============\n\n"
    report += f"Number of Projects: {len(projects)}\n\n"

    for project, counts in sorted(projects.items()):
        completed_percent = counts['completed'] / counts['total'] * 100 if counts['total'] > 0 else 0
        report += f"Project: {project}\n"
        report += f"  Total Tasks: {counts['total']}\n"
        report += f"  Not Started: {counts['not_started']}\n"
        report += f"  In Progress: {counts['in_progress']}\n"
        report += f"  Completed: {counts['completed']} ({completed_percent:.1f}%)\n\n"

    return report
```

## Step 5: Implementing Utility Functions

Let's create some utility functions in `utils.py`:

```python
"""
Utility functions for the Task Management System.

This module provides helper functions for the application.
"""

from datetime import datetime, timedelta
from models import Priority, Status

def parse_date(date_str):
    """
    Parse a date string into a datetime object.

    Accepted formats:
    - YYYY-MM-DD
    - DD/MM/YYYY
    - today
    - tomorrow
    - next week

    Args:
        date_str (str): The date string to parse.

    Returns:
        datetime or None: The parsed date, or None if parsing failed.
    """
    if not date_str:
        return None

    date_str = date_str.strip().lower()

    # Handle relative dates
    if date_str == 'today':
        return datetime.now().replace(hour=23, minute=59, second=59)

    if date_str == 'tomorrow':
        return (datetime.now() + timedelta(days=1)).replace(hour=23, minute=59, second=59)

    if date_str == 'next week':
        return (datetime.now() + timedelta(days=7)).replace(hour=23, minute=59, second=59)

    # Try parsing formats
    formats = ['%Y-%m-%d', '%d/%m/%Y']

    for fmt in formats:
        try:
            date = datetime.strptime(date_str, fmt)
            return date.replace(hour=23, minute=59, second=59)
        except ValueError:
            continue

    return None

def parse_priority(priority_str):
    """
    Parse a priority string into a Priority enum.

    Args:
        priority_str (str): The priority string to parse.

    Returns:
        Priority: The parsed priority, or Priority.MEDIUM if parsing failed.
    """
    if not priority_str:
        return Priority.MEDIUM

    priority_str = priority_str.strip().upper()

    try:
        return Priority[priority_str]
    except KeyError:
        # Try to parse by numeric value
        priority_map = {
            '1': Priority.LOW,
            '2': Priority.MEDIUM,
            '3': Priority.HIGH,
            '4': Priority.URGENT
        }

        if priority_str in priority_map:
            return priority_map[priority_str]

        # Try to match by name
        for priority in Priority:
            if priority.name.startswith(priority_str):
                return priority

        return Priority.MEDIUM

def format_task_list(tasks):
    """
    Format a list of tasks for display.

    Args:
        tasks (list): A list of Task objects.

    Returns:
        str: A formatted string representation of the tasks.
    """
    if not tasks:
        return "No tasks found."

    result = "\n"
    for i, task in enumerate(tasks, 1):
        result += f"{i}. {task}\n"

    return result
```

## Step 6: Implementing the Main Application

Finally, let's create the main application script in `task_manager.py`:

```python
"""
Task Management System

A command-line application for managing tasks and projects.
"""

import os
import sys
from datetime import datetime, timedelta

from models import Task, TaskManager, Priority, Status
from storage import save_tasks, load_tasks
from reports import (
    generate_status_report, generate_priority_report,
    generate_overdue_report, generate_project_report
)
from utils import parse_date, parse_priority, format_task_list

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print the application header."""
    clear_screen()
    print("=" * 50)
    print("            TASK MANAGEMENT SYSTEM             ")
    print("=" * 50)
    print()

def print_menu():
    """Print the main menu."""
    print("\nMain Menu:")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Update Task")
    print("4. Delete Task")
    print("5. Mark Task as Complete")
    print("6. Mark Task as In Progress")
    print("7. View Reports")
    print("8. Save and Exit")
    print()

def add_task(task_manager):
    """Add a new task to the task manager."""
    print_header()
    print("Add a New Task")
    print("--------------")

    title = input("Title: ").strip()
    if not title:
        print("Task must have a title. Returning to main menu.")
        return

    description = input("Description (optional): ").strip()

    priority_str = input("Priority (LOW, MEDIUM, HIGH, URGENT) [MEDIUM]: ").strip()
    priority = parse_priority(priority_str)

    due_date_str = input("Due Date (YYYY-MM-DD, DD/MM/YYYY, today, tomorrow, next week) [none]: ").strip()
    due_date = parse_date(due_date_str)

    project = input("Project (optional): ").strip()

    task = Task(title, description, priority, due_date, project)
    task_manager.add_task(task)

    print(f"\nTask '{title}' added successfully.")
    input("Press Enter to continue...")

def view_tasks(task_manager):
    """View tasks with filtering options."""
    while True:
        print_header()
        print("View Tasks")
        print("----------")
        print("1. View All Tasks")
        print("2. View Tasks by Status")
        print("3. View Tasks by Priority")
        print("4. View Tasks by Project")
        print("5. View Overdue Tasks")
        print("6. View Tasks Due Soon")
        print("7. Return to Main Menu")
        print()

        choice = input("Enter your choice (1-7): ").strip()

        if choice == '1':
            tasks = task_manager.get_all_tasks()
            print(format_task_list(tasks))

        elif choice == '2':
            print("\nTask Status Options:")
            for i, status in enumerate(Status, 1):
                print(f"{i}. {status}")

            status_choice = input("\nSelect status (1-3): ").strip()
            try:
                status_index = int(status_choice) - 1
                if 0 <= status_index < len(Status):
                    status = list(Status)[status_index]
                    tasks = task_manager.get_tasks_by_status(status)
                    print(format_task_list(tasks))
                else:
                    print("Invalid status option.")
            except ValueError:
                print("Please enter a number.")

        elif choice == '3':
            print("\nTask Priority Options:")
            for i, priority in enumerate(Priority, 1):
                print(f"{i}. {priority}")

            priority_choice = input("\nSelect priority (1-4): ").strip()
            try:
                priority_index = int(priority_choice) - 1
                if 0 <= priority_index < len(Priority):
                    priority = list(Priority)[priority_index]
                    tasks = task_manager.get_tasks_by_priority(priority)
                    print(format_task_list(tasks))
                else:
                    print("Invalid priority option.")
            except ValueError:
                print("Please enter a number.")

        elif choice == '4':
            if not task_manager.projects:
                print("No projects found.")
            else:
                print("\nProjects:")
                for i, project in enumerate(sorted(task_manager.projects), 1):
                    print(f"{i}. {project}")

                project_choice = input("\nSelect project number or enter project name: ").strip()

                try:
                    project_index = int(project_choice) - 1
                    if 0 <= project_index < len(task_manager.projects):
                        project = sorted(task_manager.projects)[project_index]
                        tasks = task_manager.get_tasks_by_project(project)
                        print(format_task_list(tasks))
                    else:
                        print("Invalid project option.")
                except ValueError:
                    # User entered a project name
                    tasks = task_manager.get_tasks_by_project(project_choice)
                    print(format_task_list(tasks))

        elif choice == '5':
            tasks = task_manager.get_overdue_tasks()
            print(format_task_list(tasks))

        elif choice == '6':
            days_str = input("Enter number of days (default: 3): ").strip()
            try:
                days = int(days_str) if days_str else 3
                tasks = task_manager.get_due_soon_tasks(days)
                print(format_task_list(tasks))
            except ValueError:
                print("Please enter a valid number.")

        elif choice == '7':
            return

        else:
            print("Invalid choice. Please try again.")

        input("Press Enter to continue...")

def select_task(task_manager, prompt="Select a task: "):
    """Helper function to select a task."""
    tasks = task_manager.get_all_tasks()

    if not tasks:
        print("No tasks available.")
        return None

    print("\nAvailable Tasks:")
    for i, task in enumerate(tasks, 1):
        print(f"{i}. {task.title}")

    task_choice = input(f"\n{prompt}").strip()

    try:
        task_index = int(task_choice) - 1
        if 0 <= task_index < len(tasks):
            return tasks[task_index]
        else:
            print("Invalid task number.")
            return None
    except ValueError:
        # Try to find by ID or title
        for task in tasks:
            if task_choice == task.id or task_choice.lower() == task.title.lower():
                return task

        print("Task not found.")
        return None

def update_task(task_manager):
    """Update an existing task."""
    print_header()
    print("Update Task")
    print("-----------")

    task = select_task(task_manager)
    if not task:
        input("Press Enter to continue...")
        return

    print(f"\nUpdating Task: {task.title}")
    print("Leave fields blank to keep current values.")

    title = input(f"Title [{task.title}]: ").strip()
    description = input(f"Description [{task.description}]: ").strip()

    priority_str = input(f"Priority ({task.priority}) [LOW, MEDIUM, HIGH, URGENT]: ").strip()
    priority = parse_priority(priority_str) if priority_str else None

    due_date_display = task.due_date.strftime("%Y-%m-%d") if task.due_date else "none"
    due_date_str = input(f"Due Date [{due_date_display}] (YYYY-MM-DD, today, tomorrow, next week): ").strip()
    due_date = parse_date(due_date_str) if due_date_str else None

    project_display = task.project if task.project else "none"
    project = input(f"Project [{project_display}]: ").strip()

    # Update task with new values
    task.update(
        title=title if title else None,
        description=description if description else None,
        priority=priority,
        due_date=due_date,
        project=project if project else None
    )

    print(f"\nTask '{task.title}' updated successfully.")
    input("Press Enter to continue...")

def delete_task(task_manager):
    """Delete a task."""
    print_header()
    print("Delete Task")
    print("-----------")

    task = select_task(task_manager)
    if not task:
        input("Press Enter to continue...")
        return

    confirm = input(f"Are you sure you want to delete '{task.title}'? (y/n): ").strip().lower()

    if confirm == 'y':
        task_manager.delete_task(task.id)
        print(f"\nTask '{task.title}' deleted successfully.")
    else:
        print("\nDeletion cancelled.")

    input("Press Enter to continue...")

def mark_task_complete(task_manager):
    """Mark a task as complete."""
    print_header()
    print("Mark Task as Complete")
    print("--------------------")

    task = select_task(task_manager)
    if not task:
        input("Press Enter to continue...")
        return

    task.mark_complete()
    print(f"\nTask '{task.title}' marked as complete.")
    input("Press Enter to continue...")

def mark_task_in_progress(task_manager):
    """Mark a task as in progress."""
    print_header()
    print("Mark Task as In Progress")
    print("-----------------------")

    task = select_task(task_manager)
    if not task:
        input("Press Enter to continue...")
        return

    task.mark_in_progress()
    print(f"\nTask '{task.title}' marked as in progress.")
    input("Press Enter to continue...")

def view_reports(task_manager):
    """View various reports about tasks."""
    while True:
        print_header()
        print("View Reports")
        print("-----------")
        print("1. Status Report")
        print("2. Priority Report")
        print("3. Overdue Tasks Report")
        print("4. Project Report")
        print("5. Return to Main Menu")
        print()

        choice = input("Enter your choice (1-5): ").strip()

        if choice == '1':
            report = generate_status_report(task_manager)
            print("\n" + report)

        elif choice == '2':
            report = generate_priority_report(task_manager)
            print("\n" + report)

        elif choice == '3':
            report = generate_overdue_report(task_manager)
            print("\n" + report)

        elif choice == '4':
            report = generate_project_report(task_manager)
            print("\n" + report)

        elif choice == '5':
            return

        else:
            print("Invalid choice. Please try again.")

        input("Press Enter to continue...")

def main():
    """Main function to run the Task Management System."""
    # Load tasks from file
    task_manager = load_tasks()

    while True:
        print_header()
        print_menu()

        choice = input("Enter your choice (1-8): ").strip()

        if choice == '1':
            add_task(task_manager)
        elif choice == '2':
            view_tasks(task_manager)
        elif choice == '3':
            update_task(task_manager)
        elif choice == '4':
            delete_task(task_manager)
        elif choice == '5':
            mark_task_complete(task_manager)
        elif choice == '6':
            mark_task_in_progress(task_manager)
        elif choice == '7':
            view_reports(task_manager)
        elif choice == '8':
            # Save tasks before exiting
            if save_tasks(task_manager):
                print("Tasks saved successfully.")
            else:
                print("Error saving tasks.")

            print("Thank you for using the Task Management System. Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")
            input("Press Enter to continue...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProgram terminated by user.")
        sys.exit(0)
```

## Step 7: Running the Application

To run the application, navigate to the `task_manager` directory and execute:

```bash
python task_manager.py
```

This will start the Task Management System in your terminal.

## Project Summary

Let's review what we've built and the Python concepts we've applied:

### Data Models (`models.py`)

- **Classes and Objects**: We defined classes for `Task` and `TaskManager`
- **Enums**: We used the `Enum` class for `Priority` and `Status`
- **Special Methods**: We implemented `__str__` for custom string representation
- **Type Conversion**: We created methods to convert between objects and dictionaries

### Storage (`storage.py`)

- **File Operations**: We used file I/O to save and load data
- **JSON Serialization**: We converted Python objects to/from JSON
- **Error Handling**: We used try-except blocks to handle potential errors
- **Path Handling**: We used the `os` module to work with file paths

### Reporting (`reports.py`)

- **Function Definitions**: We created functions for different report types
- **String Formatting**: We formatted reports for readable output
- **Date Manipulation**: We worked with datetime objects for date calculations
- **List Comprehensions**: We filtered and processed lists of tasks

### Utilities (`utils.py`)

- **Date Parsing**: We converted string inputs to datetime objects
- **Enum Parsing**: We converted string inputs to enum values
- **Flexible Input Handling**: We accommodated different input formats

### Main Application (`task_manager.py`)

- **Command-Line Interface**: We built a text-based user interface
- **Menu System**: We implemented a menu-driven application flow
- **User Input Validation**: We validated and processed user inputs
- **Application Logic**: We connected all components together

### Python Concepts Applied

- **Variables and Data Types**: Strings, integers, lists, dictionaries
- **Control Flow**: If statements, loops, conditional expressions
- **Functions**: Definition, parameters, return values
- **Data Structures**: Lists, dictionaries, sets
- **Modules and Packages**: Organizing code in separate files
- **File Operations**: Reading from and writing to files
- **Error Handling**: Using try-except blocks
- **Object-Oriented Programming**: Classes, inheritance, encapsulation
- **Date and Time Handling**: Using the datetime module
- **JSON Serialization**: Converting between Python objects and JSON
- **Command-Line Interface**: Building a text-based user interface

## Extending the Project

This Task Management System can be extended in many ways:

1. **Add a GUI**: Create a graphical user interface using Tkinter or PyQt
2. **Add a Database**: Replace the JSON storage with SQLite or another database
3. **Add Reminders**: Implement a notification system for upcoming due dates
4. **Add User Authentication**: Support multiple users with login functionality
5. **Add Task Dependencies**: Allow tasks to depend on other tasks
6. **Add Tags**: Implement a tagging system for better organization
7. **Add Search**: Implement a search function to find tasks by keywords
8. **Add Collaboration**: Allow sharing tasks between users
9. **Add Sync**: Synchronize tasks with online services
10. **Add Statistics**: Generate more detailed reports and visualizations

## Conclusion

Congratulations! You've built a complete Python application that demonstrates all the concepts we've covered in this guide. The Task Management System is a practical example of how Python can be used to create useful software.

Remember, the best way to improve your Python skills is to continue building projects. Take what you've learned here and apply it to your own ideas. Experiment with new libraries, tackle different problems, and seek feedback from others.

The Python journey doesn't end here, it's just beginning. Keep learning, keep coding, and keep having fun!

Happy coding!
