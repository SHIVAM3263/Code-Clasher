from django.db import models
from django.contrib.auth.models import User


class Tag(models.Model):
    name  = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#00ffff')

    def __str__(self):
        return self.name


class Problem(models.Model):
    class Difficulty(models.TextChoices):
        EASY   = 'EASY',   '🟢 Easy'
        MEDIUM = 'MEDIUM', '🟡 Medium'
        HARD   = 'HARD',   '🔴 Hard'
        ELITE  = 'ELITE',  '💀 Elite'

    title       = models.CharField(max_length=200)
    slug        = models.SlugField(unique=True)
    description = models.TextField()
    difficulty  = models.CharField(max_length=10, choices=Difficulty.choices)
    tags        = models.ManyToManyField(Tag, blank=True)

    # Constraints
    time_limit_ms   = models.IntegerField(default=1000)   # milliseconds
    memory_limit_mb = models.IntegerField(default=256)    # MB

    # Examples shown to user
    examples = models.JSONField(default=list)
    # Hidden test cases [{"input": "...", "output": "..."}]
    test_cases = models.JSONField(default=list)

    # Starter code templates per language
    starter_code = models.JSONField(default=dict)  # {"python": "def solve():", "cpp": "..."}

    # Solution
    editorial = models.TextField(blank=True)

    # Stats
    total_attempts = models.IntegerField(default=0)
    total_accepted = models.IntegerField(default=0)

    # Battle metadata
    battle_weight = models.IntegerField(default=1)  # Higher = more likely in ranked battles
    created_at    = models.DateTimeField(auto_now_add=True)
    created_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['difficulty', 'title']

    def __str__(self):
        return f"[{self.difficulty}] {self.title}"

    @property
    def acceptance_rate(self):
        if self.total_attempts == 0:
            return 0
        return round((self.total_accepted / self.total_attempts) * 100, 1)

    @property
    def xp_reward(self):
        rewards = {
            'EASY': 50,
            'MEDIUM': 100,
            'HARD': 200,
            'ELITE': 400,
        }
        return rewards.get(self.difficulty, 50)


class TestCase(models.Model):
    """Individual test cases for a problem (alternative normalized storage)"""
    problem     = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='test_case_set')
    input_data  = models.TextField()
    output_data = models.TextField()
    is_sample   = models.BooleanField(default=False)  # shown to user
    order       = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
