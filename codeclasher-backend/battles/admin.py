from django.contrib import admin
from .models import Battle, Submission, MatchQueue


class SubmissionInline(admin.TabularInline):
    model = Submission
    extra = 0
    readonly_fields = ('user', 'language', 'verdict', 'damage_dealt', 'submitted_at')
    fields = ('user', 'language', 'verdict', 'damage_dealt', 'submitted_at')
    can_delete = False


@admin.register(Battle)
class BattleAdmin(admin.ModelAdmin):
    list_display   = ('room_code', 'mode', 'status', 'player1', 'player2', 'winner', 'created_at')
    list_filter    = ('mode', 'status')
    search_fields  = ('room_code', 'player1__username', 'player2__username')
    readonly_fields = ('room_code', 'created_at', 'started_at', 'ended_at')
    inlines        = [SubmissionInline]
    ordering       = ('-created_at',)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display  = ('user', 'battle', 'language', 'verdict', 'damage_dealt', 'submitted_at')
    list_filter   = ('verdict', 'language')
    search_fields = ('user__username', 'battle__room_code')
    readonly_fields = ('submitted_at',)
    ordering      = ('-submitted_at',)


@admin.register(MatchQueue)
class MatchQueueAdmin(admin.ModelAdmin):
    list_display  = ('user', 'mode', 'rating', 'joined_at')
    list_filter   = ('mode',)
    search_fields = ('user__username',)
    ordering      = ('joined_at',)
