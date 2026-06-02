from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Battle, Submission, MatchQueue
from users.serializers import UserProfileSummarySerializer
from problems.serializers import ProblemDetailSerializer


class SubmissionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'username', 'language', 'verdict', 'code',
            'test_cases_passed', 'test_cases_total',
            'runtime_ms', 'memory_mb', 'error_msg',
            'damage_dealt', 'submitted_at',
        ]
        read_only_fields = [
            'verdict', 'test_cases_passed', 'test_cases_total',
            'runtime_ms', 'memory_mb', 'error_msg', 'damage_dealt',
        ]


class BattleSerializer(serializers.ModelSerializer):
    player1_profile = serializers.SerializerMethodField()
    player2_profile = serializers.SerializerMethodField()
    winner_username = serializers.CharField(source='winner.username', read_only=True)
    problem_data    = ProblemDetailSerializer(source='problem', read_only=True)
    submissions     = SubmissionSerializer(many=True, read_only=True)
    time_remaining  = serializers.IntegerField(read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = Battle
        fields = [
            'id', 'room_code', 'mode', 'status',
            'player1_profile', 'player2_profile',
            'winner_username', 'problem_data',
            'p1_health', 'p2_health',
            'p1_rating_before', 'p2_rating_before',
            'p1_rating_delta', 'p2_rating_delta',
            'time_limit', 'time_remaining', 'duration_seconds',
            'started_at', 'ended_at', 'created_at',
            'submissions',
        ]

    def get_player1_profile(self, obj):
        return UserProfileSummarySerializer(obj.player1.profile).data

    def get_player2_profile(self, obj):
        if obj.player2:
            return UserProfileSummarySerializer(obj.player2.profile).data
        return None


class BattleListSerializer(serializers.ModelSerializer):
    player1_username = serializers.CharField(source='player1.username')
    player2_username = serializers.SerializerMethodField()
    winner_username  = serializers.CharField(source='winner.username', allow_null=True)
    problem_title    = serializers.CharField(source='problem.title', allow_null=True)
    problem_difficulty = serializers.CharField(source='problem.difficulty', allow_null=True)

    class Meta:
        model = Battle
        fields = [
            'id', 'room_code', 'mode', 'status',
            'player1_username', 'player2_username', 'winner_username',
            'problem_title', 'problem_difficulty',
            'p1_health', 'p2_health',
            'p1_rating_delta', 'p2_rating_delta',
            'started_at', 'ended_at', 'created_at',
        ]

    def get_player2_username(self, obj):
        return obj.player2.username if obj.player2 else None


class MatchQueueSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MatchQueue
        fields = ['id', 'username', 'mode', 'rating', 'joined_at']
