"""
Management command to seed the database with sample problems
Usage: python manage.py seed_problems
"""
import json
from django.core.management.base import BaseCommand
from problems.models import Problem, Tag


SAMPLE_PROBLEMS = [
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "EASY",
        "description": """## Two Sum

Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in **any order**.

### Constraints
- `2 ≤ nums.length ≤ 10⁴`
- `-10⁹ ≤ nums[i] ≤ 10⁹`
- `-10⁹ ≤ target ≤ 10⁹`
- **Only one valid answer exists.**
""",
        "tags": ["Array", "Hash Table"],
        "examples": [
            {"input": "4\n2 7 11 15\n9", "output": "0 1"},
            {"input": "3\n3 2 4\n6", "output": "1 2"},
            {"input": "2\n3 3\n6", "output": "0 1"},
        ],
        "test_cases": [
            {"input": "4\n2 7 11 15\n9", "output": "0 1"},
            {"input": "3\n3 2 4\n6", "output": "1 2"},
            {"input": "2\n3 3\n6", "output": "0 1"},
            {"input": "5\n1 3 5 7 9\n10", "output": "1 3"},
        ],
        "starter_code": {
            "python": "import sys\ninput_data = sys.stdin.read().split()\nn = int(input_data[0])\nnums = list(map(int, input_data[1:n+1]))\ntarget = int(input_data[n+1])\n\ndef two_sum(nums, target):\n    # Your solution here\n    pass\n\nresult = two_sum(nums, target)\nprint(result[0], result[1])\n",
        },
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
    },
    {
        "title": "Maximum Subarray",
        "slug": "maximum-subarray",
        "difficulty": "MEDIUM",
        "description": """## Maximum Subarray

Given an integer array `nums`, find the **subarray** with the largest sum, and **return its sum**.

### Constraints
- `1 ≤ nums.length ≤ 10⁵`
- `-10⁴ ≤ nums[i] ≤ 10⁴`
""",
        "tags": ["Array", "Dynamic Programming"],
        "examples": [
            {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "output": "6"},
            {"input": "1\n1", "output": "1"},
            {"input": "5\n5 4 -1 7 8", "output": "23"},
        ],
        "test_cases": [
            {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "output": "6"},
            {"input": "1\n1", "output": "1"},
            {"input": "5\n5 4 -1 7 8", "output": "23"},
            {"input": "4\n-1 -2 -3 -4", "output": "-1"},
        ],
        "starter_code": {
            "python": "import sys\ndata = sys.stdin.read().split()\nn = int(data[0])\nnums = list(map(int, data[1:]))\n\ndef max_subarray(nums):\n    # Your solution here (Kadane's algorithm?)\n    pass\n\nprint(max_subarray(nums))\n",
        },
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
    },
    {
        "title": "Longest Palindromic Substring",
        "slug": "longest-palindromic-substring",
        "difficulty": "HARD",
        "description": """## Longest Palindromic Substring

Given a string `s`, return the **longest palindromic substring** in `s`.

### Constraints
- `1 ≤ s.length ≤ 1000`
- `s` consists of only digits and English letters.
""",
        "tags": ["String", "Dynamic Programming"],
        "examples": [
            {"input": "babad", "output": "bab"},
            {"input": "cbbd", "output": "bb"},
        ],
        "test_cases": [
            {"input": "babad", "output": "bab"},
            {"input": "cbbd", "output": "bb"},
            {"input": "a", "output": "a"},
            {"input": "racecar", "output": "racecar"},
        ],
        "starter_code": {
            "python": "import sys\ns = sys.stdin.read().strip()\n\ndef longest_palindrome(s):\n    # Your solution here\n    pass\n\nprint(longest_palindrome(s))\n",
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
    },
    {
        "title": "N-Queens",
        "slug": "n-queens",
        "difficulty": "ELITE",
        "description": """## N-Queens ☠️

The **N-Queens** puzzle is the problem of placing `n` queens on an `n × n` chessboard such that no two queens attack each other.

Given an integer `n`, return the **number of distinct solutions** to the n-queens puzzle.

### Constraints
- `1 ≤ n ≤ 9`
""",
        "tags": ["Backtracking", "Array"],
        "examples": [
            {"input": "4", "output": "2"},
            {"input": "1", "output": "1"},
        ],
        "test_cases": [
            {"input": "1", "output": "1"},
            {"input": "2", "output": "0"},
            {"input": "3", "output": "0"},
            {"input": "4", "output": "2"},
            {"input": "8", "output": "92"},
        ],
        "starter_code": {
            "python": "import sys\nn = int(sys.stdin.read().strip())\n\ndef total_n_queens(n):\n    # Your solution here\n    pass\n\nprint(total_n_queens(n))\n",
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
    },
]

TAG_COLORS = {
    "Array": "#00ffcc",
    "Hash Table": "#ff6b6b",
    "Dynamic Programming": "#ffd93d",
    "String": "#a29bfe",
    "Backtracking": "#fd79a8",
    "Math": "#74b9ff",
    "Sorting": "#55efc4",
    "Binary Search": "#fdcb6e",
    "Graph": "#e17055",
    "Tree": "#00cec9",
}


class Command(BaseCommand):
    help = 'Seed the database with sample problems and tags'

    def handle(self, *args, **options):
        self.stdout.write('Seeding problems...')

        for p_data in SAMPLE_PROBLEMS:
            tags_data = p_data.pop('tags', [])
            problem, created = Problem.objects.get_or_create(
                slug=p_data['slug'],
                defaults=p_data,
            )
            if not created:
                for k, v in p_data.items():
                    setattr(problem, k, v)
                problem.save()

            # Tags
            problem.tags.clear()
            for tag_name in tags_data:
                tag, _ = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'color': TAG_COLORS.get(tag_name, '#ffffff')}
                )
                problem.tags.add(tag)

            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: [{problem.difficulty}] {problem.title}')

        self.stdout.write(self.style.SUCCESS(f'\nSeeded {len(SAMPLE_PROBLEMS)} problems successfully!'))

