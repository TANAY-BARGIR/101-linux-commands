# Generic Quiz System Setup Guide

## Overview

The refactored quiz system is now completely agnostic and can handle any type of technical quiz. You simply need to create configuration files, and the system handles the rest.

## Directory Structure

```
your-project/
├── lib/
│   ├── quiz-types.ts          # TypeScript interfaces
│   └── quiz-loader.ts         # Quiz loading utilities
├── components/
│   └── games/
│       ├── generic-quiz.tsx   # Main reusable quiz component
│       └── quiz-manager.tsx   # Quiz listing component
├── content/
│   └── quizzes/               # Quiz configuration files
│       ├── git-quiz.json
│       ├── docker-fundamentals.json
│       └── kubernetes-basics.json  # (example)
└── app/
    └── games/
        ├── git-quiz/
        │   └── page.tsx       # Git quiz page
        ├── docker-quiz/
        │   └── page.tsx       # Docker quiz page
        └── page.tsx           # Games listing page
```

## Creating a New Quiz

### Step 1: Create Quiz Configuration

Create a new JSON file in `content/quizzes/`. For example, `kubernetes-basics.json`:

```json
{
  "id": "kubernetes-basics",
  "title": "Kubernetes Fundamentals Quiz",
  "description": "Test your knowledge of Kubernetes containers, pods, and orchestration",
  "category": "Kubernetes",
  "icon": "Code",
  "totalPoints": 0,
  "theme": {
    "primaryColor": "purple",
    "gradientFrom": "from-purple-500",
    "gradientTo": "to-indigo-600"
  },
  "metadata": {
    "estimatedTime": "20-25 minutes",
    "difficultyLevels": {
      "beginner": 4,
      "intermediate": 3,
      "advanced": 2
    }
  },
  "questions": [
    {
      "id": "pod-basics",
      "title": "Understanding Pods",
      "description": "What is the correct way to define a basic pod?",
      "situation": "You need to deploy a simple nginx container in Kubernetes.",
      "codeExample": "# Your goal: Deploy nginx:1.20 with port 80 exposed",
      "options": [
        "kubectl run nginx --image=nginx:1.20",
        "kubectl create deployment nginx --image=nginx:1.20",
        "kubectl run nginx --image=nginx:1.20 --port=80",
        "kubectl apply -f nginx-pod.yaml"
      ],
      "correctAnswer": 2,
      "explanation": "kubectl run with --port flag creates a pod and exposes the specified port, which is exactly what we need for a basic nginx deployment.",
      "hint": "Think about the simplest way to create a single pod with port exposure.",
      "difficulty": "beginner",
      "points": 10
    }
  ]
}
```

### Step 2: Quiz Pages (Automatic)

With the new dynamic quiz system, quiz pages are automatically generated from your JSON configuration. The system uses a single dynamic route at `app/quizzes/[slug]/page.tsx` that handles all quizzes.

The dynamic page automatically:

- Generates static pages for all quiz JSON files
- Creates proper metadata and SEO
- Handles breadcrumbs and social sharing
- Displays quiz statistics and difficulty breakdown

No manual page creation is needed - just add your quiz JSON file to `content/quizzes/`!
import { getQuizById } from '@/lib/quiz-loader';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
title: 'Your Quiz Title',
description: 'Your quiz description',
};

export default async function YourQuizPage() {
const quizConfig = await getQuizById('your-quiz-id');

if (!quizConfig) {
notFound();
}

return (

<div className="container mx-auto px-4 py-8">
<GenericQuiz quizConfig={quizConfig} />
</div>
);
}

````

### Step 3: Route Mapping (Automatic)

With the new dynamic quiz system, route mapping is handled automatically. The QuizManager component now uses a simple pattern:

```typescript
const getQuizUrl = (quizId: string) => {
  return `/quizzes/${quizId}`;
};
````

All quizzes are automatically accessible at `/quizzes/[quiz-id]` where `quiz-id` matches the `id` field in your JSON configuration.

## Question Types Supported

### 1. Multiple Choice with Code

```json
{
  "codeExample": "// Your code here\nconst example = 'value';",
  "options": ["Option A", "Option B", "Option C", "Option D"]
}
```

### 2. Scenario-Based (like Git quiz)

```json
{
  "situation": "Description of the scenario",
  "branches": [{ "name": "main", "commits": ["commit1", "commit2"], "current": true }],
  "conflict": "Description of any conflicts"
}
```

### 3. Simple Multiple Choice

```json
{
  "description": "Simple question description",
  "options": ["Option A", "Option B", "Option C", "Option D"]
}
```

## Customization Options

### Theme Colors

Available gradient combinations:

- `from-blue-500 to-cyan-600` (Docker style)
- `from-orange-500 to-red-600` (Git style)
- `from-purple-500 to-indigo-600` (Kubernetes style)
- `from-green-500 to-emerald-600` (DevOps style)
- `from-yellow-500 to-orange-600` (AWS style)

### Icons

Available icons (from Lucide React):

- `GitBranch` - For Git/VCS quizzes
- `Code` - For programming/general tech
- `Terminal` - For CLI/command-line topics
- `Target` - For testing/assessment
- `BookOpen` - For learning/educational
- `Zap` - For performance/optimization
- `Trophy` - For challenges/achievements
- `Star` - For featured/important content

### Difficulty Levels

- `beginner` - Green badge, basic concepts
- `intermediate` - Yellow badge, practical application
- `advanced` - Red badge, complex scenarios

## Features Included

✅ **Visual Appeal**: Animated UI with gradients and smooth transitions  
✅ **Progress Tracking**: Visual progress bar and scoring system  
✅ **Hint System**: Optional hints for each question  
✅ **Explanations**: Detailed explanations for each answer  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Share Functionality**: Built-in social sharing  
✅ **Performance Ratings**: Dynamic scoring with titles  
✅ **Restart Capability**: Easy restart functionality

## Usage Examples

### Load All Quizzes

```typescript
import { getAllQuizzes } from '@/lib/quiz-loader';

const quizzes = await getAllQuizzes();
```

### Load Specific Quiz

```typescript
import { getQuizById } from '@/lib/quiz-loader';

const gitQuiz = await getQuizById('git-quiz');
```

### Quiz Metadata Only

```typescript
import { getQuizMetadata } from '@/lib/quiz-loader';

const metadata = await getQuizMetadata();
```

## Best Practices

1. **Keep questions practical** - Base them on real-world scenarios
2. **Provide good explanations** - Help users learn, don't just test
3. **Balance difficulty** - Mix beginner, intermediate, and advanced questions
4. **Use hints wisely** - Guide users without giving away answers
5. **Test thoroughly** - Verify all answers and explanations are correct
6. **Consistent theming** - Match colors to the topic/technology

## Adding to Games Page

Update your games page to include the new quiz in the listing and add it to the quiz manager component.

This system makes it incredibly easy to add new quizzes - just create a JSON configuration file and a simple page component, and you're done! The entire quiz functionality, UI, and user experience is handled automatically.
