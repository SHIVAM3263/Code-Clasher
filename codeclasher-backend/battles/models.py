from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from problems.models import Problem


class BattleMode(models.TextChoices):
    CASUAL = 'CASUAL', 'Casual'
    RANKED = 'RANKED', 'Ranked'
    CUSTOM = 'CUSTOM', 'Custom'
    TOURNAMENT = 'TOURNAMENT', 'Tournament'


class BattleStatus(models.TextChoices):
    WAITING    = 'WAITING', 'Waiting for opponent'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED  = 'COMPLETED', 'Completed'
    CANCELLED  = 'CANCELLED', 'Cancelled'
    DRAW       = 'DRAW', 'Draw'


class Battle(models.Model):
    mode        = models.CharField(max_length=20, choices=BattleMode.choices, default=BattleMode.CASUAL)
    status      = models.CharField(max_length=20, choices=BattleStatus.choices, default=BattleStatus.WAITING)
    problem     = models.ForeignKey(Problem, on_delete=models.SET_NULL, null=True, blank=True)

    # Players
    player1     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='battles_as_p1')
    player2     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='battles_as_p2', null=True, blank=True)
    winner      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='battles_won_set')

    # Battle health system
    p1_health   = models.IntegerField(default=100)
    p2_health   = models.IntegerField(default=100)

    # Rating changes
    p1_rating_before = models.IntegerField(default=0)
    p2_rating_before = models.IntegerField(default=0)
    p1_rating_delta  = models.IntegerField(default=0)
    p2_rating_delta  = models.IntegerField(default=0)

    # Timing
    time_limit  = models.IntegerField(default=1800)  # 30 min in seconds
    started_at  = models.DateTimeField(null=True, blank=True)
    ended_at    = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    # Room
    room_code   = models.CharField(max_length=8, unique=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        p2 = self.player2.username if self.player2 else 'TBD'
        return f"Battle {self.room_code}: {self.player1.username} vs {p2} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.room_code:
            import secrets
            self.room_code = secrets.token_hex(4).upper()
        super().save(*args, **kwargs)

    @property
    def duration_seconds(self):
        if self.started_at and self.ended_at:
            return int((self.ended_at - self.started_at).total_seconds())
        return 0

    @property
    def time_remaining(self):
        if not self.started_at or self.status != BattleStatus.IN_PROGRESS:
            return self.time_limit
        elapsed = int((timezone.now() - self.started_at).total_seconds())
        return max(0, self.time_limit - elapsed)

    def start(self):
        self.status = BattleStatus.IN_PROGRESS
        self.started_at = timezone.now()
        self.p1_rating_before = self.player1.profile.rating
        self.p2_rating_before = self.player2.profile.rating if self.player2 else 0
        self.save()

    def calculate_rating_delta(self, winner_rating: int, loser_rating: int) -> tuple:
        """Simple Elo-like calculation"""
        K = 32
        expected = 1 / (1 + 10 ** ((loser_rating - winner_rating) / 400))
        winner_delta = int(K * (1 - expected))
        loser_delta  = int(K * expected)
        return winner_delta, loser_delta

    def end(self, winner: User = None):
        self.ended_at = timezone.now()
        if winner:
            self.winner = winner
            self.status = BattleStatus.COMPLETED
            loser = self.player2 if winner == self.player1 else self.player1
            w_delta, l_delta = self.calculate_rating_delta(
                winner.profile.rating, loser.profile.rating
            )
            if winner == self.player1:
                self.p1_rating_delta = w_delta
                self.p2_rating_delta = -l_delta
            else:
                self.p1_rating_delta = -l_delta
                self.p2_rating_delta = w_delta
            # Update profiles
            winner.profile.record_win(xp_gained=100, rating_delta=w_delta)
            loser.profile.record_loss(xp_gained=25, rating_delta=l_delta)
        else:
            self.status = BattleStatus.DRAW
        self.save()


class Submission(models.Model):
    class Verdict(models.TextChoices):
        ACCEPTED           = 'AC', 'Accepted'
        WRONG_ANSWER       = 'WA', 'Wrong Answer'
        TIME_LIMIT         = 'TLE', 'Time Limit Exceeded'
        MEMORY_LIMIT       = 'MLE', 'Memory Limit Exceeded'
        RUNTIME_ERROR      = 'RE', 'Runtime Error'
        COMPILATION_ERROR  = 'CE', 'Compilation Error'
        PENDING            = 'PE', 'Pending'

    battle      = models.ForeignKey(Battle, on_delete=models.CASCADE, related_name='submissions', null=True, blank=True)
    problem     = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions')
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')

    code        = models.TextField()
    language    = models.CharField(max_length=20, default='python')
    verdict     = models.CharField(max_length=5, choices=Verdict.choices, default=Verdict.PENDING)

    # Results
    test_cases_passed = models.IntegerField(default=0)
    test_cases_total  = models.IntegerField(default=0)
    runtime_ms  = models.IntegerField(default=0)
    memory_mb   = models.FloatField(default=0)
    error_msg   = models.TextField(blank=True)

    # Damage dealt (if wrong)
    damage_dealt = models.IntegerField(default=0)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} — {self.verdict} on {self.problem.title}"


class MatchQueue(models.Model):
    """Matchmaking queue entry"""
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='queue_entry')
    mode        = models.CharField(max_length=20, choices=BattleMode.choices, default=BattleMode.RANKED)
    rating      = models.IntegerField(default=0)
    joined_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} in queue ({self.mode})"
