from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Rank(models.TextChoices):
    UNRANKED    = 'UNRANKED', '⚫ Unranked'
    BRONZE      = 'BRONZE',   '🥉 Bronze'
    SILVER      = 'SILVER',   '🥈 Silver'
    GOLD        = 'GOLD',     '🥇 Gold'
    PLATINUM    = 'PLATINUM', '💠 Platinum'
    DIAMOND     = 'DIAMOND',  '💎 Diamond'
    MASTER      = 'MASTER',   '🔮 Master'
    GRANDMASTER = 'GRANDMASTER', '👑 Grandmaster'


RANK_THRESHOLDS = {
    Rank.UNRANKED:    0,
    Rank.BRONZE:      100,
    Rank.SILVER:      500,
    Rank.GOLD:        1500,
    Rank.PLATINUM:    3000,
    Rank.DIAMOND:     6000,
    Rank.MASTER:      10000,
    Rank.GRANDMASTER: 20000,
}


def calculate_rank(rating: int) -> str:
    rank = Rank.UNRANKED
    for r, threshold in RANK_THRESHOLDS.items():
        if rating >= threshold:
            rank = r
    return rank


class UserProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar          = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio             = models.TextField(max_length=300, blank=True)
    country         = models.CharField(max_length=100, blank=True)

    # Stats
    rating          = models.IntegerField(default=0)
    xp              = models.IntegerField(default=0)
    level           = models.IntegerField(default=1)
    rank            = models.CharField(max_length=20, choices=Rank.choices, default=Rank.UNRANKED)

    # Battle record
    battles_played  = models.IntegerField(default=0)
    battles_won     = models.IntegerField(default=0)
    battles_lost    = models.IntegerField(default=0)
    win_streak      = models.IntegerField(default=0)
    max_win_streak  = models.IntegerField(default=0)

    # Achievements
    total_submissions   = models.IntegerField(default=0)
    correct_submissions = models.IntegerField(default=0)
    problems_solved     = models.IntegerField(default=0)

    # Online status
    is_online       = models.BooleanField(default=False)
    last_seen       = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-rating']

    def __str__(self):
        return f"{self.user.username} — {self.rank} (Rating: {self.rating})"

    @property
    def win_rate(self):
        if self.battles_played == 0:
            return 0
        return round((self.battles_won / self.battles_played) * 100, 1)

    @property
    def accuracy(self):
        if self.total_submissions == 0:
            return 0
        return round((self.correct_submissions / self.total_submissions) * 100, 1)

    @property
    def xp_to_next_level(self):
        return self.level * 500

    @property
    def xp_progress_percent(self):
        xp_in_level = self.xp % (self.level * 500)
        return round((xp_in_level / (self.level * 500)) * 100, 1)

    def add_xp(self, amount: int):
        self.xp += amount
        # Level up check
        while self.xp >= self.level * 500:
            self.xp -= self.level * 500
            self.level += 1
        self.save()

    def update_rank(self):
        self.rank = calculate_rank(self.rating)
        self.save()

    def record_win(self, xp_gained: int, rating_delta: int):
        self.battles_played += 1
        self.battles_won += 1
        self.win_streak += 1
        self.max_win_streak = max(self.max_win_streak, self.win_streak)
        self.rating = max(0, self.rating + rating_delta)
        self.add_xp(xp_gained)
        self.update_rank()

    def record_loss(self, xp_gained: int, rating_delta: int):
        self.battles_played += 1
        self.battles_lost += 1
        self.win_streak = 0
        self.rating = max(0, self.rating - rating_delta)
        self.add_xp(xp_gained)
        self.update_rank()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class Achievement(models.Model):
    class Category(models.TextChoices):
        BATTLE  = 'BATTLE', 'Battle'
        SOLVE   = 'SOLVE', 'Problem Solving'
        STREAK  = 'STREAK', 'Streak'
        SPECIAL = 'SPECIAL', 'Special'

    name        = models.CharField(max_length=100)
    description = models.TextField()
    icon        = models.CharField(max_length=10)  # emoji
    category    = models.CharField(max_length=20, choices=Category.choices)
    xp_reward   = models.IntegerField(default=50)
    condition_value = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.icon} {self.name}"


class UserAchievement(models.Model):
    user        = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')