# ── Extra problems appended by second seed pass ──────────────────────────────
EXTRA_PROBLEMS = [
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "difficulty": "EASY",
        "description": """## Valid Parentheses

Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.

### Constraints
- `1 ≤ s.length ≤ 10⁴`
- `s` consists of parentheses only `()[]{}`
""",
        "tags": ["String", "Stack"],
        "examples": [
            {"input": "()", "output": "True"},
            {"input": "()[]{}", "output": "True"},
            {"input": "(]", "output": "False"},
        ],
        "test_cases": [
            {"input": "()", "expected": "True"},
            {"input": "()[]{}", "expected": "True"},
            {"input": "(]", "expected": "False"},
            {"input": "([)]", "expected": "False"},
            {"input": "{[]}", "expected": "True"},
            {"input": "", "expected": "True"},
        ],
        "starter_code": {
            "python": "def solve(input_data):\n    s = input_data.strip()\n    # Your solution here\n    pass\n"
        },
        "time_limit_ms": 1000, "memory_limit_mb": 128,
    },
    {
        "title": "Reverse Linked List",
        "slug": "reverse-linked-list",
        "difficulty": "EASY",
        "description": """## Reverse Linked List

Given the head of a singly linked list represented as a space-separated sequence of integers, reverse the list and return it as a space-separated sequence.

### Constraints
- The number of nodes in the list is in range `[0, 5000]`
- `-5000 ≤ Node.val ≤ 5000`
""",
        "tags": ["Linked List", "Recursion"],
        "examples": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "1 2", "output": "2 1"},
            {"input": "", "output": ""},
        ],
        "test_cases": [
            {"input": "1 2 3 4 5", "expected": "5 4 3 2 1"},
            {"input": "1 2", "expected": "2 1"},
            {"input": "1", "expected": "1"},
            {"input": "", "expected": ""},
        ],
        "starter_code": {"python": "def solve(input_data):\n    nums = list(map(int, input_data.split())) if input_data.strip() else []\n    # Reverse and return as space-separated string\n    pass\n"},
        "time_limit_ms": 1000, "memory_limit_mb": 128,
    },
    {
        "title": "Climbing Stairs",
        "slug": "climbing-stairs",
        "difficulty": "EASY",
        "description": """## Climbing Stairs

You are climbing a staircase. It takes `n` steps to reach the top.

Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?

### Constraints
- `1 ≤ n ≤ 45`
""",
        "tags": ["Dynamic Programming", "Math"],
        "examples": [
            {"input": "2", "output": "2", "explanation": "Two ways: 1+1, or 2"},
            {"input": "3", "output": "3", "explanation": "Three ways: 1+1+1, 1+2, 2+1"},
        ],
        "test_cases": [
            {"input": "1", "expected": "1"},
            {"input": "2", "expected": "2"},
            {"input": "3", "expected": "3"},
            {"input": "5", "expected": "8"},
            {"input": "10", "expected": "89"},
            {"input": "45", "expected": "1836311903"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    n = int(input_data.strip())\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 1000, "memory_limit_mb": 128,
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "slug": "best-time-to-buy-sell-stock",
        "difficulty": "EASY",
        "description": """## Best Time to Buy and Sell Stock

You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.

You want to maximize your profit by choosing a **single day** to buy and a **different day in the future** to sell.

Return the maximum profit you can achieve. If no profit is possible, return `0`.

### Constraints
- `1 ≤ prices.length ≤ 10⁵`
- `0 ≤ prices[i] ≤ 10⁴`
""",
        "tags": ["Array", "Dynamic Programming"],
        "examples": [
            {"input": "7 1 5 3 6 4", "output": "5", "explanation": "Buy day 2 (price=1), sell day 5 (price=6). Profit = 6-1 = 5"},
            {"input": "7 6 4 3 1", "output": "0", "explanation": "No profitable transaction possible"},
        ],
        "test_cases": [
            {"input": "7 1 5 3 6 4", "expected": "5"},
            {"input": "7 6 4 3 1", "expected": "0"},
            {"input": "1 2", "expected": "1"},
            {"input": "2 4 1", "expected": "2"},
            {"input": "1", "expected": "0"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    prices = list(map(int, input_data.split()))\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 1000, "memory_limit_mb": 128,
    },
    {
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "difficulty": "MEDIUM",
        "description": """## Number of Islands

Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

**Input format:** First line is `m n`. Then `m` lines of `n` characters (0 or 1, space-separated).

### Constraints
- `1 ≤ m, n ≤ 300`
- `grid[i][j]` is `'0'` or `'1'`
""",
        "tags": ["Array", "Graph", "BFS"],
        "examples": [
            {"input": "4 5\\n1 1 1 1 0\\n1 1 0 1 0\\n1 1 0 0 0\\n0 0 0 0 0", "output": "1"},
            {"input": "4 5\\n1 1 0 0 0\\n1 1 0 0 0\\n0 0 1 0 0\\n0 0 0 1 1", "output": "3"},
        ],
        "test_cases": [
            {"input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "expected": "1"},
            {"input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", "expected": "3"},
            {"input": "1 1\n1", "expected": "1"},
            {"input": "1 1\n0", "expected": "0"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    m, n = map(int, lines[0].split())\n    grid = [list(map(int, lines[i+1].split())) for i in range(m)]\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 2000, "memory_limit_mb": 256,
    },
    {
        "title": "Coin Change",
        "slug": "coin-change",
        "difficulty": "MEDIUM",
        "description": """## Coin Change

You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return the **fewest number of coins** needed to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.

**Input format:** First line is the coin denominations space-separated. Second line is the target amount.

### Constraints
- `1 ≤ coins.length ≤ 12`
- `1 ≤ coins[i] ≤ 2³¹ - 1`
- `0 ≤ amount ≤ 10⁴`
""",
        "tags": ["Dynamic Programming", "BFS"],
        "examples": [
            {"input": "1 5 11\n15", "output": "3", "explanation": "11 + 1 + 1 + 1 = 14... wait, 11+4? Use 11+1+1+1+1? No: 5+5+5=15. 3 coins."},
            {"input": "2\n3", "output": "-1"},
        ],
        "test_cases": [
            {"input": "1 5 11\n15", "expected": "3"},
            {"input": "2\n3", "expected": "-1"},
            {"input": "1 2 5\n11", "expected": "3"},
            {"input": "1\n0", "expected": "0"},
            {"input": "1 2 5\n100", "expected": "20"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    coins = list(map(int, lines[0].split()))\n    amount = int(lines[1])\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 2000, "memory_limit_mb": 256,
    },
    {
        "title": "Word Search",
        "slug": "word-search",
        "difficulty": "MEDIUM",
        "description": """## Word Search

Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.

The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically adjacent). The same cell may not be used more than once.

**Input format:** First line `m n`. Next `m` lines with the board row (space-separated chars). Last line is the word.

### Constraints
- `1 ≤ m, n ≤ 6`
- `1 ≤ word.length ≤ 15`
""",
        "tags": ["Array", "Backtracking", "Graph"],
        "examples": [
            {"input": "4 4\nA B C E\nS F C S\nA D E E\n3\nABCCED", "output": "True"},
            {"input": "4 4\nA B C E\nS F C S\nA D E E\n4\nSEE", "output": "True"},
        ],
        "test_cases": [
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nABCCED", "expected": "True"},
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nSEE", "expected": "True"},
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nABCB", "expected": "False"},
            {"input": "1 1\na\na", "expected": "True"},
            {"input": "1 1\na\nb", "expected": "False"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    m, n = map(int, lines[0].split())\n    board = [lines[i+1].split() for i in range(m)]\n    word = lines[m+1].strip()\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 3000, "memory_limit_mb": 256,
    },
    {
        "title": "Find Median from Data Stream",
        "slug": "find-median-data-stream",
        "difficulty": "HARD",
        "description": """## Find Median from Data Stream

The **median** is the middle value in an ordered integer list. If the size of the list is even, there is no middle value and the median is the mean of the two middle values.

Given a stream of integers (one per line), after each insertion output the current median.

**Input:** Space-separated integers. **Output:** Medians after each insertion, one per line.

### Constraints
- `-10⁵ ≤ num ≤ 10⁵`
- `1 ≤ nums.length ≤ 5 × 10⁴`
""",
        "tags": ["Heap", "Sorting"],
        "examples": [
            {"input": "1 2 3", "output": "1.0\\n1.5\\n2.0"},
            {"input": "5 3 8 4", "output": "5.0\\n4.0\\n5.0\\n4.5"},
        ],
        "test_cases": [
            {"input": "1 2 3", "expected": "1.0\n1.5\n2.0"},
            {"input": "5 3 8 4", "expected": "5.0\n4.0\n5.0\n4.5"},
            {"input": "1", "expected": "1.0"},
            {"input": "6 10 2 6 5 0 6 3 1 0 0", "expected": "6.0\n8.0\n6.0\n6.0\n6.0\n5.5\n6.0\n5.5\n5.0\n4.5\n3.0"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    nums = list(map(int, input_data.split()))\n    results = []\n    # Process each number and append median to results\n    # ...\n    return '\\n'.join(results)\n"},
        "time_limit_ms": 3000, "memory_limit_mb": 256,
    },
    {
        "title": "LRU Cache",
        "slug": "lru-cache",
        "difficulty": "HARD",
        "description": """## LRU Cache

Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

**Input format:**
- First line: cache capacity
- Each subsequent line: `GET key` or `PUT key value`
- Output `-1` for cache misses on GET, otherwise the value. PUT outputs nothing.

### Constraints
- `1 ≤ capacity ≤ 3000`
- `0 ≤ key ≤ 10⁴`
- `0 ≤ value ≤ 10⁵`
""",
        "tags": ["Hash Table", "Linked List", "Design"],
        "examples": [
            {"input": "2\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1\nGET 3\nGET 4", "output": "1\n-1\n-1\n3\n4"},
        ],
        "test_cases": [
            {"input": "2\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1\nGET 3\nGET 4", "expected": "1\n-1\n-1\n3\n4"},
            {"input": "1\nPUT 2 1\nGET 2\nPUT 3 2\nGET 2\nGET 3", "expected": "1\n-1\n2"},
            {"input": "2\nGET 2\nPUT 2 6\nGET 1\nPUT 1 5\nPUT 1 2\nGET 1\nGET 2", "expected": "-1\n-1\n2\n6"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    capacity = int(lines[0])\n    results = []\n    # Implement LRU cache logic\n    for line in lines[1:]:\n        parts = line.split()\n        if parts[0] == 'GET':\n            # results.append(str(cache.get(int(parts[1]))))\n            pass\n        else:  # PUT\n            # cache.put(int(parts[1]), int(parts[2]))\n            pass\n    return '\\n'.join(results)\n"},
        "time_limit_ms": 2000, "memory_limit_mb": 256,
    },
    {
        "title": "Trapping Rain Water",
        "slug": "trapping-rain-water",
        "difficulty": "HARD",
        "description": """## Trapping Rain Water

Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.

### Constraints
- `n == height.length`
- `1 ≤ n ≤ 2 × 10⁴`
- `0 ≤ height[i] ≤ 10⁵`
""",
        "tags": ["Array", "Two Pointers", "Stack"],
        "examples": [
            {"input": "0 1 0 2 1 0 1 3 2 1 2 1", "output": "6"},
            {"input": "4 2 0 3 2 5", "output": "9"},
        ],
        "test_cases": [
            {"input": "0 1 0 2 1 0 1 3 2 1 2 1", "expected": "6"},
            {"input": "4 2 0 3 2 5", "expected": "9"},
            {"input": "3 0 2 0 4", "expected": "7"},
            {"input": "1 0 1", "expected": "1"},
            {"input": "0", "expected": "0"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    height = list(map(int, input_data.split()))\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 2000, "memory_limit_mb": 256,
    },
    {
        "title": "Regular Expression Matching",
        "slug": "regular-expression-matching",
        "difficulty": "ELITE",
        "description": """## Regular Expression Matching

Given an input string `s` and a pattern `p`, implement regular expression matching with support for `.` and `*` where:
- `.` Matches any single character
- `*` Matches zero or more of the preceding element

The matching should cover the **entire** input string.

**Input:** Two lines — the string `s` and the pattern `p`.

### Constraints
- `1 ≤ s.length ≤ 20`
- `1 ≤ p.length ≤ 30`
- `s` contains only lowercase letters
- `p` contains only lowercase letters, `.`, and `*`
""",
        "tags": ["String", "Dynamic Programming", "Recursion"],
        "examples": [
            {"input": "aa\na", "output": "False"},
            {"input": "aa\na*", "output": "True"},
            {"input": "ab\n.*", "output": "True"},
        ],
        "test_cases": [
            {"input": "aa\na", "expected": "False"},
            {"input": "aa\na*", "expected": "True"},
            {"input": "ab\n.*", "expected": "True"},
            {"input": "aab\nc*a*b", "expected": "True"},
            {"input": "mississippi\nmis*is*p*.", "expected": "False"},
            {"input": "a\n.*..a*", "expected": "False"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    s, p = lines[0], lines[1]\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 2000, "memory_limit_mb": 256,
    },
    {
        "title": "Minimum Window Substring",
        "slug": "minimum-window-substring",
        "difficulty": "ELITE",
        "description": """## Minimum Window Substring

Given two strings `s` and `t`, return the **minimum window substring** of `s` such that every character in `t` (including duplicates) is included in the window.

If there is no such substring, return an empty string `""`.

**Input:** Two lines — string `s` and string `t`.

### Constraints
- `1 ≤ s.length, t.length ≤ 10⁵`
- `s` and `t` consist of uppercase and lowercase English letters
""",
        "tags": ["String", "Sliding Window", "Hash Table"],
        "examples": [
            {"input": "ADOBECODEBANC\nABC", "output": "BANC"},
            {"input": "a\na", "output": "a"},
            {"input": "a\naa", "output": ""},
        ],
        "test_cases": [
            {"input": "ADOBECODEBANC\nABC", "expected": "BANC"},
            {"input": "a\na", "expected": "a"},
            {"input": "a\naa", "expected": ""},
            {"input": "bba\nab", "expected": "ba"},
            {"input": "cabwefgewcwaefgcf\ncae", "expected": "cwae"},
        ],
        "starter_code": {"python": "def solve(input_data):\n    lines = input_data.strip().split('\\n')\n    s, t = lines[0], lines[1]\n    # Your solution here\n    pass\n"},
        "time_limit_ms": 3000, "memory_limit_mb": 256,
    },
]

# Patch the Command class to also seed EXTRA_PROBLEMS
_original_handle = Command.handle

def _patched_handle(self, *args, **options):
    _original_handle(self, *args, **options)
    self.stdout.write('\nSeeding extra problems...')
    for p_data in EXTRA_PROBLEMS:
        tags_data = p_data.pop('tags', [])
        problem, created = Problem.objects.get_or_create(
            slug=p_data['slug'],
            defaults=p_data,
        )
        if not created:
            for k, v in p_data.items():
                setattr(problem, k, v)
            problem.save()
        problem.tags.clear()
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(
                name=tag_name,
                defaults={'color': TAG_COLORS.get(tag_name, '#aabbcc')}
            )
            problem.tags.add(tag)
        action = 'Created' if created else 'Updated'
        self.stdout.write(f'  {action}: [{problem.difficulty}] {problem.title}')
    total = len(SAMPLE_PROBLEMS) + len(EXTRA_PROBLEMS)
    self.stdout.write(self.style.SUCCESS(f'\nTotal problems seeded: {total}'))

Command.handle = _patched_handle
