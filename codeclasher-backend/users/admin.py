from django.contrib import admin
from .models import UserProfile, Achievement, UserAchievement


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'rank', 'rating', 'level', 'xp', 'battles_won', 'battles_lost', 'battles_played')
    list_filter   = ('rank',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-rating',)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'xp_reward')
    list_filter   = ('category',)
    search_fields = ('name',)


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display  = ('user', 'achievement', 'earned_at')
    list_filter   = ('achievement',)
    search_fields = ('user__user__username',)
